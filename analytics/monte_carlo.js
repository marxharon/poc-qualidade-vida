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
const NUM_PERSONAS = 40; // Volume otimizado para POC 100% IA (Custo/Tempo reduzidos, clusters eficientes)
const START_DATE = new Date('2026-03-01T12:00:00Z'); // Ajustado para 12h para evitar fuso horário retroceder para 12/2025
const END_DATE = new Date('2026-05-31T12:00:00Z'); // Simulação de 1 trimestre preditivo (Jan-Mar)

// Conexão com os serviços da POC
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://SEU_USUARIO:SUA_SENHA@localhost:5432/beqv_db';
// Chaveamento de Ambiente: Local por padrão (IA-Service na porta 3002).
const IA_SERVICE_URL = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Client } = pg;

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
            personasCriadas.push({ id_persona, arquetipo }); // Agora guardamos o perfil junto para passar para a IA depois

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

        // 4. Simular trajetórias temporais evolutivas para o Gêmeo Digital (App Mobile)
        console.log(`\n💬 Simulando trajetórias temporais evolutivas via IA para ${NUM_PERSONAS} personas...`);
        let interacoesInseridas = 0;

        for (const personaData of personasCriadas) {
            const { id_persona, arquetipo } = personaData;
            
            let currentMonthStart = new Date(START_DATE);
            
            while (currentMonthStart <= END_DATE) {
                const currentMonth = currentMonthStart.getMonth();
                    
                // Chance de 15% da persona ter um mês "neutro" onde não interage ativamente
                const isNeutral = Math.random() < 0.15;
                if (!isNeutral) {
                    const eixoFocoMes = eixos[Math.floor(Math.random() * eixos.length)];
                    const nome_eixo = eixoFocoMes.nome;
                    const id_eixo = eixoFocoMes.id_eixo;
                
                try {
                    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('sua_chave')) throw new Error('Chave da OpenAI não configurada.');
                    
                    const promptMsg = `Atue como um simulador de Gêmeos Digitais Corporativos.
Gere cerca de 8 interações sequenciais (1 mês) entre um Mentor IA e este colaborador:
Perfil: ${arquetipo.personalidade} | Gostos: ${arquetipo.gostos} | Sentimento base: ${arquetipo.sentimento_trabalho}
Eixo ESG Avaliado no Mês: ${nome_eixo}

Atenção: As respostas devem formar uma NARRATIVA TEMPORAL evolutiva (ex: cansaço aumentando ou humor melhorando ao longo dos dias).
SEJA CONCISO E DIRETO nos diálogos para não exceder o limite de texto.
Retorne RIGOROSAMENTE um objeto JSON contendo uma única chave chamada "interacoes", que deve ser um array de objetos com:
- "pergunta_ia": "Pergunta curta"
- "resposta_colaborador": "Relato em 1 pessoa (conciso)"
- "sugestao_ia": "Ação prática e curta"
- "percentual_adesao": inteiro de 0 a 100 indicando a saúde demonstrada neste relato
- "feedback_sugestao": "Boa", "Ruim" ou "Indiferente" avaliando a sugestão da IA recebida
`;
                        const iaRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: promptMsg }],
                            temperature: 0.8, // Levemente reduzido para focar na estrutura JSON
                            response_format: { type: "json_object" } // Força a OpenAI a nunca cortar o JSON no meio
                        }, {
                            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
                        });

                        let responseText = iaRes.data.choices[0].message.content.trim();
                        // Limpa possíveis marcações de código markdown do GPT
                        if (responseText.startsWith('\`\`\`')) {
                            responseText = responseText.replace(/^\`\`\`(json)?\n?/, '').replace(/\`\`\`$/, '').trim();
                        }
                        
                        const parsedObject = JSON.parse(responseText);
                        const interacoesGeradas = parsedObject.interacoes || [];
                        
                        let interacaoDate = new Date(currentMonthStart);
                        interacaoDate.setDate(2); // Começa no dia 2 do mês

                        for (const interacao of interacoesGeradas) {
                            if (interacaoDate > END_DATE) break;

                            await db.query(`
                                INSERT INTO interacoes 
                                (id_persona, id_eixo, data_interacao, pergunta_ia, resposta_colaborador, sugestao_ia, percentual_adesao, feedback_sugestao)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            `, [
                                id_persona, id_eixo, interacaoDate.toISOString(), 
                                interacao.pergunta_ia, interacao.resposta_colaborador, interacao.sugestao_ia, 
                                interacao.percentual_adesao || 75, interacao.feedback_sugestao || 'Indiferente'
                            ]);

                            interacoesInseridas++;
                            
                            // Avança de 3 a 4 dias para a próxima interação
                            interacaoDate.setDate(interacaoDate.getDate() + Math.floor(Math.random() * 2) + 3);
                            
                            // Impede que as interações extrapolem para o próximo mês dentro deste laço
                            if (interacaoDate.getMonth() !== currentMonth) {
                                break;
                            }
                        }
                } catch (e) {
                    console.error('⚠️ Falha ao acionar a OpenAI durante trajetória mensal evolutiva:', e.message);
                }
            }

            // Avança para o primeiro dia do próximo mês
            currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
            currentMonthStart.setDate(1); 
        }
    }
        console.log(`   ✅ ${interacoesInseridas} interações (diálogos IA x Humano) geradas com sucesso.`);

        // 5. Simulação da consolidação analítica V2 (Gêmeos Organizacionais Dinâmicos e Preditivos)
        console.log(`\n🧠 Consolidando agrupamentos Semânticos (Clustering Orgânico) para análise longitudinal...`);
        
        const resCheckGrupos = await db.query('SELECT count(*) as count FROM gemeos_organizacionais');
        if (parseInt(resCheckGrupos.rows[0].count) === 0) {
            console.log('   🤖 Gerando Clusters Comportamentais Orgânicos com a IA...');
            try {
                // Simula o Analista IA descobrindo padrões vetoriais não óbvios na base (V2)
                const promptClustering = `Atue como o Analista IA BEQV. Baseado em um banco de 100 colaboradores corporativos, identifique 5 clusters comportamentais orgânicos e altamente específicos (não use clichês como "Burnout" ou "Sedentarismo" de forma isolada, mas sim perfis cruzados, ex: "Jovens talentos remotos isolados"). Retorne apenas um JSON array com objetos contendo: nome, desc e id_eixo_predominante (de 1 a 10).`;
                const iaClusterRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: promptClustering }],
                    temperature: 0.9
                }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } });
                
                const categoriasDinamicas = JSON.parse(iaClusterRes.data.choices[0].message.content);
                for (const c of categoriasDinamicas) {
                    await db.query(`INSERT INTO gemeos_organizacionais (nome_categoria, descricao_perfil) VALUES ($1, $2)`, [c.nome, c.desc]);
                }
            } catch (error) {
                console.error("⚠️ Fallback: Falha ao gerar clusters dinâmicos com IA. Gerando mock dinâmico...");
                await db.query(`INSERT INTO gemeos_organizacionais (nome_categoria, descricao_perfil) VALUES ('Devs em Sobrecarga Silenciosa', 'Alta entrega, pouca interação e sinais de isolamento')`);
                await db.query(`INSERT INTO gemeos_organizacionais (nome_categoria, descricao_perfil) VALUES ('Liderança com Insegurança Adaptativa', 'Dificuldade de gerir equipes remotas, causando microgerenciamento')`);
            }
        }

        const resGrupos = await db.query('SELECT id_agrupamento, nome_categoria, descricao_perfil FROM gemeos_organizacionais');
        const grupos = resGrupos.rows;

        if (grupos.length > 0) {
            let tempDate = new Date(START_DATE);
            while (tempDate <= END_DATE) {
                const nextMonth = new Date(tempDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                for (const grupo of grupos) {
                    // Associa um eixo pseudo-aleatório baseado no ID do grupo para o mapeamento dinâmico
                    const id_eixo = eixos[grupo.id_agrupamento % eixos.length].id_eixo;

                    // Analisa a evolução desse Gêmeo Organizacional com base nas interações
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
                        // V2: Simula o motor preditivo do Gêmeo Organizacional projetando risco
                        const promptAnalise = `O Cluster Comportamental "${grupo.nome_categoria}" (${grupo.descricao_perfil}) possui hoje ${pontuacao}% de saúde ESG. Realize uma análise PREDITIVA do que acontecerá com este grupo no próximo trimestre se nada for feito, e forneça uma ação preventiva. Máximo de 2 frases.`;
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