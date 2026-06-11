import { db } from '../db/index.js';
import { gemeosOrganizacionais, historicoEvolucaoESG, interacoes } from '../db/schema.js';
import axios from 'axios';
import { gte, lte, and } from 'drizzle-orm';

export const runAnalystGrouping = async (dataInicioParam, dataFimParam) => {
    // As 10 categorias de Gêmeos Digitais Organizacionais baseadas no framework
    const categoriasMapeadas = [
        { nome: 'Tendência ao Burnout', desc: 'Colaboradores com indícios de esgotamento e sobrecarga contínua.', id_eixo: 2 },
        { nome: 'Sedentarismo e Saúde Física', desc: 'Baixa adoção de práticas saudáveis e exercícios.', id_eixo: 1 },
        { nome: 'Problemas de Relacionamento na Equipe', desc: 'Conflitos ou falta de colaboração interpessoal.', id_eixo: 9 },
        { nome: 'Tendência à Procrastinação', desc: 'Dificuldade de foco e gestão de tempo.', id_eixo: 3 },
        { nome: 'Desmotivação e Baixo Engajamento', desc: 'Baixo índice de pertencimento e propósito.', id_eixo: 3 },
        { nome: 'Insegurança Psicológica', desc: 'Medo de expor opiniões ou falhar no ambiente de trabalho.', id_eixo: 10 },
        { nome: 'Isolamento no Trabalho Remoto/Híbrido', desc: 'Falta de conexão com a cultura da empresa.', id_eixo: 4 },
        { nome: 'Insatisfação com Reconhecimento', desc: 'Sentimento de desvalorização profissional.', id_eixo: 8 },
        { nome: 'Desequilíbrio Vida-Trabalho', desc: 'Dificuldade de desconexão após o expediente.', id_eixo: 4 },
        { nome: 'Falta de Perspectiva de Crescimento', desc: 'Estagnação na trilha de desenvolvimento.', id_eixo: 7 }
    ];

    // 1. Garantir que as 10 categorias existam no banco
    const gruposExistentes = await db.select().from(gemeosOrganizacionais);
    if (gruposExistentes.length === 0) {
        const inserts = categoriasMapeadas.map(c => ({
            nome_categoria: c.nome,
            descricao_perfil: c.desc
        }));
        await db.insert(gemeosOrganizacionais).values(inserts);
    }

    const todosGrupos = await db.select().from(gemeosOrganizacionais);

    // Define o recorte temporal (janela de análise). Se não for passado, avalia os últimos 30 dias.
    const dataFim = dataFimParam ? new Date(dataFimParam) : new Date();
    const dataInicio = dataInicioParam ? new Date(dataInicioParam) : new Date();
    if (!dataInicioParam) {
        dataInicio.setDate(dataInicio.getDate() - 30);
    }

    // 2. Coletar interações recentes incluindo o id_persona para análise de enquadramento (mantido anonimizado da IA externa)
    const interacoesBrutas = await db.select({
        id_persona: interacoes.id_persona,
        id_eixo: interacoes.id_eixo,
        percentual_adesao: interacoes.percentual_adesao
    }).from(interacoes).where(
        and(
            gte(interacoes.data_interacao, dataInicio),
            lte(interacoes.data_interacao, dataFim)
        )
    );

    // 3. Motor IA BEQV: Agrupar histórico por persona para análise de perfil
    const historicoPorPersona = {};
    interacoesBrutas.forEach(int => {
        if (!historicoPorPersona[int.id_persona]) historicoPorPersona[int.id_persona] = {};
        if (!historicoPorPersona[int.id_persona][int.id_eixo]) historicoPorPersona[int.id_persona][int.id_eixo] = { soma: 0, contagem: 0 };
        
        historicoPorPersona[int.id_persona][int.id_eixo].soma += int.percentual_adesao;
        historicoPorPersona[int.id_persona][int.id_eixo].contagem += 1;
    });

    // 4. Enquadrar cada persona em NO MÁXIMO 1 eixo de risco (ou nenhum, se a média for saudável)
    const agregacaoPorEixo = {};
    for (const id_persona in historicoPorPersona) {
        const eixosPersona = historicoPorPersona[id_persona];
        let eixoCritico = null;
        let menorAdesao = 101;

        for (const id_eixo in eixosPersona) {
            const mediaEixo = Math.round(eixosPersona[id_eixo].soma / eixosPersona[id_eixo].contagem);
            if (mediaEixo < menorAdesao) {
                menorAdesao = mediaEixo;
                eixoCritico = id_eixo;
            }
        }

        // Limiar de saúde corporativa: se a pior adesão for >= 85%, o colaborador não gera risco e fica "neutro"
        if (menorAdesao < 85 && eixoCritico) {
            if (!agregacaoPorEixo[eixoCritico]) agregacaoPorEixo[eixoCritico] = { soma: 0, contagem: 0 };
            agregacaoPorEixo[eixoCritico].soma += menorAdesao;
            agregacaoPorEixo[eixoCritico].contagem += 1; // Contabiliza a persona estritamente 1 vez no agrupamento
        }
    }

    // 5. Gerar os Gêmeos Organizacionais via IA agregando os dados no Histórico Evolutivo
    const historicos = await Promise.all(todosGrupos.map(async grupo => {
        const categoria = categoriasMapeadas.find(c => c.nome === grupo.nome_categoria);
        const eixoVinculado = categoria ? categoria.id_eixo : (Math.floor(Math.random() * 10) + 1);

        let pontuacao = 70; // Pontuação neutra caso não haja interações para o eixo
        if (agregacaoPorEixo[eixoVinculado] && agregacaoPorEixo[eixoVinculado].contagem > 0) {
            pontuacao = Math.round(agregacaoPorEixo[eixoVinculado].soma / agregacaoPorEixo[eixoVinculado].contagem);
        }
        
        let sugestaoDinamicaIa = '';
        try {
            // Chamada ao serviço de IA para gerar a sugestão estratégica dinamicamente baseada nos dados do Gêmeo Organizacional
            const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://localhost:3002/api';
            const respostaIa = await axios.post(`${iaServiceUrl}/analyze-group`, {
                categoria: grupo.nome_categoria,
                pontuacao_agregada: pontuacao,
                descricao_perfil: grupo.descricao_perfil
            });
            sugestaoDinamicaIa = `[${grupo.nome_categoria}] ${respostaIa.data.sugestao_estrategica}`;
        } catch (error) {
            // Fallback amigável caso o endpoint no ia-service ainda não exista, esteja fora do ar ou dê timeout
            console.warn(`⚠️ Falha ao obter sugestão dinâmica da IA para ${grupo.nome_categoria}. Usando fallback.`);
            sugestaoDinamicaIa = pontuacao < 65 
                ? `[${grupo.nome_categoria}] Alerta Crítico: Aderência atual é de ${pontuacao}%. Necessário promover intervenções focadas.` 
                : `[${grupo.nome_categoria}] Ação Preventiva: Manter acompanhamento. Adesão em ${pontuacao}%.`;
        }

        return {
            id_agrupamento: grupo.id_agrupamento,
            id_eixo: eixoVinculado,
            data_medicao: dataFim, // Registra a data exata da fotografia para manter coerência na evolução temporal
            pontuacao_agregada: pontuacao,
            sugestao_estrategica_ia: sugestaoDinamicaIa
        };
    }));

    // Salva a fotografia do momento (útil para o Gráfico de Tendências do Dashboard)
    await db.insert(historicoEvolucaoESG).values(historicos);

    return { success: true, gruposGerados: todosGrupos.length, interacoesProcessadas: interacoesBrutas.length };
};