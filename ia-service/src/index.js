import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { generateInitialDigitalTwin } from './services/digitalTwinGenerator.js';
import { dailyInteraction } from './services/conversationalMentor.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/twin', async (req, res) => {
    try {
        const { id_persona, respostasOnboarding } = req.body;
        const resumo = await generateInitialDigitalTwin(id_persona, respostasOnboarding);
        res.json({ success: true, resumo });
    } catch (error) {
        console.error("Erro na geração do Gêmeo:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { id_persona, eixoESGSelecionado, respostaColaboradorNatural } = req.body;
        const resposta = await dailyInteraction(id_persona, eixoESGSelecionado, respostaColaboradorNatural);
        
        // Tratamento de segurança: remove crases de marcação Markdown caso a IA as inclua (ex: ```json ... ```)
        let cleanResponse = resposta;
        if (cleanResponse.includes('```json')) {
            cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
        } else if (cleanResponse.includes('```')) {
            cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
        }
        
        res.json({ success: true, data: JSON.parse(cleanResponse) });
    } catch (error) {
        console.error("Erro na interação do Chat:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT,'0.0.0.0', () => console.log(`🧠 IA Service (Cérebro) rodando na porta ${PORT}`));