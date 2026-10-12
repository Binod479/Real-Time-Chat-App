import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  styled,
} from '@mui/material';
import {
  Logout,
  DarkMode,
  LightMode,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#10b981',
    color: '#10b981',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

export const AppHeader = ({ mode, toggleTheme }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  if (!user) return null;

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {/* Current User Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
        <OnlineBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
        >
          <Avatar
            src={user.avatarUrl}
            alt={user.displayName}
            sx={{ width: 42, height: 42, border: (theme) => `2px solid ${theme.palette.primary.main}` }}
          >
            {user.displayName?.charAt(0) || user.username?.charAt(0)}
          </Avatar>
        </OnlineBadge>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {user.displayName || user.username}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            @{user.username}
          </Typography>
        </Box>
      </Box>

      {/* Action Icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Connection Status Icon */}
        <Tooltip title={isConnected ? 'Connected to live chat' : 'Connecting to chat server...'}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              py: 0.4,
              borderRadius: 2,
              bgcolor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isConnected ? '#10b981' : '#ef4444',
              mr: 0.5,
            }}
          >
            {isConnected ? (
              <Wifi sx={{ fontSize: 16, mr: 0.5 }} />
            ) : (
              <WifiOff sx={{ fontSize: 16, mr: 0.5 }} />
            )}
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
              {isConnected ? 'LIVE' : 'SYNCING'}
            </Typography>
          </Box>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <IconButton onClick={toggleTheme} size="small" color="inherit">
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Logout */}
        <Tooltip title="Log Out">
          <IconButton onClick={logout} size="small" color="inherit">
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default AppHeader;
