import axios from 'axios';

let API_BASE = import.meta.env.VITE_API_URL || '';

// Auto-correct URL if someone forgot to add 'http://' or 'https://'
if (API_BASE && !API_BASE.startsWith('http')) {
  const isLocal = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
  API_BASE = isLocal ? `http://${API_BASE}` : `https://${API_BASE}`;
}

// Strip trailing slash if present to avoid double slashes in baseURL
if (API_BASE.endsWith('/')) {
  API_BASE = API_BASE.slice(0, -1);
}

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api/v1` : '/api/v1',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    'Bypass-Tunnel-Reminder': 'true',
  }
});

// Configure interceptor for errors to provide better debugging for "Production Issues"
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
      console.error('API Error: Received HTML instead of JSON. This usually means the tunnel is asking for permission or the URL is wrong.');
    }
    return Promise.reject(error);
  }
);

export const detectImage = (file, confidence = 0.5) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/detect/image?confidence=${confidence}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const detectVideo = (file, confidence = 0.5, skipFrames = 2) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/detect/video?confidence=${confidence}&skip_frames=${skipFrames}&max_frames=300`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHistory = (page = 1, perPage = 12) =>
  api.get(`/history?page=${page}&per_page=${perPage}`);

export const getDetectionById = (id) => api.get(`/history/${id}`);

export const deleteDetection = (id) => api.delete(`/history/${id}`);

export const getStats = () => api.get('/stats');

export const healthCheck = () => {
  // Use baseURL-less check for root health if needed, or stick to /health
  return axios.get(`${API_BASE || ''}/health`, {
    headers: {
      'ngrok-skip-browser-warning': '69420',
      'Bypass-Tunnel-Reminder': 'true',
    }
  });
};

export { API_BASE };
export default api;
