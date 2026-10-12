import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import {
  ForumOutlined,
  AddCommentOutlined,
  FlashOnOutlined,
  SecurityOutlined,
  StorageOutlined,
} from '@mui/icons-material';

export const EmptyChatView = ({ onOpenNewChatModal }) => {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
        textAlign: 'center',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 520,
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            boxShadow: '0 12px 28px rgba(99, 102, 241, 0.4)',
          }}
        >
          <ForumOutlined sx={{ fontSize: 40 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          SphereChat Messenger
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
          Select any conversation from the sidebar or start a new direct or group discussion to begin real-time messaging.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<AddCommentOutlined />}
          onClick={onOpenNewChatModal}
          sx={{
            borderRadius: 3,
            px: 3.5,
            py: 1.2,
            fontWeight: 700,
            mb: 4,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          Start New Conversation
        </Button>

        <Stack direction="row" spacing={2} sx={{ width: '100%', pt: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <FlashOnOutlined sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
              Live Socket.IO
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              Sub-millisecond sync
            </Typography>
          </Box>

          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <StorageOutlined sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
              PostgreSQL
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              Durable message history
            </Typography>
          </Box>

          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <SecurityOutlined sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
              JWT Protected
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              Secure REST & Sockets
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default EmptyChatView;
