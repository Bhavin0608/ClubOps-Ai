import api from './axiosInstance';

export const notificationsApi = {
  getMyNotifications: async (params) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  }
};

export const activityApi = {
  getEventActivity: async (eventId, params) => {
    const res = await api.get(`/events/${eventId}/activity`, { params });
    return res.data;
  }
};
