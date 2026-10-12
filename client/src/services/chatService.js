import api from './api.js';

export const chatService = {
  // Rooms
  async getRooms() {
    const res = await api.get('/rooms');
    return res.data.rooms;
  },

  async getRoomDetails(roomId) {
    const res = await api.get(`/rooms/${roomId}`);
    return res.data.room;
  },

  async getOrCreateDirectRoom(recipientId) {
    const res = await api.post('/rooms/direct', { recipientId });
    return res.data;
  },

  async createGroupRoom(name, memberIds) {
    const res = await api.post('/rooms/group', { name, memberIds });
    return res.data.room;
  },

  // Messages
  async getMessages(roomId, limit = 50, before = null) {
    const params = { limit };
    if (before) params.before = before;
    const res = await api.get(`/messages/${roomId}`, { params });
    return res.data;
  },

  async sendMessage(roomId, content) {
    const res = await api.post(`/messages/${roomId}`, { content });
    return res.data.message;
  },

  // Users
  async getUsers(search = '') {
    const res = await api.get('/users', { params: { search } });
    return res.data.users;
  },
};

export default chatService;
