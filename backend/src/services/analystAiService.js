import { db } from '../db/index.js';
import { gemeosOrganizacionais, historicoEvolucaoESG, interacoes } from '../db/schema.js';

export const runAnalystGrouping = async () => {
    // As 10 categorias de Gêmeos Digitais Organizacionais baseadas no framework
    const categoriasMapeadas = [
        { nome: 'Tendência ao Burnout', desc: 'Colaboradores com indícios de esgotamento e sobrecarga contínua.' },
        { nome: 'Sedentarismo e Saúde Física', desc: 'Baixa adoção de práticas saudáveis e exercícios.' },
        { nome: 'Problemas de Relacionamento na Equipe', desc: 'Conflitos ou falta de colaboração interpessoal.' },
        { nome: 'Tendência à Procrastinação', desc: 'Dificuldade de foco e gestão de tempo.' },
        { nome: 'Desmotivação e Baixo Engajamento', desc: 'Baixo índice de pertencimento e propósito.' },
        { nome: 'Insegurança Psicológica', desc: 'Medo de expor opiniões ou falhar no ambiente de trabalho.' },
        { nome: 'Isolamento no Trabalho Remoto/Híbrido', desc: 'Falta de conexão com a cultura da empresa.' },
        { nome: 'Insatisfação com Reconhecimento', desc: 'Sentimento de desvalorização profissional.' },
        { nome: 'Desequilíbrio Vida-Trabalho', desc: 'Dificuldade de desconexão após o expediente.' },
        { nome: 'Falta de Perspectiva de Crescimento', desc: 'Estagnação na trilha de desenvolvimento.' }
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

    // 2. Coletar interações recentes de forma estritamente ANONIMIZADA (sem trazer id_persona)
    const interacoesAnonimizadas = await db.select({
        id_eixo: interacoes.id_eixo,
        percentual_adesao: interacoes.percentual_adesao
    }).from(interacoes);

    // 3. Simular a análise da IA agregando os dados no Histórico Evolutivo
    const historicos = todosGrupos.map(grupo => {
        return {
            id_agrupamento: grupo.id_agrupamento,
            id_eixo: Math.floor(Math.random() * 10) + 1, // Vincula a um eixo ESG entre 1 e 10
            pontuacao_agregada: Math.floor(Math.random() * 40) + 60, // Média agregada (60 a 100)
            sugestao_estrategica_ia: `Ação Preventiva Corporativa para "${grupo.nome_categoria}": Promover rodas de escuta ativa e revisar a carga de demandas semanais do departamento.`
        };
    });

    // Salva a fotografia do momento (útil para o Gráfico de Tendências do Dashboard)
    await db.insert(historicoEvolucaoESG).values(historicos);

    return { success: true, gruposGerados: todosGrupos.length, interacoesProcessadas: interacoesAnonimizadas.length };
};