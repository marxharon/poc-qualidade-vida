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

// Permite acesso do seu frontend publicado e do app local (Configurado ANTES das rotas)
app.use(cors({
  origin: '*', // Libera o acesso para qualquer porta dinâmica ou IP local da POC
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Rota raiz para verificações de Health Check do Render
app.get('/', (req, res) => {
    res.status(200).send('API BEQV operando com sucesso!');
});

app.use('/api/health', healthRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
