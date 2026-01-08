import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://psc-challenger-backend.vercel.app',
    timeout: 60000, // 60 seconds for AI generation
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
