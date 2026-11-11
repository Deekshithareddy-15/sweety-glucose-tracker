import api from './api';

export const readingService = {
  async getReadings(params = {}) {
    const response = await api.get('/readings', { params });
    return response.data;
  },

  async getReadingById(id) {
    const response = await api.get(`/readings/${id}`);
    return response.data;
  },

  async createReading(readingData) {
    const response = await api.post('/readings', readingData);
    return response.data;
  },

  async updateReading(id, readingData) {
    const response = await api.put(`/readings/${id}`, readingData);
    return response.data;
  },

  async deleteReading(id) {
    const response = await api.delete(`/readings/${id}`);
    return response.data;
  },
};
