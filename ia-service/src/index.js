import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { generateInitialDigitalTwin } from './services/digitalTwinGenerator.js';
import { generatePersonalizedQuestion, processChatInteraction } from './services/conversationalMentor.js';
import { discoverOrganicClusters } from './services/semanticClustering.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rota de Onboarding (Geração do Gêmeo Digital Inicial)
app.post('/api/twin', async (req, res) => {
    try {
        const { id_persona, respostas } = req.body;
        const resumo = await generateInitialDigitalTwin(id_persona, respostas);
        res.json({ success: true, resumo });
    } catch (error) {
        console.error("Erro ao gerar Gêmeo Digital:", error.message);
        res.status(500).json({ error: "Erro ao processar persona na IA." });
    }
});

// Rota Fase 1: Pergunta Diária Personalizada (Gêmeo Digital Individual)
app.post('/api/daily-question', async (req, res) => {
    try {
        const { id_persona } = req.body;
        if (!id_persona) {
            return res.status(400).json({ error: "O id_persona é obrigatório." });
        }

        const iaResponse = await generatePersonalizedQuestion(id_persona);
        res.status(200).json(iaResponse);
    } catch (error) {
        console.error("Erro na rota /daily-question:", error.message);
        res.status(500).json({ error: "Falha ao gerar pergunta diária na IA." });
    }
});

// Rota Fase 1.3: Atualização Contínua do Vetor (Upsert do Gêmeo Digital)
app.post('/api/chat', async (req, res) => {
    try {
        const { id_persona, eixoESGSelecionado, respostaColaboradorNatural } = req.body;
        if (!id_persona || !respostaColaboradorNatural) {
            return res.status(400).json({ error: "id_persona e respostaColaboradorNatural são obrigatórios." });
        }

        const iaResponse = await processChatInteraction(id_persona, eixoESGSelecionado, respostaColaboradorNatural);
        res.status(200).json(iaResponse);
    } catch (error) {
        console.error("Erro na rota /chat:", error.message);
        res.status(500).json({ error: "Falha ao processar a interação com o Gêmeo Digital." });
    }
});

// Rota Fase 2: Agrupamento Semântico Orgânico (Gêmeos Organizacionais)
app.post('/api/semantic-clustering', async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.body;
        
        const agrupamentos = await discoverOrganicClusters(data_inicio, data_fim);
        
        res.status(200).json({ clusters: agrupamentos });
    } catch (error) {
        console.error("Erro na rota /semantic-clustering:", error.message);
        res.status(500).json({ error: "Falha ao executar o motor preditivo de clustering vetorial." });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => console.log(`🧠 IA Service (Cérebro) rodando na porta ${PORT}`));