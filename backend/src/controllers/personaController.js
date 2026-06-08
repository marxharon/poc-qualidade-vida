import { db } from '../db/index.js';
import { colaboradores, personas } from '../db/schema.js';
import axios from 'axios';

export const createPersona = async (req, res) => {
    try {
        const data = req.body;
        
        // 1. Criar um colaborador fictício para o teste da POC
        const [novoColaborador] = await db.insert(colaboradores).values({
            credenciais_acesso: `colaborador_${Date.now()}@serpro.gov.br`
        }).returning();

        // 2. Criar a Persona (Gêmeo Digital) no banco relacional PostgreSQL com os dados do Onboarding
        const [novaPersona] = await db.insert(personas).values({
            id_colaborador: novoColaborador.id_colaborador,
            nome_preferido: data.nome_preferido,
            personalidade: data.personalidade,
            gostos: data.gostos,
            desgostos: data.desgostos,
            relacao_equipe: data.relacao_equipe,
            sentimento_trabalho: data.sentimento_trabalho,
            motivacoes: data.motivacoes,
            hardskills_softskills: data.hardskills_softskills,
            aceite_lgpd_termos: data.aceite_lgpd_termos
        }).returning();

        // 3. Acionar a IA para criar os Embeddings no ChromaDB
        try {
            await axios.post('http://localhost:3002/api/twin', {
                id_persona: novaPersona.id_persona,
                respostasOnboarding: data
            });
        } catch (iaError) {
            console.error('Aviso: Gêmeo estruturado salvo, mas falha ao conectar com Serviço de IA.', iaError.message);
        }

        res.status(201).json({ success: true, persona: novaPersona });
    } catch (error) {
        console.error('Erro ao criar persona:', error);
        res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
};