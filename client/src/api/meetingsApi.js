import api from './axiosInstance';

export const meetingsApi = {
  getEventMeetings: async (eventId) => {
    const res = await api.get(`/events/${eventId}/meetings`);
    return res.data;
  },
  getMeetingById: async (id) => {
    const res = await api.get(`/meetings/${id}`);
    return res.data;
  },
  createMeeting: async (eventId, meetingData) => {
    const res = await api.post(`/events/${eventId}/meetings`, meetingData);
    return res.data;
  },
  analyzeMeeting: async (id) => {
    const res = await api.post(`/meetings/${id}/analyze`);
    return res.data;
  },
  applyExtraction: async (id, approvedPayload) => {
    const res = await api.post(`/meetings/${id}/apply`, approvedPayload);
    return res.data;
  }
};
