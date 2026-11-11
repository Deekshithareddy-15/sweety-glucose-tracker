import api from './api';

export const reportService = {
  async getDailyReport(date) {
    const response = await api.get('/reports/daily', { params: { date } });
    return response.data;
  },

  async getMonthToDateReport(date) {
    const response = await api.get('/reports/month-to-date', { params: { date } });
    return response.data;
  },

  async getMonthlyReport(date) {
    const response = await api.get('/reports/monthly', { params: { date } });
    return response.data;
  },
};
