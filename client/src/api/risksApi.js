import api from './axiosInstance';

export const risksApi = {
  getEventRisks: async (eventId, params) => {
    const res = await api.get(`/events/${eventId}/risks`, { params });
    return res.data;
  },
  createRisk: async (eventId, riskData) => {
    const res = await api.post(`/events/${eventId}/risks`, riskData);
    return res.data;
  },
  evaluateRisks: async (eventId) => {
    const res = await api.post(`/events/${eventId}/risks/evaluate`);
    return res.data;
  },
  resolveRisk: async (riskId) => {
    const res = await api.patch(`/risks/${riskId}/resolve`);
    return res.data;
  }
};
