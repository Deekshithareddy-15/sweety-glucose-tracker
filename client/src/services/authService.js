import api from './api';

export const authService = {
  async signup(data) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
