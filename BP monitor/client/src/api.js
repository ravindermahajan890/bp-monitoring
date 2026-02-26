import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

export const getReadings = () => API.get('/readings');
export const createReading = (data) => API.post('/readings', data);
export const deleteReading = (id) => API.delete(`/readings/${id}`);

