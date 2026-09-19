import api from './axiosInstance';

export const volunteersApi = {
  getEventVolunteers: async (eventId) => {
    const res = await api.get(`/events/${eventId}/volunteers`);
    return res.data;
  },
  addVolunteer: async (eventId, volunteerData) => {
    const res = await api.post(`/events/${eventId}/volunteers`, volunteerData);
    return res.data;
  },
  getRecommendations: async (eventId, params) => {
    const res = await api.get(`/events/${eventId}/volunteers/recommendations`, { params });
    return res.data;
  }
};
