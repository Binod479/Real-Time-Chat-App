import { query } from '../config/db.js';

// In-memory mapping of active users to connected socket IDs: Map<userId, Set<socketId>>
const activeSockets = new Map();

export const registerChatHandlers = (io) => {
  io.on('connection', async (socket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user.id;
    console.log(`🔌 [Socket Connected] ${user.username} (${socket.id})`);

    // Track user socket
    let isFirstConnection = false;
    if (!activeSockets.has(userId)) {
      activeSockets.set(userId, new Set());
      isFirstConnection = true;
    }
    activeSockets.get(userId).add(socket.id);

    // If first connection for this user, mark online in DB and broadcast presence
    if (isFirstConnection) {
      try {
        await query('UPDATE users SET is_online = TRUE WHERE id = $1', [userId]);
        socket.broadcast.emit('user_presence_change', {
          userId,
          isOnline: true,
        });
      } catch (err) {
        console.error('Error updating online presence on connect:', err.message);
      }
    }

    // Send the current list of online user IDs to the newly connected socket
    const onlineUserIds = Array.from(activeSockets.keys());
    socket.emit('initial_online_users', onlineUserIds);

    // Event: Join a chat room
    socket.on('join_room', async (roomId, callback) => {
      try {
        if (!roomId) return;
        
        // Validate user belongs to this room
        const memberCheck = await query(
          'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
          [roomId, userId]
        );

        if (memberCheck.rows.length === 0) {
          if (typeof callback === 'function') {
            callback({ success: false, message: 'Not authorized for this room' });
          }
          return;
        }

        socket.join(roomId);
        console.log(`👥 [Room Joined] ${user.username} joined room: ${roomId}`);
        if (typeof callback === 'function') {
          callback({ success: true, roomId });
        }
      } catch (err) {
        console.error('Error in join_room:', err.message);
      }
    });

    // Event: Leave a chat room
    socket.on('leave_room', (roomId) => {
      if (roomId) {
        socket.leave(roomId);
        console.log(`👋 [Room Left] ${user.username} left room: ${roomId}`);
      }
    });

    // Event: Send a message
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, content, messageType = 'text' } = data;

        if (!roomId || !content || content.trim().length === 0) {
          if (typeof callback === 'function') {
            callback({ success: false, message: 'Room ID and message content are required.' });
          }
          return;
        }

        // Verify room membership
        const memberCheck = await query(
          'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
          [roomId, userId]
        );

        if (memberCheck.rows.length === 0) {
          if (typeof callback === 'function') {
            callback({ success: false, message: 'You are not a member of this room.' });
          }
          return;
        }

        // Save to PostgreSQL
        const insertRes = await query(
          `INSERT INTO messages (room_id, sender_id, content, message_type)
           VALUES ($1, $2, $3, $4)
           RETURNING id, room_id, sender_id, content, message_type, created_at`,
          [roomId, userId, content.trim(), messageType]
        );

        const newMsg = insertRes.rows[0];

        // Update room's updated_at
        await query('UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [roomId]);

        const messagePayload = {
          id: newMsg.id,
          roomId: newMsg.room_id,
          senderId: newMsg.sender_id,
          content: newMsg.content,
          messageType: newMsg.message_type,
          createdAt: newMsg.created_at,
          sender: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
        };

        // Broadcast to everyone in the room (including sender or acknowledge sender)
        io.to(roomId).emit('receive_message', messagePayload);

        // Notify all clients for sidebar last-message preview & active sorting
        io.emit('room_activity', {
          roomId,
          lastMessage: {
            content: messagePayload.content,
            senderName: user.displayName,
            createdAt: messagePayload.createdAt,
          },
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: messagePayload });
        }
      } catch (err) {
        console.error('Error sending message over socket:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Failed to send message.' });
        }
      }
    });

    // Event: User typing indicator
    socket.on('typing', ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
      });
    });

    // Event: User stopped typing
    socket.on('stop_typing', ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('user_stop_typing', {
        roomId,
        userId: user.id,
      });
    });

    // Event: Disconnect
    socket.on('disconnect', async () => {
      console.log(`⚡ [Socket Disconnected] ${user.username} (${socket.id})`);
      const userSockets = activeSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSockets.delete(userId);

          // Mark offline in DB
          try {
            await query(
              'UPDATE users SET is_online = FALSE, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
              [userId]
            );
            io.emit('user_presence_change', {
              userId,
              isOnline: false,
              lastSeen: new Date().toISOString(),
            });
          } catch (err) {
            console.error('Error updating offline presence on disconnect:', err.message);
          }
        }
      }
    });
  });
};
