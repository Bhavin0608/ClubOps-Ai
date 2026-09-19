import api from './axiosInstance';

export const eventsApi = {
  getEvents: async (params) => {
    const res = await api.get('/events', { params });
    return res.data;
  },
  getEventById: async (id) => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  createEvent: async (eventData) => {
    const res = await api.post('/events', eventData);
    return res.data;
  },
  updateEvent: async (id, eventData) => {
    const res = await api.put(`/events/${id}`, eventData);
    return res.data;
  },
  getEventHealth: async (id) => {
    const res = await api.get(`/events/${id}/health`);
    return res.data;
  }
};
