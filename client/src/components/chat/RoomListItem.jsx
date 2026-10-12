import React from 'react';
import {
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Badge,
  Chip,
  styled,
} from '@mui/material';
import { Groups, Person } from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { useSocket } from '../../context/SocketContext.jsx';

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

export const RoomListItem = ({ room, isSelected, onClick }) => {
  const { isUserOnline } = useSocket();

  const isDirect = room.type === 'direct';
  const recipientOnline = isDirect && room.recipient ? isUserOnline(room.recipient.id) : false;

  // Format timestamp
  const formatLastMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      }
      if (isYesterday(date)) {
        return 'Yesterday';
      }
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const timeFormatted = room.lastMessage?.createdAt
    ? formatLastMessageTime(room.lastMessage.createdAt)
    : formatLastMessageTime(room.createdAt);

  return (
    <ListItemButton
      onClick={onClick}
      selected={isSelected}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2.5,
        mb: 0.5,
        mx: 1,
        transition: 'all 0.15s ease',
        '&.Mui-selected': {
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)',
          borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
        },
        '&:hover': {
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
        },
      }}
    >
      <ListItemAvatar sx={{ position: 'relative' }}>
        {isDirect ? (
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={room.recipient?.avatarUrl || room.avatarUrl}
              sx={{ width: 46, height: 46 }}
            >
              {room.name?.charAt(0) || <Person />}
            </Avatar>
            <StatusDot online={recipientOnline} />
          </Box>
        ) : (
          <Avatar
            sx={{
              width: 46,
              height: 46,
              bgcolor: 'primary.dark',
              color: '#fff',
            }}
          >
            <Groups />
          </Avatar>
        )}
      </ListItemAvatar>

      <ListItemText
        disableTypography
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? 'primary.main' : 'text.primary',
                maxWidth: 160,
              }}
            >
              {room.name || 'Untitled Chat'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              {timeFormatted}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="body2"
              noWrap
              color="text.secondary"
              sx={{
                fontSize: '0.82rem',
                maxWidth: 180,
                fontWeight: 400,
              }}
            >
              {room.lastMessage
                ? `${room.lastMessage.senderName ? `${room.lastMessage.senderName}: ` : ''}${room.lastMessage.content}`
                : 'No messages yet. Say hello!'}
            </Typography>

            {!isDirect && (
              <Chip
                label="GROUP"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
};

export default RoomListItem;
