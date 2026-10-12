import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_pern_chat_2026_xyz!@#$';
    const decoded = jwt.verify(token, secret);

    // Fetch user from DB to verify existence and get latest details
    const result = await query(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new Error('Authentication error: User not found.'));
    }

    const user = result.rows[0];
    socket.user = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };

    next();
  } catch (error) {
    console.error('Socket authentication failed:', error.message);
    next(new Error('Authentication error: Invalid or expired token.'));
  }
};
