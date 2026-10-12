import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/:roomId - Retrieve message history
router.get('/:roomId', authenticateToken, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit || '50', 10);
    const before = req.query.before; // ISO timestamp for pagination

    // Security: Check room membership
    const membership = await query(
      `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a member of this chat room.',
      });
    }

    let sql = `
      SELECT 
        m.id,
        m.room_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        u.username AS sender_username,
        u.display_name AS sender_display_name,
        u.avatar_url AS sender_avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = $1
    `;
    const params = [roomId];

    if (before) {
      sql += ` AND m.created_at < $2`;
      params.push(before);
    }

    sql += ` ORDER BY m.created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);

    const formattedMessages = result.rows.map((row) => ({
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type,
      createdAt: row.created_at,
      sender: {
        id: row.sender_id,
        username: row.sender_username,
        displayName: row.sender_display_name,
        avatarUrl: row.sender_avatar_url,
      },
    }));

    res.json({
      success: true,
      messages: formattedMessages,
      hasMore: formattedMessages.length === limit,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/:roomId - REST API endpoint to send a message
router.post('/:roomId', authenticateToken, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;
    const { content, messageType = 'text' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    // Verify membership
    const membership = await query(
      `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
      [roomId, currentUserId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat room.' });
    }

    // Insert message
    const insertRes = await query(
      `INSERT INTO messages (room_id, sender_id, content, message_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [roomId, currentUserId, content.trim(), messageType]
    );

    const savedMsg = insertRes.rows[0];

    // Update room updated_at timestamp
    await query('UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [roomId]);

    // Fetch sender info
    const senderRes = await query(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
      [currentUserId]
    );
    const sender = senderRes.rows[0];

    const messageResponse = {
      id: savedMsg.id,
      roomId: savedMsg.room_id,
      senderId: savedMsg.sender_id,
      content: savedMsg.content,
      messageType: savedMsg.message_type,
      createdAt: savedMsg.created_at,
      sender: {
        id: sender.id,
        username: sender.username,
        displayName: sender.display_name,
        avatarUrl: sender.avatar_url,
      },
    };

    // Broadcast via Socket.IO if instance available
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive_message', messageResponse);
      io.emit('room_activity', {
        roomId,
        lastMessage: {
          content: messageResponse.content,
          senderName: messageResponse.sender.displayName,
          createdAt: messageResponse.createdAt,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: messageResponse,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
