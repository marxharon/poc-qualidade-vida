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
        // Busca as interacoes para contabilizar feedbacks de sugestão
        const interacoesList = await db.select().from(interacoes);

        // 1. Gráfico de Radar (Estado atual vs Ideal) - Conforme modelo 2.1.3
        // Faz a média de pontuação por eixo baseada no histórico mais recente
        const radarData = eixos.map(eixo => {
            const historicoEixo = historico.filter(h => h.id_eixo === eixo.id_eixo);
            const mediaAtual = historicoEixo.length > 0 
                ? Math.round(historicoEixo.reduce((acc, curr) => acc + curr.pontuacao_agregada, 0) / historicoEixo.length)
                : 70; // Fallback COALESCE caso o eixo não tenha tido interações
            
            return {
                eixo: eixo.nome,
                atual: mediaAtual,
                ideal: 90 // Meta corporativa ideal definida
            };
        });

        // 2. Gráfico de Tendência Preditiva (Linhas) - Conforme modelo 2.1.2
        // Transforma linhas individuais em agrupamentos por Mês/Ano para o Recharts renderizar as linhas corretamente
        const tendenciaMap = {};
        historico.forEach(h => {
            const dataObj = new Date(h.data_medicao);
            const mesAno = `${dataObj.toLocaleString('pt-BR', { month: 'short' })} ${dataObj.getFullYear()}`;
            
            if (!tendenciaMap[mesAno]) {
                tendenciaMap[mesAno] = { mes: mesAno, isProjecao: dataObj > new Date() };
            }
            
            const grupo = grupos.find(g => g.id_agrupamento === h.id_agrupamento);
            if (grupo) {
                tendenciaMap[mesAno][grupo.nome_categoria] = h.pontuacao_agregada;
            }
        });

        const tendencia = Object.values(tendenciaMap);

        // 3. Gráfico de Barras: Nível de eficácia das sugestões - Conforme modelo 2.1.5 (NOVO)
        const feedbackCounts = interacoesList.reduce((acc, curr) => {
            const feedback = curr.feedback_sugestao || 'Indiferente'; // Trata nulos como 'Indiferente'
            acc[feedback] = (acc[feedback] || 0) + 1;
            return acc;
        }, {});

        const feedbackData = [
            { name: 'Boa', value: feedbackCounts.Boa || 0 },
            { name: 'Indiferente', value: feedbackCounts.Indiferente || 0 },
            { name: 'Ruim', value: feedbackCounts.Ruim || 0 },
        ];

        // 4. Mapa de Calor (Heatmap): Concentração de anomalias - Conforme modelo 2.1.4 (NOVO)
        // Cruzamento de Gêmeos Organizacionais vs. Eixos ESG, usando a pontuação mais recente.
        const heatmapData = [];
        grupos.forEach(grupo => {
            eixos.forEach(eixo => {
                const historicoGrupoEixo = historico.filter(h => 
                    h.id_agrupamento === grupo.id_agrupamento && h.id_eixo === eixo.id_eixo
                );
                // Usamos a pontuação mais recente para o heatmap
                const lastScore = historicoGrupoEixo.sort((a, b) => new Date(b.data_medicao) - new Date(a.data_medicao))[0];
                heatmapData.push({
                    grupo: grupo.nome_categoria,
                    eixo: eixo.nome,
                    valor: lastScore ? lastScore.pontuacao_agregada : 0 // 0 se não houver histórico
                });
            });
        });

        // 5. Gráfico de Dispersão Semântico (Mapa Vetorial) - Conforme modelo 2.1.1
        // As coordenadas agora são derivadas dinamicamente do comportamento real e engajamento dos agrupamentos.
        const scatterData = grupos.map((g, index) => {
            const historicoGrupo = historico.filter(h => h.id_agrupamento === g.id_agrupamento);
            const xScore = historicoGrupo.length > 0 
                ? Math.round(historicoGrupo.reduce((acc, curr) => acc + curr.pontuacao_agregada, 0) / historicoGrupo.length)
                : 50;
            return {
                ...g,
                x: xScore, // Eixo X: Saúde atual do grupo (score)
                y: Math.min(100, (historicoGrupo.length * 5) + (index * 10)), // Eixo Y: Dispersão baseada na volumetria de histórico 
                z: historicoGrupo.length || 10 // Eixo Z (Volume): Quantidade de medições/pessoas associadas
            };
        });

        res.status(200).json({ 
            radarData, 
            tendencia, 
            grupos, 
            historico, 
            eixos, 
            interacoes: interacoesList,
            feedbackData,      // NOVO: Para Gráfico de Barras
            heatmapData,       // NOVO: Para Mapa de Calor
            scatterData,       // NOVO: Dados Reais de Dispersão Vetorial
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados do dashboard", details: error.message });
    }
};