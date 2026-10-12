import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  Alert,
  Stack,
} from '@mui/material';
import {
  Search,
  PersonAdd,
  GroupAdd,
  Groups,
} from '@mui/icons-material';
import chatService from '../../services/chatService.js';
import { useSocket } from '../../context/SocketContext.jsx';

export const NewChatModal = ({ open, onClose, onRoomCreated }) => {
  const { isUserOnline } = useSocket();
  const [tab, setTab] = useState(0); // 0 = Direct, 1 = Group

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Group form state
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setGroupName('');
      setSelectedUserIds([]);
      setError(null);
      return;
    }

    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const userList = await chatService.getUsers();
        setUsers(userList);
      } catch (err) {
        setError('Failed to fetch user list.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [open]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    );
  });

  const handleStartDirectChat = async (targetUser) => {
    setCreating(true);
    setError(null);
    try {
      const data = await chatService.getOrCreateDirectRoom(targetUser.id);
      onRoomCreated(data.room);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open direct conversation.');
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please provide a name for the group.');
      return;
    }

    if (selectedUserIds.length === 0) {
      setError('Please select at least one member to join the group.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const newRoom = await chatService.createGroupRoom(groupName.trim(), selectedUserIds);
      onRoomCreated(newRoom);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Start a Conversation
        </Typography>
      </DialogTitle>

      <Box sx={{ px: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, val) => {
            setTab(val);
            setError(null);
          }}
          variant="fullWidth"
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab icon={<PersonAdd fontSize="small" />} iconPosition="start" label="Direct Message" />
          <Tab icon={<GroupAdd fontSize="small" />} iconPosition="start" label="New Group" />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tab 0: Direct Message */}
        {tab === 0 && (
          <Box>
            <TextField
              size="small"
              placeholder="Search users by name or username..."
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No users found.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 320, overflowY: 'auto' }} disablePadding>
                {filteredUsers.map((u) => {
                  const online = isUserOnline(u.id);
                  return (
                    <ListItemButton
                      key={u.id}
                      onClick={() => handleStartDirectChat(u)}
                      disabled={creating}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar src={u.avatarUrl} sx={{ width: 40, height: 40 }}>
                            {u.displayName?.charAt(0)}
                          </Avatar>
                          {online && (
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
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
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {u.displayName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            @{u.username} • {online ? 'Online' : 'Offline'}
                          </Typography>
                        }
                      />

                      <Button size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                        Chat
                      </Button>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        )}

        {/* Tab 1: Group Chat */}
        {tab === 1 && (
          <Box>
            <TextField
              label="Group Name"
              placeholder="e.g. Project Alpha, Design Sprint..."
              fullWidth
              size="small"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Selected Member Chips */}
            {selectedUserIds.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Selected Members ({selectedUserIds.length}):
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {selectedUserIds.map((id) => {
                    const u = users.find((user) => user.id === id);
                    return (
                      <Chip
                        key={id}
                        label={u?.displayName || u?.username || id}
                        onDelete={() => toggleUserSelection(id)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}

            <TextField
              size="small"
              placeholder="Search users to add..."
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <List sx={{ maxHeight: 240, overflowY: 'auto' }} disablePadding>
                {filteredUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  const online = isUserOnline(u.id);
                  return (
                    <ListItemButton
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <Checkbox checked={isChecked} edge="start" sx={{ mr: 1 }} />
                      <ListItemAvatar>
                        <Avatar src={u.avatarUrl} sx={{ width: 36, height: 36 }}>
                          {u.displayName?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={u.displayName}
                        secondary={`@${u.username} • ${online ? 'Online' : 'Offline'}`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={creating}>
          Cancel
        </Button>
        {tab === 1 && (
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUserIds.length === 0}
            startIcon={creating ? <CircularProgress size={16} /> : <Groups />}
          >
            {creating ? 'Creating...' : 'Create Group'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewChatModal;
