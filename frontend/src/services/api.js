import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 120000,
});

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

export const getStats = () => axios.get(`${API_BASE}/api/v1/stats`);

export const healthCheck = () => axios.get(`${API_BASE}/health`);

export default api;
