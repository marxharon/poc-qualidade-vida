import { db } from '../db/index.js';
import { colaboradores, personas, interacoes, eixosESG } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
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
            const IA_SERVICE_URL = process.env.IA_SERVICE_URL || (process.env.USE_LOCAL_SERVICES === 'true' 
                ? 'http://localhost:3002/api' 
                : 'https://ia-service-h3y5.onrender.com/api');
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
        const historyRaw = await db.select()
            .from(interacoes)
            .where(eq(interacoes.id_persona, parseInt(id)))
            .orderBy(desc(interacoes.id_interacao)); // Garante que a última sugestão venha primeiro
            
        const eixos = await db.select().from(eixosESG);
        const history = historyRaw.map(h => {
            const eixo = eixos.find(e => e.id_eixo === h.id_eixo);
            return {
                ...h,
                nome_eixo: eixo ? eixo.nome : null
            };
        });
        
        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
    }
};

export const getPersonaRadarData = async (req, res) => {
    try {
        const { id } = req.params;
        const eixos = await db.select().from(eixosESG);
        const interacoesRaw = await db.select()
            .from(interacoes)
            .where(eq(interacoes.id_persona, parseInt(id)));

        const radarData = eixos.map(eixo => {
            const interacoesEixo = interacoesRaw.filter(h => h.id_eixo === eixo.id_eixo);
            const media = interacoesEixo.length > 0 
                ? Math.round(interacoesEixo.reduce((acc, curr) => acc + curr.percentual_adesao, 0) / interacoesEixo.length)
                : 100; // Saúde máxima caso não existam problemas relatados
            
            let color = '#10b981'; // Verde
            if (media < 70) color = '#f59e0b'; // Amarelo
            if (media < 50) color = '#ef4444'; // Vermelho

            return {
                eixo: eixo.nome,
                score: media,
                color
            };
        });
        
        res.status(200).json({ success: true, radar: radarData });
    } catch (error) {
        console.error('Erro ao buscar dados do radar:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar radar' });
    }
};