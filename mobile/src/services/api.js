import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Função para obter o IP da máquina host no ambiente de desenvolvimento Expo.
// Isso garante que o app mobile (no emulador ou físico) consiga encontrar o backend rodando localmente.
const getHostIp = () => {
    // No navegador (Expo Web), sempre usamos localhost para evitar bloqueios de CORS (Cross-Origin)
    if (Platform.OS === 'web') {
        // Obtém a origem exata da barra de endereços, permitindo testar via IP de rede sem erros de Network
        if (typeof window !== 'undefined') {
            return window.location.hostname;
        }
        return 'localhost';
    }
    // A `hostUri` é a forma moderna e mais confiável de obter o IP do host de desenvolvimento.
    const hostUri = Constants.expoConfig?.hostUri;
    return hostUri ? hostUri.split(':')[0] : 'localhost';
};

// Chaveamento de Ambiente: Local por padrão (Backend na porta 3000).
// Para produção, basta definir a variável EXPO_PUBLIC_API_URL.
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || `http://${getHostIp()}:3000/api`;

const api = axios.create({
    baseURL: BACKEND_URL
});

export default api;