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
const END_DATE = new Date('2026-05-31T12:00:00Z'); // Simulação de 1 trimestre preditivo (Mar-Mai/2026)

// Conexão com os serviços da POC
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://SEU_USUARIO:SUA_SENHA@localhost:5432/beqv_db';
// Chaveamento de Ambiente: Local por padrão (IA-Service na porta 3002).
const IA_SERVICE_URL = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Client } = pg;

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
        const nomesEixosStr = eixos.map(e => e.nome).join('; ');

        // Integração com ChromaDB para sincronizar a memória vetorial
        let interacoesCollectionId = 'memoria_interacoes_embeddings'; // Fallback de nome padrão
        try {
            await axios.post(`${CHROMADB_URL}/api/v1/collections`, { name: 'memoria_interacoes_embeddings' }).catch(() => {});
            const resCol = await axios.get(`${CHROMADB_URL}/api/v1/collections`);
            const colData = resCol.data || [];
            const foundCol = colData.find(c => c && c.name === 'memoria_interacoes_embeddings');
            if (foundCol && foundCol.id) {
                interacoesCollectionId = foundCol.id;
            }
        } catch (e) {
            console.log('⚠️ Aviso: ChromaDB não acessível para gerir coleções no Monte Carlo.', e.message);
        }

        // 2. Preparação de Elementos Base (Pre-Anchoring)
        const nomesBrasileiros = [
            "Ana Souza", "Bruno Lima", "Carla Dias", "Daniel Gomes", "Eduarda Silva",
            "Felipe Costa", "Gabriela Martins", "Henrique Alves", "Isabela Rocha", "João Fernandes",
            "Karina Ribeiro", "Lucas Carvalho", "Mariana Santos", "Nicolas Pereira", "Olivia Ferreira",
            "Pedro Rodrigues", "Quintino Ramos", "Rafaela Melo", "Samuel Barbosa", "Tatiana Castro",
            "Ubirajara Nunes", "Vitória Moraes", "Wagner Araujo", "Ximena Correia", "Yuri Mendes",
            "Zelia Vieira", "André Machado", "Beatriz Farias", "Caio Teixeira", "Daniela Cavalcanti",
            "Eduardo Batista", "Fernanda Monteiro", "Gustavo Pires", "Helena Duarte", "Igor Freitas",
            "Julia Nogueira", "Leonardo Marques", "Melissa Viana", "Nelson Barros", "Paula Cardoso",
            "Renata Souza", "Thiago Moura", "Amanda Cunha", "Diego Mendes", "Camila Assis",
            "Rodrigo Pinto", "Letícia Guedes", "Marcelo Peixoto", "Aline Novaes", "Fábio Brito"
        ];
        nomesBrasileiros.sort(() => Math.random() - 0.5);

        const temasBase = [
            "focados em TI e Operações (ex: Desenvolvedores, Analistas de Banco de Dados, Suporte de Redes)",
            "focados em Liderança e Estratégia (ex: Gerentes, Tech Leads, Diretores, Product Owners)",
            "focados em Design e Inovação (ex: UX/UI Designers, Pesquisadores, Arquitetos de Soluções)",
            "focados em Processos e Qualidade (ex: Analistas de QA, Scrum Masters, Auditores, Compliance)",
            "focados em Pessoas e Relacionamento (ex: Recursos Humanos, Comunicação Interna, Atendimento)"
        ];

        let previousPersona = null;
        let interacoesInseridas = 0;

        // 3. Pipeline Unitário: Gera Gêmeo, insere no banco, e simula todas as suas interações de uma vez
        console.log(`\n👤 Processando Pipeline Unitário para ${NUM_PERSONAS} Gêmeos Digitais...`);
        
        for (let i = 0; i < NUM_PERSONAS; i++) {
            const nomeAtual = nomesBrasileiros[i % nomesBrasileiros.length];
            const temaAtual = temasBase[i % temasBase.length];
            
            console.log(`\n==================================================================`);
            console.log(`⏳ [${i + 1}/${NUM_PERSONAS}] Gerando Gêmeo: ${nomeAtual} | Área: ${temaAtual.split('(')[0].trim()}`);
            
            let arquetipo = null;
            let tentativas = 0;
            
            if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('sua_chave')) {
                while (!arquetipo && tentativas < 5) {
                    tentativas++;
                    try {
                        // Compara APENAS com o indivíduo anterior para manter a criatividade rolando livremente
                        const contextoAnterior = previousPersona 
                            ? `\nATENÇÃO - REGRA DE OURO: NÃO crie um perfil com traços iguais ao perfil gerado anteriormente (Personalidade: ${previousPersona.personalidade}, Gostos: ${previousPersona.gostos}).` 
                            : '';

                        const response = await axios.post(
                            'https://api.openai.com/v1/chat/completions',
                            {
                                model: 'gpt-3.5-turbo',
                                messages: [{
                                    role: 'system',
                                    content: `Gere 1 perfil de persona corporativa. A pessoa DEVE atuar na área de ${temaAtual} e se chamar EXATAMENTE ${nomeAtual}.
Crie para ${nomeAtual} uma personalidade ÚNICA e crível, com gostos, desgostos e motivações específicos difentes de ${contextoAnterior}
Retorne RIGOROSAMENTE um objeto JSON contendo EXATAMENTE as seguintes chaves com os respectivos valores descritos:
- "nome_preferido": O nome fornecido (${nomeAtual}).
- "personalidade": Uma descrição concisa dos traços psicológicos, de socialização e de comportamento no trabalho.
- "gostos": Hobbies ou preferências no ambiente de trabalho.
- "desgostos": O que a pessoa evita no trato pessoal ou não gosta no trabalho.
- "relacao_equipe": Como a pessoa interage com os colegas.
- "sentimento_trabalho": Como a pessoa se sente atualmente em relação ao seu trabalho.
- "motivacoes": O que impulsiona a pessoa profissionalmente.
- "hardskills_softskills": Principais competências técnicas e comportamentais.`
                                }],
                                temperature: 0.95,
                                response_format: { type: "json_object" }
                            },
                            { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
                        );
                        
                        const p_raw = JSON.parse(response.data.choices[0].message.content);
                        
                        // Proteção contra variação estrutural de resposta da IA
                        let p = p_raw;
                        if (p_raw.persona) p = p_raw.persona;
                        if (p_raw.perfis && p_raw.perfis.length > 0) p = p_raw.perfis[0];
                        
                        const isRepetido = previousPersona && (
                            previousPersona.personalidade.trim().toLowerCase() === (p.personalidade || '').trim().toLowerCase() ||
                            previousPersona.gostos.trim().toLowerCase() === (p.gostos || '').trim().toLowerCase()
                        );

                        if (!isRepetido && p.personalidade && p.nome_preferido) {
                            arquetipo = p;
                        } else {
                            console.log(`   ⚠️ Perfil semelhante ao anterior gerado. Tentando novamente (Tentativa ${tentativas})...`);
                        }
                    } catch (error) {
                        console.log(`   ⚠️ Falha ao contatar OpenAI para o perfil. Detalhe: ${error.message}`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            if (!arquetipo) {
                console.log(`   ⚠️ Usando Fallback mockado para o Gêmeo ${nomeAtual}`);
                arquetipo = {
                    nome_preferido: nomeAtual,
                    personalidade: `Profissional focado em ${temaAtual.split('(')[0].trim()}`,
                    gostos: "Trabalho em equipe e novos desafios",
                    desgostos: "Reuniões não planejadas",
                    relacao_equipe: "Colaborativo",
                    sentimento_trabalho: "Motivado",
                    motivacoes: "Crescimento na empresa",
                    hardskills_softskills: "Organização, Comunicação"
                };
            }
            
            previousPersona = arquetipo;

            // Insere Colaborador no BD Relacional
            const email = `colab_simulado_${crypto.randomBytes(4).toString('hex')}@serpro.gov.br`;
            const resColab = await db.query(
                'INSERT INTO colaboradores (credenciais_acesso) VALUES ($1) RETURNING id_colaborador',
                [email]
            );
            const id_colaborador = resColab.rows[0].id_colaborador;

            // Insere Persona no BD Relacional
            const resPersona = await db.query(`
                INSERT INTO personas 
                (id_colaborador, nome_preferido, personalidade, gostos, desgostos, relacao_equipe, sentimento_trabalho, motivacoes, hardskills_softskills, aceite_lgpd_termos)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_persona
            `, [
                id_colaborador, arquetipo.nome_preferido, arquetipo.personalidade, arquetipo.gostos, arquetipo.desgostos, 
                arquetipo.relacao_equipe, arquetipo.sentimento_trabalho, arquetipo.motivacoes, arquetipo.hardskills_softskills, true
            ]);
            
            const id_persona = resPersona.rows[0].id_persona;

            // Envia para o IA Service processar a Base no Banco Vetorial
            try {
                await axios.post(`${IA_SERVICE_URL}/twin`, {
                    id_persona, 
                    respostasOnboarding: arquetipo
                });
            } catch (e) { }
            
            console.log(`   💬 Simulando e processando interações temporais para ${arquetipo.nome_preferido}...`);
            let currentMonthStart = new Date(START_DATE);
            let historicoPerguntas = [];
            
            while (currentMonthStart <= END_DATE) {
                const currentMonth = currentMonthStart.getMonth();
                    
                const isNeutral = Math.random() < 0.15;
                
                if (!isNeutral) {
                    try {
                        if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('sua_chave')) throw new Error('Chave não configurada.');
                        
                        const promptMsg = `Atue como um simulador de Gêmeos Digitais Corporativos.
Gere cerca de 8 interações sequenciais (1 mês) entre um Mentor IA e este colaborador:
Nome: ${arquetipo.nome_preferido} | Perfil: ${arquetipo.personalidade} | Gostos: ${arquetipo.gostos} | Sentimento base: ${arquetipo.sentimento_trabalho}
Lista de Eixos ESG válidos: ${nomesEixosStr}
${historicoPerguntas.length > 0 ? `\nHISTÓRICO RECENTE DE PERGUNTAS (MEMÓRIA):
A IA já fez as seguintes perguntas a este colaborador recentemente:
[ ${historicoPerguntas.slice(-8).join(' ]\n[ ')} ]

DIRETRIZES DE EVOLUÇÃO DA CONVERSA E UNICIDADE:
1. CONTINUIDADE DO CONTEXTO: Mantenha a coerência narrativa temporal. Se a pessoa relatou um problema ou estado emocional antes, evolua esse tema perguntando sobre o desdobramento da situação.
2. APROFUNDAMENTO SEM REPETIÇÃO: É expressamente proibido usar a mesma frase ou estrutura das perguntas anteriores. Em vez de repetir "Como está sua saúde mental hoje?", pergunte de um ângulo inédito, como "Quais estratégias você aplicou hoje para manter o foco diante daquela sobrecarga que conversamos?".
3. VOCABULÁRIO DIVERSIFICADO: Varie as palavras-chave e a construção sintática para que cada pergunta pareça orgânica, inédita e altamente contextualizada.` : ''}

Atenção: As respostas devem formar uma NARRATIVA TEMPORAL evolutiva (ex: cansaço aumentando ou humor melhorando ao longo dos dias).
Para CADA interação, simule a conversa e IDENTIFIQUE qual eixo ESG da lista fornecida melhor se adequa ao tema discutido.
SEJA EXTREMAMENTE CONCISO E DIRETO nos diálogos. Limite os textos a no máximo 1 ou 3 frases curtas para não exceder o limite de tokens da API.
Retorne RIGOROSAMENTE um objeto JSON contendo uma única chave chamada "interacoes", que deve ser array de objetos com:
- "pergunta_ia": "Pergunta curta, objetiva, empática e estruturalmente INÉDITA"
- "resposta_colaborador": "Relato em 1 pessoa (conciso)"
- "eixo_esg_identificado": "Exatamente o nome de um dos eixos válidos informados acima que se enquadre ao relato do colaborador"
- "sugestao_ia": "Ação prática e curta, que tenha relação com o relato do colaborador e que seja aplicável no ambiente corporativo"
- "percentual_adesao": inteiro de 0 a 100 indicando a saúde demonstrada neste relato
- "feedback_sugestao": "Boa", "Ruim" ou "Indiferente"
`;
                        const iaRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: promptMsg }],
                            temperature: 0.95,
                            frequency_penalty: 0.5,
                            max_tokens: 3500,
                            response_format: { type: "json_object" }
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
                        interacaoDate.setDate(2);

                        for (const interacao of interacoesGeradas) {
                            if (interacaoDate > END_DATE) break;

                            // Identifica o id do eixo que a IA vinculou na resposta
                            const eixoEncontrado = eixos.find(e => e.nome.trim().toLowerCase() === (interacao.eixo_esg_identificado || '').trim().toLowerCase());
                            const id_eixo_dinamico = eixoEncontrado ? eixoEncontrado.id_eixo : eixos[Math.floor(Math.random() * eixos.length)].id_eixo;

                            historicoPerguntas.push(interacao.pergunta_ia);

                            await db.query(`
                                INSERT INTO interacoes 
                                (id_persona, id_eixo, data_interacao, pergunta_ia, resposta_colaborador, sugestao_ia, percentual_adesao, feedback_sugestao)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            `, [
                                id_persona, id_eixo_dinamico, interacaoDate.toISOString(), 
                                interacao.pergunta_ia, interacao.resposta_colaborador, interacao.sugestao_ia, 
                                interacao.percentual_adesao || 75, interacao.feedback_sugestao || 'Indiferente'
                            ]);

                            if (interacoesCollectionId) {
                                try {
                                    await axios.post(`${CHROMADB_URL}/api/v1/collections/${interacoesCollectionId}/upsert`, {
                                        ids: [`${id_persona}-${interacaoDate.getTime()}-${Math.random().toString(36).substring(7)}`],
                                        documents: [interacao.resposta_colaborador],
                                        metadatas: [{ id_persona: Number(id_persona), eixo: id_eixo_dinamico, timestamp: interacaoDate.getTime() }]
                                    });
                                } catch (err) {
                                }
                            }

                            interacoesInseridas++;
                            
                            interacaoDate.setDate(interacaoDate.getDate() + Math.floor(Math.random() * 2) + 3);
                            
                            if (interacaoDate.getMonth() !== currentMonth) {
                                break;
                            }
                        }
                    } catch (e) {
                        console.error('   ⚠️ Falha ao acionar a OpenAI para interações mensais:', e.message);
                    }
                }
                currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
                currentMonthStart.setDate(1); 
            }
        }

        console.log(`\n   ✅ Pipeline finalizado. Total de ${interacoesInseridas} interações geradas com sucesso para todos os Gêmeos.`);

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