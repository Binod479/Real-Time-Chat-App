import React from 'react';
import { Box, Typography } from '@mui/material';

export const TypingIndicator = ({ typingUsers = [] }) => {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.displayName || u.username).join(', ');
  const text = typingUsers.length === 1 ? `${names} is typing` : `${names} are typing`;

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: 0.8,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </Box>
      <Typography variant="caption" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
        {text}...
      </Typography>
    </Box>
  );
};

export default TypingIndicator;
