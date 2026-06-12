import axios from 'axios';

// Variáveis do Next requerem o prefixo NEXT_PUBLIC_
const isLocal = process.env.NEXT_PUBLIC_USE_LOCAL_SERVICES === 'true';

const BACKEND_URL = isLocal 
    ? 'http://localhost:3000/api' 
    : 'https://beqv-backend.onrender.com/api';

export const api = axios.create({
    baseURL: BACKEND_URL
});