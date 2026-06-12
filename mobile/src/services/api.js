import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://beqv-backend.onrender.com/api';

const api = axios.create({
  baseURL,
});

export default api;