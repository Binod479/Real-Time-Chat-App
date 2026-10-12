import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pern_chat_2026_xyz!@#$';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, displayName, avatarUrl } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!validator.isEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check existing
    const existing = await query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
      [cleanUsername, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      const field = match.username === cleanUsername ? 'Username' : 'Email';
      return res.status(409).json({
        success: false,
        message: `${field} is already taken. Please choose another one.`,
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const effectiveDisplayName = (displayName && displayName.trim()) || username.trim();
    const defaultAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

    const insertResult = await query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_url, is_online)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, username, email, display_name, avatar_url, is_online, created_at`,
      [cleanUsername, cleanEmail, passwordHash, effectiveDisplayName, defaultAvatar]
    );

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name,
        avatarUrl: newUser.avatar_url,
        isOnline: newUser.is_online,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query by username or email
    const result = await query(
      `SELECT id, username, email, password_hash, display_name, avatar_url, is_online, last_seen, created_at
       FROM users
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    // Update user online status
    await query('UPDATE users SET is_online = TRUE WHERE id = $1', [user.id]);

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isOnline: true,
        lastSeen: user.last_seen,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, username, email, display_name, avatar_url, is_online, last_seen, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        username: u.username,
        email: u.email,
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

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    await query(
      'UPDATE users SET is_online = FALSE, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
