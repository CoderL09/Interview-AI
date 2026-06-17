
import axios from 'axios';
const API_BASE = 'https://interview-ai-44b0.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default api;