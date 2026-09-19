import api from './axiosInstance';

export const activityApi = {
  getEventActivity: async (eventId, params) => {
    const res = await api.get(`/events/${eventId}/activity`, { params });
    return res.data;
  }
};
