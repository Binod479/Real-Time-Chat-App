import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { Groups, Person, CalendarToday } from '@mui/icons-material';
import { format } from 'date-fns';
import { useSocket } from '../../context/SocketContext.jsx';

export const RoomInfoModal = ({ open, onClose, roomDetails }) => {
  const { isUserOnline } = useSocket();

  if (!roomDetails) return null;

  const isGroup = roomDetails.type === 'group';
  const members = roomDetails.members || [];

  const createdFormatted = roomDetails.createdAt
    ? format(new Date(roomDetails.createdAt), 'MMMM d, yyyy')
    : 'Recently';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: isGroup ? 'primary.main' : 'secondary.main' }}>
            {isGroup ? <Groups /> : <Person />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {roomDetails.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isGroup ? `Group Chat • ${members.length} Members` : 'Direct Conversation'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {/* Creation Date Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
          <CalendarToday sx={{ fontSize: 16 }} />
          <Typography variant="caption">Created on {createdFormatted}</Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Member List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Participants ({members.length})
        </Typography>

        <List disablePadding sx={{ maxHeight: 280, overflowY: 'auto' }}>
          {members.map((member) => {
            const online = isUserOnline(member.id) || member.isOnline;
            return (
              <ListItem key={member.id} disableGutters sx={{ py: 0.8 }}>
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={member.avatarUrl}
                      alt={member.displayName}
                      sx={{ width: 36, height: 36 }}
                    >
                      {member.displayName?.charAt(0)}
                    </Avatar>
                    {online && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          border: '2px solid #fff',
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                        }}
                      />
                    )}
                  </Box>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.displayName || member.username}
                      </Typography>
                      {member.role === 'admin' && (
                        <Chip
                          label="Admin"
                          size="small"
                          color="primary"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        color: online ? '#10b981' : 'text.secondary',
                        fontWeight: online ? 600 : 400,
                      }}
                    >
                      {online ? 'Online now' : 'Offline'}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1.5 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomInfoModal;
