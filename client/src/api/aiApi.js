import api from './axiosInstance';

export const aiApi = {
  generateEventPlan: async (eventId) => {
    const res = await api.post('/ai/event-plan', { eventId });
    return res.data;
  },
  applyEventPlan: async (eventId, approvedTasks) => {
    const res = await api.post('/ai/event-plan/apply', { eventId, approvedTasks });
    return res.data;
  },
  copilotChat: async (eventId, message, conversationHistory) => {
    const res = await api.post('/ai/chat', { eventId, message, conversationHistory });
    return res.data;
  },
  approveAction: async (actionId) => {
    const res = await api.post('/ai/action/approve', { actionId });
    return res.data;
  },
  rejectAction: async (actionId, reason) => {
    const res = await api.post('/ai/action/reject', { actionId, reason });
    return res.data;
  },
  getPendingActions: async (eventId) => {
    const res = await api.get(`/ai/actions/pending/${eventId}`);
    return res.data;
  }
};
