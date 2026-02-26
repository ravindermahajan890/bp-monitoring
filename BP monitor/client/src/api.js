import axios from 'axios';

const API = axios.create({
  baseURL: 'https://bp-monitoring.onrender.com/api',
});

export const getReadings = () => API.get('/readings');
export const createReading = (data) => API.post('/readings', data);
export const deleteReading = (id) => API.delete(`/readings/${id}`);

