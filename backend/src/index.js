import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes.js';
import personaRoutes from './routes/personaRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

import cors from 'cors';

// Permite acesso do seu frontend publicado e do app local
app.use(cors({
  origin: [
    'http://localhost:3001', // Frontend local
    'https://beqv-dashboard.onrender.com' // Seu frontend no Render (substitua pela URL real)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
