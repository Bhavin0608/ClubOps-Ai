import api from './axiosInstance';

export const tasksApi = {
  getEventTasks: async (eventId, params) => {
    const res = await api.get(`/events/${eventId}/tasks`, { params });
    return res.data;
  },
  createTask: async (eventId, taskData) => {
    const res = await api.post(`/events/${eventId}/tasks`, taskData);
    return res.data;
  },
  updateTask: async (taskId, taskData) => {
    const res = await api.put(`/tasks/${taskId}`, taskData);
    return res.data;
  },
  updateTaskStatus: async (taskId, status) => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status });
    return res.data;
  },
  assignTask: async (taskId, volunteerId) => {
    const res = await api.post(`/tasks/${taskId}/assign`, { volunteerId });
    return res.data;
  },
  deleteTask: async (taskId) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  },
  autoAssignTasks: async (eventId) => {
    const res = await api.post(`/events/${eventId}/tasks/auto-assign`);
    return res.data;
  }
};
