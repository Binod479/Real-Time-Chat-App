import express from 'express';
import { pool, query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to format a room record for client consumption
const formatRoomRow = (row, currentUserId) => {
  const isDirect = row.type === 'direct';
  let displayName = row.name;
  let avatarUrl = null;
  let recipient = null;

  if (isDirect && row.other_user_id) {
    displayName = row.other_display_name || row.other_username;
    avatarUrl = row.other_avatar_url;
    recipient = {
      id: row.other_user_id,
      username: row.other_username,
      displayName: row.other_display_name,
      avatarUrl: row.other_avatar_url,
      isOnline: row.other_is_online,
      lastSeen: row.other_last_seen,
    };
  }

  return {
    id: row.id,
    name: displayName,
    rawName: row.name,
    type: row.type,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipient,
    avatarUrl,
    memberCount: parseInt(row.member_count || '2', 10),
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          senderName: row.last_message_sender_name,
          createdAt: row.last_message_created_at,
        }
      : null,
  };
};

// GET /api/rooms - List all rooms current user is in
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Advanced SQL to fetch rooms, recipient user details for direct chats, member count, and latest message
    const sql = `
      WITH user_rooms AS (
        SELECT r.id, r.name, r.type, r.created_by, r.created_at, r.updated_at
        FROM rooms r
        JOIN room_members rm ON r.id = rm.room_id
        WHERE rm.user_id = $1
      ),
      room_recipients AS (
        SELECT 
          ur.id AS room_id,
          u.id AS other_user_id,
          u.username AS other_username,
          u.display_name AS other_display_name,
          u.avatar_url AS other_avatar_url,
          u.is_online AS other_is_online,
          u.last_seen AS other_last_seen
        FROM user_rooms ur
        JOIN room_members rm ON ur.id = rm.room_id AND rm.user_id != $1
        JOIN users u ON rm.user_id = u.id
        WHERE ur.type = 'direct'
      ),
      room_counts AS (
        SELECT room_id, COUNT(*) AS member_count
        FROM room_members
        GROUP BY room_id
      ),
      latest_messages AS (
        SELECT DISTINCT ON (m.room_id)
          m.room_id,
          m.content AS last_message_content,
          u.display_name AS last_message_sender_name,
          m.created_at AS last_message_created_at
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        ORDER BY m.room_id, m.created_at DESC
      )
      SELECT 
        ur.*,
        rc.member_count,
        rr.other_user_id,
        rr.other_username,
        rr.other_display_name,
        rr.other_avatar_url,
        rr.other_is_online,
        rr.other_last_seen,
        lm.last_message_content,
        lm.last_message_sender_name,
        lm.last_message_created_at
      FROM user_rooms ur
      LEFT JOIN room_counts rc ON ur.id = rc.room_id
      LEFT JOIN room_recipients rr ON ur.id = rr.room_id
      LEFT JOIN latest_messages lm ON ur.id = lm.room_id
      ORDER BY COALESCE(lm.last_message_created_at, ur.created_at) DESC;
    `;

    const result = await query(sql, [currentUserId]);
    const rooms = result.rows.map((row) => formatRoomRow(row, currentUserId));

    res.json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
});

// POST /api/rooms/direct - Get or Create a direct 1-on-1 chat
router.post('/direct', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const currentUserId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required.' });
    }

    if (currentUserId === recipientId) {
      return res.status(400).json({ success: false, message: 'Cannot create a direct chat with yourself.' });
    }

    // Check if recipient exists
    const userCheck = await client.query(
      'SELECT id, username, display_name, avatar_url, is_online, last_seen FROM users WHERE id = $1',
      [recipientId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    const recipientUser = userCheck.rows[0];

    // Check if direct room already exists
    const existingRoomQuery = `
      SELECT r.id, r.name, r.type, r.created_by, r.created_at
      FROM rooms r
      JOIN room_members rm1 ON r.id = rm1.room_id AND rm1.user_id = $1
      JOIN room_members rm2 ON r.id = rm2.room_id AND rm2.user_id = $2
      WHERE r.type = 'direct'
      LIMIT 1;
    `;

    const existingRoom = await client.query(existingRoomQuery, [currentUserId, recipientId]);

    if (existingRoom.rows.length > 0) {
      const room = existingRoom.rows[0];
      return res.json({
        success: true,
        isNew: false,
        room: {
          id: room.id,
          name: recipientUser.display_name,
          type: 'direct',
          recipient: {
            id: recipientUser.id,
            username: recipientUser.username,
            displayName: recipientUser.display_name,
            avatarUrl: recipientUser.avatar_url,
            isOnline: recipientUser.is_online,
            lastSeen: recipientUser.last_seen,
          },
          avatarUrl: recipientUser.avatar_url,
          memberCount: 2,
          lastMessage: null,
        },
      });
    }

    // Create new direct room
    await client.query('BEGIN');

    const newRoomRes = await client.query(
      `INSERT INTO rooms (type, created_by) VALUES ('direct', $1) RETURNING *`,
      [currentUserId]
    );

    const newRoom = newRoomRes.rows[0];

    await client.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, 'member'), ($1, $3, 'member')`,
      [newRoom.id, currentUserId, recipientId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      isNew: true,
      room: {
        id: newRoom.id,
        name: recipientUser.display_name,
        type: 'direct',
        recipient: {
          id: recipientUser.id,
          username: recipientUser.username,
          displayName: recipientUser.display_name,
          avatarUrl: recipientUser.avatar_url,
          isOnline: recipientUser.is_online,
          lastSeen: recipientUser.last_seen,
        },
        avatarUrl: recipientUser.avatar_url,
        memberCount: 2,
        lastMessage: null,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// POST /api/rooms/group - Create a new group chat
router.post('/group', authenticateToken, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const currentUserId = req.user.id;
    const { name, memberIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    // Ensure creator is in the members list
    const uniqueMemberIds = Array.from(new Set([currentUserId, ...memberIds]));

    if (uniqueMemberIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A group chat must have at least 2 members (including you).',
      });
    }

    await client.query('BEGIN');

    const groupRoomRes = await client.query(
      `INSERT INTO rooms (name, type, created_by) VALUES ($1, 'group', $2) RETURNING *`,
      [name.trim(), currentUserId]
    );

    const room = groupRoomRes.rows[0];

    for (const memberId of uniqueMemberIds) {
      const role = memberId === currentUserId ? 'admin' : 'member';
      await client.query(
        `INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)`,
        [room.id, memberId, role]
      );
    }

    // Insert welcome system message
    await client.query(
      `INSERT INTO messages (room_id, sender_id, content, message_type)
       VALUES ($1, $2, $3, 'system')`,
      [room.id, currentUserId, `Group "${name.trim()}" was created.`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        rawName: room.name,
        type: 'group',
        createdBy: room.created_by,
        createdAt: room.created_at,
        memberCount: uniqueMemberIds.length,
        avatarUrl: null,
        lastMessage: {
          content: `Group "${name.trim()}" was created.`,
          senderName: 'System',
          createdAt: room.created_at,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// GET /api/rooms/:roomId - Get single room details and members
router.get('/:roomId', authenticateToken, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    // Verify membership
    const membership = await query(
      `SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat room.' });
    }

    const roomRes = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chat room not found.' });
    }

    const room = roomRes.rows[0];

    // Fetch members
    const membersRes = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online, u.last_seen, rm.role, rm.joined_at
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.role ASC, u.display_name ASC`,
      [roomId]
    );

    const members = membersRes.rows.map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.display_name,
      avatarUrl: m.avatar_url,
      isOnline: m.is_online,
      lastSeen: m.last_seen,
      role: m.role,
      joinedAt: m.joined_at,
    }));

    // If direct room, extract recipient
    let recipient = null;
    let roomName = room.name;
    let avatarUrl = null;

    if (room.type === 'direct') {
      const otherUser = members.find((m) => m.id !== currentUserId);
      if (otherUser) {
        roomName = otherUser.displayName;
        avatarUrl = otherUser.avatarUrl;
        recipient = otherUser;
      }
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        name: roomName,
        rawName: room.name,
        type: room.type,
        createdBy: room.created_by,
        createdAt: room.created_at,
        recipient,
        avatarUrl,
        members,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
