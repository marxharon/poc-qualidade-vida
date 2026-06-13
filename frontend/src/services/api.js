import axios from 'axios';

// API do Backend Principal (Porta 3000)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api';

// API do Serviço de IA / Cérebro (Porta 3002)
const IA_SERVICE_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://127.0.0.1:3002/api';

export const api = axios.create({
    baseURL: BACKEND_URL
});

export const iaApi = axios.create({
    baseURL: IA_SERVICE_URL
});