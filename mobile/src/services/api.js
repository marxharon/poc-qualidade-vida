import axios from 'axios';
import Constants from 'expo-constants';

// Função para obter o IP da máquina host no ambiente de desenvolvimento Expo.
// Isso garante que o app mobile (no emulador ou físico) consiga encontrar o backend rodando localmente.
const getHostIp = () => {
    // A `hostUri` é a forma moderna e mais confiável de obter o IP do host de desenvolvimento.
    const hostUri = Constants.expoConfig?.hostUri;
    return hostUri ? hostUri.split(':')[0] : 'localhost';
};

// Variáveis do Expo requerem o prefixo EXPO_PUBLIC_
const isLocal = process.env.EXPO_PUBLIC_USE_LOCAL_SERVICES === 'true';

const BACKEND_URL = isLocal
    ? `http://${getHostIp()}:3000/api`
    : 'https://beqv-backend.onrender.com/api';

const api = axios.create({
    baseURL: BACKEND_URL
});

export default api;