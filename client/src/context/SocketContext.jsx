import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUserIds(new Set());
      }
      return;
    }

    // Connect to Socket.IO backend via Vite proxy or direct
    const socketInstance = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to chat server:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('⚠️ [Socket.IO] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ [Socket.IO] Connection error:', error.message);
    });

    // Handle initial online users batch
    socketInstance.on('initial_online_users', (userIds) => {
      setOnlineUserIds(new Set(userIds));
    });

    // Handle individual user online/offline status updates
    socketInstance.on('user_presence_change', ({ userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUserIds.has(userId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
