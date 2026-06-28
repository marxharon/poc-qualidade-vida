import { db } from '../db/index.js';
import { gemeosOrganizacionais, historicoEvolucaoESG, interacoes } from '../db/schema.js';
import axios from 'axios';
import { gte, lte, and, eq } from 'drizzle-orm';

export const runAnalystGrouping = async (dataInicioParam, dataFimParam) => {
    // Define o recorte temporal (janela de análise). Se não for passado, avalia os últimos 30 dias.
    const dataFim = dataFimParam ? new Date(dataFimParam) : new Date();
    const dataInicio = dataInicioParam ? new Date(dataInicioParam) : new Date();
    if (!dataInicioParam) {
        dataInicio.setDate(dataInicio.getDate() - 30);
    }

    try {
        const iaServiceUrl = process.env.IA_SERVICE_URL || (process.env.USE_LOCAL_SERVICES === 'true' 
            ? 'http://127.0.0.1:3002/api' 
            : 'https://ia-service-h3y5.onrender.com/api');

        // O Motor Analítico agora delega a descoberta de clusters organicamente para o banco vetorial
        const respostaIa = await axios.post(`${iaServiceUrl}/semantic-clustering`, {
            data_inicio: dataInicio,
            data_fim: dataFim
        }, {
            headers: { 'Connection': 'close' },
            timeout: 60000
        });

        const clustersOrganicos = respostaIa.data.clusters || [];
        const historicos = [];

        for (const cluster of clustersOrganicos) {
            // Tenta localizar a categoria/cluster emergente no banco relacional
            let grupo = await db.select().from(gemeosOrganizacionais)
                .where(eq(gemeosOrganizacionais.nome_categoria, cluster.nome_categoria)).limit(1);
            
            // Se for um padrão de risco recém descoberto pela IA (orgânico), cadastra automaticamente
            if (grupo.length === 0) {
                const [novoGrupo] = await db.insert(gemeosOrganizacionais).values({
                    nome_categoria: cluster.nome_categoria,
                    descricao_perfil: cluster.descricao_perfil
                }).returning();
                grupo = [novoGrupo];
            }

            historicos.push({
                id_agrupamento: grupo[0].id_agrupamento,
                id_eixo: cluster.id_eixo_predominante || (Math.floor(Math.random() * 10) + 1),
                data_medicao: dataFim,
                pontuacao_agregada: cluster.pontuacao_agregada || 70,
                sugestao_estrategica_ia: `[${cluster.nome_categoria}] ${cluster.sugestao_estrategica}`
            });
        }

        if (historicos.length > 0) {
            await db.insert(historicoEvolucaoESG).values(historicos);
        }

        return { success: true, gruposGerados: clustersOrganicos.length };
    } catch (error) {
        console.error("Erro ao executar Agrupamento Semântico na IA:", error.message);
        return { success: false, error: "Falha ao processar agrupamento preditivo." };
    }
};