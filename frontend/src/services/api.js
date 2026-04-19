import axios from 'axios';

let API_BASE = import.meta.env.VITE_API_URL || '';

// Auto-correct URL if someone forgot to add 'https://' inside Vercel Environment Variables
if (API_BASE && !API_BASE.startsWith('http')) {
  API_BASE = `https://${API_BASE}`;
}

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 120000,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const detectImage = (file, confidence = 0.5) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/detect/image?confidence=${confidence}`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'ngrok-skip-browser-warning': 'true'
    },
  });
};

export const detectVideo = (file, confidence = 0.5, skipFrames = 2) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/detect/video?confidence=${confidence}&skip_frames=${skipFrames}&max_frames=300`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      'ngrok-skip-browser-warning': 'true'
    },
  });
};

export const getHistory = (page = 1, perPage = 12) =>
  api.get(`/history?page=${page}&per_page=${perPage}`);

export const getDetectionById = (id) => api.get(`/history/${id}`);

export const deleteDetection = (id) => api.delete(`/history/${id}`);

export const getStats = () => axios.get(`${API_BASE}/api/v1/stats`, { headers: { 'ngrok-skip-browser-warning': 'true' } });

export const healthCheck = () => axios.get(`${API_BASE}/health`, { headers: { 'ngrok-skip-browser-warning': 'true' } });

export default api;
