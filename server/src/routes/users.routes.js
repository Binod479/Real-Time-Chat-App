import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - List users with optional search filter
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const searchQuery = (req.query.search || '').trim().toLowerCase();

    let sql = `
      SELECT id, username, display_name, avatar_url, is_online, last_seen, created_at
      FROM users
      WHERE id != $1
    `;
    const params = [currentUserId];

    if (searchQuery) {
      sql += ` AND (LOWER(username) LIKE $2 OR LOWER(display_name) LIKE $2)`;
      params.push(`%${searchQuery}%`);
    }

    sql += ` ORDER BY is_online DESC, display_name ASC LIMIT 50`;

    const result = await query(sql, params);

    const formattedUsers = result.rows.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      isOnline: u.is_online,
      lastSeen: u.last_seen,
      createdAt: u.created_at,
    }));

    res.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get a user by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, username, display_name, avatar_url, is_online, last_seen, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        isOnline: u.is_online,
        lastSeen: u.last_seen,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
