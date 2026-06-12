import { db } from '../db/index.js';
import { colaboradores, personas, interacoes } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
            const IA_SERVICE_URL = process.env.IA_SERVICE_URL || 'https://ia-service-h3y5.onrender.com/api';
            await axios.post(`${IA_SERVICE_URL}/twin`, {
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

export const getPersonas = async (req, res) => {
    try {
        const list = await db.select().from(personas);
        res.status(200).json({ success: true, personas: list });
    } catch (error) {
        console.error('Erro ao buscar personas:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar personas' });
    }
};

export const getPersonaHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await db.select().from(interacoes).where(eq(interacoes.id_persona, parseInt(id)));
        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
    }
};