import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useSocket } from '../../context/SocketContext.jsx';
import chatService from '../../services/chatService.js';
import { ChatSidebar } from '../chat/ChatSidebar.jsx';
import { ChatArea } from '../chat/ChatArea.jsx';
import { EmptyChatView } from '../chat/EmptyChatView.jsx';
import { NewChatModal } from '../modals/NewChatModal.jsx';

export const MainLayout = ({ mode, toggleTheme }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { socket } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  // Load user's conversations
  const loadRooms = async () => {
    try {
      const roomList = await chatService.getRooms();
      setRooms(roomList);
      return roomList;
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Listen to global room activity to update last message preview and sort order
  useEffect(() => {
    if (!socket) return;

    const handleRoomActivity = ({ roomId, lastMessage }) => {
      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => r.id === roomId);
        if (roomIndex === -1) {
          // If brand new room, re-fetch list
          loadRooms();
          return prevRooms;
        }

        const updatedRoom = {
          ...prevRooms[roomIndex],
          lastMessage,
        };

        // Move active room to top
        const newRooms = [
          updatedRoom,
          ...prevRooms.slice(0, roomIndex),
          ...prevRooms.slice(roomIndex + 1),
        ];

        return newRooms;
      });
    };

    socket.on('room_activity', handleRoomActivity);

    return () => {
      socket.off('room_activity', handleRoomActivity);
    };
  }, [socket]);

  // Handler for newly created or opened room
  const handleRoomCreatedOrSelected = (room) => {
    setActiveRoomId(room.id);
    // Refresh rooms list
    loadRooms();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Sidebar: Show on desktop OR on mobile when no room is selected */}
      {(!isMobile || !activeRoomId) && (
        <Box
          sx={{
            width: { xs: '100%', md: 360, lg: 400 },
            height: '100%',
            flexShrink: 0,
          }}
        >
          <ChatSidebar
            rooms={rooms}
            loading={loadingRooms}
            activeRoomId={activeRoomId}
            onSelectRoom={(id) => setActiveRoomId(id)}
            onOpenNewChatModal={() => setNewChatModalOpen(true)}
            mode={mode}
            toggleTheme={toggleTheme}
          />
        </Box>
      )}

      {/* Main Chat Area: Show on desktop OR on mobile when room is selected */}
      {(!isMobile || activeRoomId) && (
        <Box
          sx={{
            flex: 1,
            height: '100%',
            minWidth: 0,
          }}
        >
          {activeRoomId ? (
            <ChatArea
              roomId={activeRoomId}
              onBackToSidebar={() => setActiveRoomId(null)}
            />
          ) : (
            <EmptyChatView onOpenNewChatModal={() => setNewChatModalOpen(true)} />
          )}
        </Box>
      )}

      {/* Modal to initiate direct or group conversations */}
      <NewChatModal
        open={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onRoomCreated={handleRoomCreatedOrSelected}
      />
    </Box>
  );
};

export default MainLayout;
