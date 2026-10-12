import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Search,
  Clear,
  AddCommentOutlined,
  ChatBubbleOutline,
} from '@mui/icons-material';
import { AppHeader } from '../layout/AppHeader.jsx';
import { RoomListItem } from './RoomListItem.jsx';

export const ChatSidebar = ({
  rooms = [],
  loading = false,
  activeRoomId,
  onSelectRoom,
  onOpenNewChatModal,
  mode,
  toggleTheme,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState(0); // 0 = All, 1 = Direct, 2 = Groups

  const filteredRooms = rooms.filter((room) => {
    // Filter by tab
    if (filterTab === 1 && room.type !== 'direct') return false;
    if (filterTab === 2 && room.type !== 'group') return false;

    // Filter by search query
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const nameMatch = room.name?.toLowerCase().includes(query);
    const lastMsgMatch = room.lastMessage?.content?.toLowerCase().includes(query);
    return nameMatch || lastMsgMatch;
  });

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Top Header with Profile and Theme switch */}
      <AppHeader mode={mode} toggleTheme={toggleTheme} />

      {/* Action: New Chat button */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddCommentOutlined />}
          onClick={onOpenNewChatModal}
          sx={{
            py: 1.1,
            fontWeight: 700,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          New Conversation
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          size="small"
          placeholder="Search chats or messages..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            },
          }}
        />
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ px: 1, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={filterTab}
          onChange={(e, val) => setFilterTab(val)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.8rem',
              fontWeight: 600,
              py: 0.5,
            },
          }}
        >
          <Tab label={`All (${rooms.length})`} />
          <Tab label="Direct" />
          <Tab label="Groups" />
        </Tabs>
      </Box>

      {/* Room List Container */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : filteredRooms.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <ChatBubbleOutline sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {search ? 'No conversations matching your search.' : 'No conversations yet.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Click "New Conversation" to start chatting.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredRooms.map((room) => (
              <RoomListItem
                key={room.id}
                room={room}
                isSelected={room.id === activeRoomId}
                onClick={() => onSelectRoom(room.id)}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatSidebar;
