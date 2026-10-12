import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material';
import { DoneAll } from '@mui/icons-material';
import { format } from 'date-fns';

export const MessageBubble = ({ message, isMe, showAvatar = true, showSenderName = false }) => {
  if (message.messageType === 'system') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 4,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {message.content}
        </Box>
      </Box>
    );
  }

  const formatMessageTime = (dateStr) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return '';
    }
  };

  const senderName = message.sender?.displayName || message.sender?.username || 'User';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1,
        mb: 1.5,
        px: { xs: 1.5, sm: 3 },
      }}
    >
      {/* Sender Avatar for incoming messages */}
      {!isMe && (
        <Tooltip title={senderName}>
          <Avatar
            src={message.sender?.avatarUrl}
            alt={senderName}
            sx={{
              width: 32,
              height: 32,
              visibility: showAvatar ? 'visible' : 'hidden',
              fontSize: '0.85rem',
            }}
          >
            {senderName.charAt(0)}
          </Avatar>
        </Tooltip>
      )}

      {/* Message Content Container */}
      <Box
        sx={{
          maxWidth: { xs: '82%', sm: '70%', md: '60%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Sender Name for group chats */}
        {!isMe && showSenderName && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'primary.light',
              ml: 1,
              mb: 0.3,
              fontSize: '0.72rem',
            }}
          >
            {senderName}
          </Typography>
        )}

        {/* Bubble */}
        <Box
          sx={{
            p: 1.6,
            px: 2,
            borderRadius: 3.5,
            borderBottomRightRadius: isMe ? 4 : 20,
            borderBottomLeftRadius: !isMe ? 4 : 20,
            background: isMe
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : (theme) =>
                  theme.palette.mode === 'dark' ? '#1f2937' : '#f1f5f9',
            color: isMe ? '#ffffff' : 'text.primary',
            boxShadow: isMe
              ? '0 3px 10px rgba(99, 102, 241, 0.28)'
              : (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 2px 6px rgba(0, 0, 0, 0.25)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)',
            border: (theme) =>
              !isMe && theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.05)'
                : 'none',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          <Typography variant="body1" sx={{ fontSize: '0.93rem', lineHeight: 1.45 }}>
            {message.content}
          </Typography>

          {/* Timestamp & Read Receipt */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.5,
              mt: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.68rem',
                opacity: isMe ? 0.8 : 0.6,
                color: isMe ? 'inherit' : 'text.secondary',
              }}
            >
              {formatMessageTime(message.createdAt)}
            </Typography>

            {isMe && (
              <DoneAll sx={{ fontSize: 13, opacity: 0.85, color: '#ffffff' }} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;
