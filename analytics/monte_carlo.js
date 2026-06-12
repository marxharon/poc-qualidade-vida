import pg from 'pg';
import axios from 'axios';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carrega as variáveis de ambiente (como DATABASE_URL) a partir do .env do backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config(); // Tenta carregar .env local também, caso exista na pasta analytics

// Configurações da simulação
const NUM_PERSONAS = 100; // Aumentado o volume para 100 personas
const START_DATE = new Date('2026-01-01T12:00:00Z'); // Ajustado para 12h para evitar fuso horário retroceder para 12/2025
const END_DATE = new Date('2026-05-31T12:00:00Z'); // Simulação cobrindo exatamente 5 meses (Jan-Mai)

// Conexão com os serviços da POC
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://SEU_USUARIO:SUA_SENHA@localhost:5432/beqv_db';
const IA_SERVICE_URL = process.env.IA_SERVICE_URL || (process.env.USE_LOCAL_SERVICES === 'true' 
    ? 'http://localhost:3002/api' 
    : 'https://ia-service-h3y5.onrender.com/api');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Client } = pg;

// Variáveis probabilísticas para o Motor de Monte Carlo
const respostas_diarias = [
    "Hoje estou me sentindo ótimo e produtivo, consegui entregar tudo.",
    "Estou um pouco cansado devido à alta demanda desta semana.",
    "O clima na equipe está tenso hoje, tivemos um conflito na reunião.",
    "Tudo tranquilo, consegui focar nas minhas tarefas sem interrupções.",
    "Me sinto desmotivado, a rotina está muito repetitiva.",
    "Estou com muita dor nas costas devido à cadeira do home office.",
    "Fiz muitas pausas hoje, o dia foi bem equilibrado e saudável.",
    "Me sinto muito reconhecido pelo feedback do meu gestor hoje!"
];
const feedbacks = ['Boa', 'Ruim', 'Indiferente'];

// Variação de perguntas da IA ao invés de usar sempre a mesma mensagem
const perguntasVariadas = [
    "Como você avalia seu bem-estar hoje?",
    "Como está sua energia e motivação para o trabalho hoje?",
    "Você sentiu algum impacto no seu equilíbrio vida/trabalho essa semana?",
    "Qual a sua percepção sobre o clima da equipe ultimamente?",
    "Você tem conseguido manter seus hábitos saudáveis durante a rotina?",
    "Como você avalia o reconhecimento que tem recebido?",
    "Você sente segurança para expressar suas opiniões na equipe?",
    "Como está sua carga de tarefas hoje?"
];

async function gerarPersonasComIA() {
    console.log('🤖 Solicitando à IA a geração de perfis corporativos diversos para as personas...');
    if (OPENAI_API_KEY) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'system',
                        content: 'Gere 10 perfis de personas corporativas com personalidades diversas (ex: ansioso, workaholic, equilibrado, procrastinador). Retorne APENAS um array JSON onde cada objeto tenha: personalidade, gostos, desgostos, relacao_equipe, sentimento_trabalho, motivacoes, hardskills_softskills.'
                    }]
                },
                { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
            );
            return JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            console.log('⚠️ Falha ao contatar OpenAI. Utilizando perfis gerados por IA localmente.');
        }
    } else {
        console.log('⚠️ OPENAI_API_KEY não encontrada. Utilizando perfis de fallback mockados da IA.');
    }

    // Fallback de arquétipos estruturados
    return [
        { personalidade: "Introvertido e analítico", gostos: "Ler documentação, silêncio", desgostos: "Reuniões longas", relacao_equipe: "Distante mas prestativo", sentimento_trabalho: "Focado", motivacoes: "Resolver problemas complexos", hardskills_softskills: "Programação, Foco" },
        { personalidade: "Extrovertido e comunicativo", gostos: "Trabalho em equipe, brainstorms", desgostos: "Rotina isolada", relacao_equipe: "Muito colaborativo", sentimento_trabalho: "Motivado", motivacoes: "Reconhecimento", hardskills_softskills: "Comunicação, Liderança" },
        { personalidade: "Ansioso e perfeccionista", gostos: "Processos bem definidos", desgostos: "Prazos curtos e surpresas", relacao_equipe: "Evita conflitos", sentimento_trabalho: "Frequentemente sobrecarregado", motivacoes: "Estabilidade", hardskills_softskills: "Organização, Design" },
        { personalidade: "Procrastinador criativo", gostos: "Liberdade de horários", desgostos: "Microgerenciamento", relacao_equipe: "Bem humorado", sentimento_trabalho: "Sobe e desce de energia", motivacoes: "Inovação", hardskills_softskills: "Criatividade, Resolução" },
        { personalidade: "Workaholic focado em metas", gostos: "Desafios difíceis, horas extras", desgostos: "Pausas prolongadas", relacao_equipe: "Competitivo", sentimento_trabalho: "Acelerado", motivacoes: "Crescimento de carreira", hardskills_softskills: "Gestão, Negociação" }
    ];
}

async function main() {
    console.log('🚀 Iniciando Simulação de Monte Carlo para POC de Qualidade de Vida...');
    console.log(`📊 Meta: ${NUM_PERSONAS} Personas, de ${START_DATE.toLocaleDateString()} a ${END_DATE.toLocaleDateString()}`);

    const db = new Client({ connectionString: DATABASE_URL });
    await db.connect();

    try {
        // 1. Coletar eixos disponíveis no banco
        const resEixos = await db.query('SELECT id_eixo, nome FROM eixos_esg');
        let eixos = resEixos.rows;
        if (eixos.length === 0) {
            throw new Error("Tabela 'eixos_esg' vazia. Execute o seed do backend primeiro.");
        }

        // 2. Gerar arquétipos base com IA
        const arquetipos = await gerarPersonasComIA();
        const personasCriadas = [];

        // 3. Criar os colaboradores e personas no banco de dados e ChromaDB
        console.log(`\n👤 Criando ${NUM_PERSONAS} colaboradores e personas...`);
        for (let i = 0; i < NUM_PERSONAS; i++) {
            const arquetipo = arquetipos[i % arquetipos.length];
            const email = `colab_simulado_${crypto.randomBytes(4).toString('hex')}@serpro.gov.br`;

            // Insere Colaborador
            const resColab = await db.query(
                'INSERT INTO colaboradores (credenciais_acesso) VALUES ($1) RETURNING id_colaborador',
                [email]
            );
            const id_colaborador = resColab.rows[0].id_colaborador;

            // Insere Persona
            const nome = `Colaborador Simulado ${i + 1}`;
            const resPersona = await db.query(`
                INSERT INTO personas 
                (id_colaborador, nome_preferido, personalidade, gostos, desgostos, relacao_equipe, sentimento_trabalho, motivacoes, hardskills_softskills, aceite_lgpd_termos)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_persona
            `, [
                id_colaborador, nome, arquetipo.personalidade, arquetipo.gostos, arquetipo.desgostos, 
                arquetipo.relacao_equipe, arquetipo.sentimento_trabalho, arquetipo.motivacoes, arquetipo.hardskills_softskills, true
            ]);
            
            const id_persona = resPersona.rows[0].id_persona;
            personasCriadas.push(id_persona);

            // Envia para o motor IA criar o Gêmeo Digital Vetorial no ChromaDB
            try {
                await axios.post(`${IA_SERVICE_URL}/twin`, {
                    id_persona, respostasOnboarding: arquetipo
                });
            } catch (e) {
                // Apenas ignora em caso de timeout local do LLM
            }

            if ((i + 1) % 100 === 0) console.log(`   ... ${i + 1} personas registradas.`);
        }

        // 4. Simular histórico diário para as personas (12 meses de conversas)
        console.log(`\n💬 Simulando histórico interativo (App Mobile) para ${NUM_PERSONAS} personas...`);
        let interacoesInseridas = 0;
        const iaCache = {};

        for (const id_persona of personasCriadas) {
            let currentDate = new Date(START_DATE);
            let currentMonth = -1;
            let eixoFocoMes = null;
            
            while (currentDate <= END_DATE) {
                // Checa se virou o mês para recalcular o enquadramento/foco da IA na persona dinamicamente
                if (currentDate.getMonth() !== currentMonth) {
                    currentMonth = currentDate.getMonth();
                    
                    // Chance de 15% da persona ter um mês "neutro" onde não se enquadra em nenhum eixo
                    const isNeutral = Math.random() < 0.15;
                    if (isNeutral) {
                        eixoFocoMes = null; // Não será contabilizada/diluída
                    } else {
                        // IA foca dinamicamente em APENAS 1 eixo de saúde/ESG por persona no mês
                        // Isso garante que a soma de personas nos eixos nunca ultrapasse 100
                        eixoFocoMes = eixos[Math.floor(Math.random() * eixos.length)];
                    }
                }

                if (!eixoFocoMes) {
                    // Persona não enquadrada em nenhum eixo no mês: avança o dia sem gerar interações
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                const relato = respostas_diarias[Math.floor(Math.random() * respostas_diarias.length)];
                
                const id_eixo = eixoFocoMes.id_eixo;
                const nome_eixo = eixoFocoMes.nome;

                // Cria uma flutuação orgânica cruzando o eixo e o mês (evita crescimento linear igual para todos)
                const comportamentos = [
                    50 + Math.floor(Math.random() * 20), // Queda de adesão
                    70 + Math.floor(Math.random() * 20), // Estabilidade
                    85 + Math.floor(Math.random() * 15)  // Alta adesão
                ];
                let adesao = comportamentos[(id_eixo + currentMonth) % 3];
                if (adesao > 100) adesao = 100;

                const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
                const pergunta_ia = perguntasVariadas[Math.floor(Math.random() * perguntasVariadas.length)];
                let sugestao_ia = "Sugestão corporativa preventiva baseada no perfil e no eixo avaliado.";

                // Aciona a OpenAI diretamente garantindo IA 100% dinâmica. Uso de cache inteligente para 
                // evitar estouro de limite da API (429 Rate Limit) em 15.000 requisições simultâneas.
                const cacheKey = `${nome_eixo}|${relato}`;
                if (iaCache[cacheKey]) {
                    sugestao_ia = iaCache[cacheKey];
                } else {
                    try {
                        const promptMsg = `Como mentor corporativo ESG, dê uma sugestão curta em UMA frase e acolhedora para um colaborador do grupo "${nome_eixo}" que relatou: "${relato}".`;
                        const iaRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: promptMsg }],
                            temperature: 0.8
                        }, {
                            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
                        });
                        sugestao_ia = iaRes.data.choices[0].message.content.trim();
                        iaCache[cacheKey] = sugestao_ia;
                    } catch (e) {
                        console.error('⚠️ Falha ao acionar a OpenAI durante interações diárias:', e.message);
                    }
                }

                await db.query(`
                    INSERT INTO interacoes 
                    (id_persona, id_eixo, data_interacao, pergunta_ia, resposta_colaborador, sugestao_ia, percentual_adesao, feedback_sugestao)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    id_persona, id_eixo, currentDate.toISOString(), pergunta_ia, relato, sugestao_ia, adesao, feedback
                ]);

                interacoesInseridas++;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        console.log(`   ✅ ${interacoesInseridas} interações (diálogos IA x Humano) geradas com sucesso.`);

        // 5. Simulação da consolidação analítica mensal para o Gestor (Gêmeos Organizacionais)
        console.log(`\n🧠 Consolidando agrupamentos do Analista IA para análise longitudinal (12 meses)...`);
        
        // Garante a existência dos agrupamentos base no banco caso o script de cleanup os tenha removido
        const resCheckGrupos = await db.query('SELECT count(*) as count FROM gemeos_organizacionais');
        if (parseInt(resCheckGrupos.rows[0].count) === 0) {
            const categoriasIniciais = [
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
            for (const c of categoriasIniciais) {
                await db.query(`INSERT INTO gemeos_organizacionais (nome_categoria, descricao_perfil) VALUES ($1, $2)`, [c.nome, c.desc]);
            }
        }

        const resGrupos = await db.query('SELECT id_agrupamento, nome_categoria, descricao_perfil FROM gemeos_organizacionais');
        const grupos = resGrupos.rows;

        const categoriasMapeadas = [
            { nome: 'Tendência ao Burnout', id_eixo: 2 },
            { nome: 'Sedentarismo e Saúde Física', id_eixo: 1 },
            { nome: 'Problemas de Relacionamento na Equipe', id_eixo: 9 },
            { nome: 'Tendência à Procrastinação', id_eixo: 3 },
            { nome: 'Desmotivação e Baixo Engajamento', id_eixo: 3 },
            { nome: 'Insegurança Psicológica', id_eixo: 10 },
            { nome: 'Isolamento no Trabalho Remoto/Híbrido', id_eixo: 4 },
            { nome: 'Insatisfação com Reconhecimento', id_eixo: 8 },
            { nome: 'Desequilíbrio Vida-Trabalho', id_eixo: 4 },
            { nome: 'Falta de Perspectiva de Crescimento', id_eixo: 7 }
        ];

        if (grupos.length > 0) {
            let tempDate = new Date(START_DATE);
            while (tempDate <= END_DATE) {
                const nextMonth = new Date(tempDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                for (const grupo of grupos) {
                    const categoria = categoriasMapeadas.find(c => c.nome === grupo.nome_categoria);
                    const id_eixo = categoria ? categoria.id_eixo : eixos[0].id_eixo;

                    // Calcula a evolução real desse eixo baseado nas interações daquele mês específico
                    const resMedia = await db.query(`
                        SELECT AVG(percentual_adesao) as media 
                        FROM interacoes 
                        WHERE id_eixo = $1 AND data_interacao >= $2 AND data_interacao < $3
                    `, [id_eixo, tempDate.toISOString(), nextMonth.toISOString()]);

                    let pontuacao = 70; // Valor neutro
                    if (resMedia.rows[0].media) {
                        pontuacao = Math.round(parseFloat(resMedia.rows[0].media));
                    }

                    let sugestao_estrategica = '';
                    try {
                        // Aciona a OpenAI diretamente para gerar a análise estratégica do grupo mensalmente
                        const promptAnalise = `Você é um Analista de Bem-Estar ESG. Avalie a categoria "${grupo.nome_categoria}" (Perfil: ${grupo.descricao_perfil}) que atingiu ${pontuacao}% de adesão positiva neste mês. Gere UMA sugestão estratégica, corporativa e preventiva para o gestor apoiar esse grupo. Seja direto e objetivo (máximo de 2 frases).`;
                        const iaRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: promptAnalise }],
                            temperature: 0.7
                        }, {
                            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
                        });
                        sugestao_estrategica = `[${grupo.nome_categoria}] ${iaRes.data.choices[0].message.content.trim()}`;
                    } catch (e) {
                        console.error(`⚠️ Erro ao acionar OpenAI para o grupo ${grupo.nome_categoria}:`, e.message);
                        sugestao_estrategica = `[${grupo.nome_categoria}] Fallback IA offline. Pontuação observada: ${pontuacao}%`;
                    }

                    await db.query(`
                        INSERT INTO historico_evolucao_esg 
                        (id_agrupamento, id_eixo, data_medicao, pontuacao_agregada, sugestao_estrategica_ia)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [grupo.id_agrupamento, id_eixo, tempDate.toISOString(), pontuacao, sugestao_estrategica]);
                }
                // Avança mês a mês para o Dashboard
                tempDate = nextMonth;
            }
            console.log(`   ✅ Histórico preditivo mensal gerado para o Dashboard com base nos clusters ESG.`);
        } else {
            console.log(`   ⚠️ Grupos não encontrados. Garanta que o Analista IA já foi inicializado no backend antes.`);
        }

        console.log(`\n🎉 Simulação de Monte Carlo finalizada com sucesso!`);
        console.log(`Abra a Plataforma Web para analisar o cruzamento volumétrico dos dados anonimizados.`);

    } catch (error) {
        console.error('❌ Erro durante a simulação:', error);
    } finally {
        await db.end();
    }
}

main();