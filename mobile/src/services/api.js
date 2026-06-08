import axios from 'axios';
import { Platform } from 'react-native';

// Se for testar no celular (QR Code), troque 'localhost' abaixo pelo IP do seu computador (ex: 192.168.1.15)
// Para descobrir o IP no Windows, digite 'ipconfig' no terminal.
const baseURL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL,
});

export default api;