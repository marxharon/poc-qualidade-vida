import { db } from '../db/index.js';
import { gemeosOrganizacionais, historicoEvolucaoESG, eixosESG, interacoes } from '../db/schema.js';

export const getDashboardData = async (req, res) => {
    try {
        // Busca os 10 eixos de ESG
        const eixos = await db.select().from(eixosESG);
        // Busca a evolução preditiva e as sugestões geradas pelo Motor de IA
        const historico = await db.select().from(historicoEvolucaoESG);
        // Busca as 10 categorias de agrupamentos (Gêmeos Organizacionais)
        const grupos = await db.select().from(gemeosOrganizacionais);
        // Busca as interacoes para contabilizar personas por eixo
        const interacoesList = await db.select().from(interacoes);

        res.status(200).json({ eixos, historico, grupos, interacoes: interacoesList });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados do dashboard", details: error.message });
    }
};