import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Tooltip,
  styled,
} from '@mui/material';
import {
  ArrowBack,
  InfoOutlined,
  Groups,
  Person,
} from '@mui/icons-material';
import { isToday, isYesterday, format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import chatService from '../../services/chatService.js';
import { MessageBubble } from './MessageBubble.jsx';
import { MessageInput } from './MessageInput.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { RoomInfoModal } from '../modals/RoomInfoModal.jsx';

const StatusDot = styled(Box)(({ theme, online }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#10b981' : 'transparent',
  border: online ? `2px solid ${theme.palette.background.paper}` : 'none',
  position: 'absolute',
  bottom: 0,
  right: 0,
}));

export const ChatArea = ({ roomId, onBackToSidebar }) => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom smoothly
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch room details and initial messages on roomId change
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    setLoading(true);
    setTypingUsers([]);

    const loadData = async () => {
      try {
        const [roomData, messagesData] = await Promise.all([
          chatService.getRoomDetails(roomId),
          chatService.getMessages(roomId),
        ]);

        if (isMounted) {
          setRoom(roomData);
          setMessages(messagesData.messages || []);
          setLoading(false);
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Setup Socket.IO listeners for the active room
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room channel
    socket.emit('join_room', roomId);

    // Listen for incoming messages
    const handleReceiveMessage = (newMsg) => {
      if (newMsg.roomId === roomId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    };

    // Listen for typing events
    const handleUserTyping = (data) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === data.userId)) return prev;
          return [...prev, data];
        });
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, roomId, user?.id]);

  // Handle sending a new message
  const handleSendMessage = (content) => {
    if (!socket || !roomId || !content.trim()) return;

    socket.emit('send_message', {
      roomId,
      content,
    });
  };

  const handleTyping = () => {
    if (socket && roomId) {
      socket.emit('typing', { roomId });
    }
  };

  const handleStopTyping = () => {
    if (socket && roomId) {
      socket.emit('stop_typing', { roomId });
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Conversation not found.</Typography>
      </Box>
    );
  }

  const isDirect = room.type === 'direct';
  const recipientOnline = isDirect && room.recipient ? isUserOnline(room.recipient.id) : false;

  // Format date dividers
  const renderDateDivider = (currentDate, prevDate) => {
    if (!currentDate) return null;
    const cur = new Date(currentDate);
    const prev = prevDate ? new Date(prevDate) : null;

    if (prev && cur.toDateString() === prev.toDateString()) {
      return null;
    }

    let label = format(cur, 'MMMM d, yyyy');
    if (isToday(cur)) label = 'Today';
    else if (isYesterday(cur)) label = 'Yesterday';

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Box
          sx={{
            px: 2,
            py: 0.4,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            color: 'text.secondary',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* 1. Chat Header */}
      <Box
        sx={{
          p: 1.8,
          px: { xs: 1.5, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Back button for small screens */}
          <IconButton
            onClick={onBackToSidebar}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: -0.5 }}
            size="small"
          >
            <ArrowBack />
          </IconButton>

          {/* Avatar with status dot */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            {isDirect ? (
              <Avatar
                src={room.recipient?.avatarUrl || room.avatarUrl}
                alt={room.name}
                sx={{ width: 44, height: 44 }}
              >
                {room.name?.charAt(0) || <Person />}
              </Avatar>
            ) : (
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', color: '#fff' }}>
                <Groups />
              </Avatar>
            )}
            {isDirect && <StatusDot online={recipientOnline} />}
          </Box>

          {/* Header Title & Subtitle */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {room.name}
            </Typography>

            <Typography variant="caption" noWrap sx={{ display: 'block' }}>
              {isDirect ? (
                recipientOnline ? (
                  <Box component="span" sx={{ color: '#10b981', fontWeight: 600 }}>
                    Active now
                  </Box>
                ) : (
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    Offline
                  </Box>
                )
              ) : (
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {room.members?.length || room.memberCount || 2} members
                </Box>
              )}
            </Typography>
          </Box>
        </Box>

        {/* Info button */}
        <Tooltip title="Conversation Details">
          <IconButton onClick={() => setInfoModalOpen(true)} size="small" color="inherit">
            <InfoOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 2. Messages Scrollable Body */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ my: 'auto', textAlign: 'center', p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No messages here yet. Say hi and start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

            // Show avatar only on last message in a consecutive group from same sender
            const showAvatar = !nextMsg || nextMsg.senderId !== msg.senderId;

            return (
              <React.Fragment key={msg.id || index}>
                {renderDateDivider(msg.createdAt, prevMsg?.createdAt)}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  showSenderName={!isDirect && !isMe}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Real-time Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      {/* 3. Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />

      {/* Room Details Modal */}
      <RoomInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        roomDetails={room}
      />
    </Box>
  );
};

export default ChatArea;
