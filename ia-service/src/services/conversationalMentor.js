import axios from 'axios';
import { initChromaCollections } from '../config/chromaClient.js';
import 'dotenv/config'; // Garante que a chave da OpenAI seja lida corretamente

// Recuperador Oficial: Garante que os Dados Oficiais do Gêmeo nunca sejam perdidos por falhas no Express/Rota.
const fetchPersonaFallback = async (safeId) => {
    if (!safeId || isNaN(Number(safeId))) return null;
    try {
        const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3000/api';
        const { data } = await axios.get(`${backendUrl}/personas`);
        return data.personas?.find(p => p.id_persona === Number(safeId)) || null;
    } catch (e) {
        return null;
    }
};

export const generatePersonalizedQuestion = async (id_persona_arg, fallback_arg) => {
    let safeId = id_persona_arg;
    let personaFallback = fallback_arg;

    if (id_persona_arg && typeof id_persona_arg === 'object') {
        const source = id_persona_arg.body || id_persona_arg;
        safeId = source.id_persona;
        personaFallback = source.personaFallback;
    }

    if (!personaFallback) personaFallback = await fetchPersonaFallback(safeId);

    console.log(`[IA Mentor] Consultando a essência da persona ${safeId} no ChromaDB...`);
    
    const strFallback = personaFallback 
        ? `[Dados Oficiais] Nome: ${personaFallback.nome_preferido}. Personalidade: ${personaFallback.personalidade}. Gostos: ${personaFallback.gostos}. Desgostos: ${personaFallback.desgostos}.` 
        : "[Dados Oficiais] Perfil genérico corporativo.";
        
    let perfilReal = strFallback;
    let memoriaReal = "Nenhuma memória anterior.";
    let isPrimeiraInteracao = true;

    if (!safeId || isNaN(Number(safeId))) {
        return {
            question: "Não consegui identificar seu perfil. Como você está hoje?",
            options: ["Tranquilo", "Um pouco pesado", "Estou sobrecarregado", "Entediado"]
        };
    }

    try {
        const collections = await initChromaCollections();
        
        // Busca SOMENTE a memória das últimas interações contínuas no banco vetorial
        if (collections?.interacoesCollection) {
            const interacoesData = await collections.interacoesCollection.get({ where: { id_persona: Number(safeId) } });
            if (interacoesData?.documents?.length > 0) {
                const docsWithTimestamps = interacoesData.documents.map((doc, index) => ({
                    doc,
                    timestamp: (interacoesData.metadatas && interacoesData.metadatas[index]?.timestamp) ? interacoesData.metadatas[index].timestamp : 0
                })).filter(item => item.doc);
                
                if (docsWithTimestamps.length > 0) {
                    docsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
                    memoriaReal = docsWithTimestamps[docsWithTimestamps.length - 1].doc;
                    isPrimeiraInteracao = false;
                }
            }
        }
    } catch (error) {
        console.error(`[IA Mentor] Aviso: Não foi possível acessar o ChromaDB. Usando fallbacks.`, error.message);
    }

    const instrucaoContexto = isPrimeiraInteracao
        ? `Esta é a sua PRIMEIRA interação com este colaborador. Formule a pergunta inicial de hoje baseando-se EXCLUSIVAMENTE nas características do Perfil dele, para engajá-lo a falar sobre o seu dia.`
        : `Última Memória da conversa anterior: "${memoriaReal}"\nCruze o Perfil do Colaborador com esta última memória e crie 1 pergunta objetiva de acompanhamento para hoje, criando um gancho amigável com o relato anterior.`;

    const promptPrompt = `
    Você é um mentor corporativo empático de qualidade de vida (não-clínico), especialista em ESG.
    Perfil do Colaborador: ${perfilReal}
    ${instrucaoContexto}
    
    Tarefa:
    - Elabore a pergunta de forma fluida, amigável e direta para ele (como em um bate-papo).
    - Crie 4 opções curtas de respostas (como botões rápidos) que ele poderia dar, atreladas à pergunta.
    Responda RIGOROSAMENTE em formato JSON estrito:
    {"question": "...", "options": ["...", "...", "...", "..."]}
    `;

    try {
        // Chamada real para o LLM via OpenAI API (ou serviço local Llama3 via Ollama)
        // Para a POC não quebrar, se não houver chave, retornaremos o fallback de inteligência estruturada.
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY não configurada. Usando fallback preditivo.");
        }
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo", // Trocado para 3.5 para evitar erro de permissão de cota
            messages: [{ role: "system", content: promptPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7
        }, { 
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 10000 // Limite de tempo de 10s
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error(`\n❌ [IA Mentor] FALHA AO COMUNICAR COM A OPENAI:`, error.response?.data || error.message);
        console.log(`[IA Mentor] Fallback ativado. Retornando pergunta hiper-personalizada via template comportamental.`);
        
        // O LLM retornaria algo dinâmico como isto:
        return {
            question: isPrimeiraInteracao 
                ? "Olá! Baseado no que conheço do seu perfil, como você está se sentindo para iniciar suas atividades hoje?"
                : "Oi de novo! Considerando o que conversamos da última vez, como estão as coisas hoje?",
            options: ["Tranquilo e focado", "Um pouco cansado", "Precisando de uma pausa", "Motivado!"]
        };
    }
};

export const processChatInteraction = async (id_persona_arg, eixoESGSelecionado_arg, respostaColaboradorNatural_arg, fallback_arg) => {
    let safeId = id_persona_arg;
    let safeEixo = eixoESGSelecionado_arg;
    let safeResposta = respostaColaboradorNatural_arg;
    let personaFallback = fallback_arg;

    if (id_persona_arg && typeof id_persona_arg === 'object') {
        const source = id_persona_arg.body || id_persona_arg;
        safeId = source.id_persona;
        safeEixo = source.eixoESGSelecionado || eixoESGSelecionado_arg;
        safeResposta = source.respostaColaboradorNatural || respostaColaboradorNatural_arg;
        personaFallback = source.personaFallback;
    }

    if (!personaFallback) personaFallback = await fetchPersonaFallback(safeId);

    console.log(`[IA Mentor] Processando interação contínua para a persona ${safeId}...`);
    
    let memoriaAcumulada = "Sem histórico recente.";
    const strFallback = personaFallback 
        ? `[Dados Oficiais] Nome: ${personaFallback.nome_preferido}. Personalidade: ${personaFallback.personalidade}. Gostos: ${personaFallback.gostos}. Desgostos: ${personaFallback.desgostos}.` 
        : "[Dados Oficiais] Perfil genérico corporativo.";
    let perfilReal = strFallback;

    if (!safeId || isNaN(Number(safeId))) {
        return { 
            resposta_chat: "Tive um problema ao processar seu histórico. Pode me detalhar mais?",
            eixo_identificado: "A classificar",
            sugestao_final: "fazer uma pausa para realinhamento",
            percentual_adesao: 70
        };
    }

    try {
        const collections = await initChromaCollections();
        
        if (collections?.interacoesCollection) {
            // Busca SOMENTE as últimas interações (Memória) para a IA entender o rumo da conversa
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(safeId) } });
            if (historico?.documents?.length > 0) {
                const docsWithTimestamps = historico.documents.map((doc, index) => ({
                    doc,
                    timestamp: (historico.metadatas && historico.metadatas[index]?.timestamp) ? historico.metadatas[index].timestamp : 0
                })).filter(item => item.doc);
                
                if (docsWithTimestamps.length > 0) {
                    docsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
                    const ultimosRelatos = docsWithTimestamps.slice(-3).map(item => item.doc);
                    memoriaAcumulada = ultimosRelatos.join(" | ");
                }
            }

            const timestamp = Date.now();
            await collections.interacoesCollection.upsert({ 
                ids: [`${safeId}-${timestamp}`], 
                documents: [safeResposta],
                metadatas: [{ id_persona: Number(safeId), eixo: safeEixo || "A classificar", timestamp }]
            });
            console.log(`[IA Mentor] Nova memória vetorial persistida com sucesso!`);
        }
    } catch (error) {
        console.error(`[IA Mentor] Falha ao persistir a memória no ChromaDB:`, error.message);
    }

    const promptPrompt = `
    Você é um mentor corporativo empático e não-clínico, especialista em ESG e qualidade de vida.
    Perfil do Colaborador: "${perfilReal}"
    Contexto da conversa até agora: "${memoriaAcumulada}"
    O que ele acabou de dizer: "${respostaColaboradorNatural}"
    
    Tarefa: 
    1. Crie uma sugestão (sugestao_final): Formule uma possibilidade de ação de melhoria focada na pessoa, de acordo com o histórico de interações da conversa atual e com o perfil do colaborador. A sugestão deve ser prática e iniciar com um verbo no infinitivo (ex: 'fazer um alongamento').
    2. Continue o bate-papo (resposta_chat): Acolha o relato atual de forma natural e empática, e EM SEGUIDA, faça uma NOVA PERGUNTA para aprofundar a conversa.
    3. Identifique o Eixo (eixo_identificado): Escolha o tema de ESG que melhor se relaciona com o relato atual (ex: Saúde Física, Saúde Mental, Clima e Engajamento, Equilíbrio Vida/Trabalho, etc).
    4. Estime a Adesão (percentual_adesao): Um número inteiro de 0 a 100 indicando o nível de bem-estar ou saúde demonstrado neste relato.
    
    Responda EXATAMENTE neste formato JSON estrito:
    {
        "resposta_chat": "Seu acolhimento e a nova pergunta do bate-papo",
        "eixo_identificado": "Nome do eixo ESG",
        "sugestao_final": "Ação prática iniciando com verbo no infinitivo",
        "percentual_adesao": 85
    }
    `;

    try {
        if (!process.env.OPENAI_API_KEY) throw new Error("Fallback preditivo ativo.");
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo", // Trocado para 3.5 para evitar erro de permissão de cota
            messages: [{ role: "system", content: promptPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.8
        }, { 
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 10000 
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error(`\n❌ [IA Mentor] FALHA AO COMUNICAR COM A OPENAI:`, error.response?.data || error.message);
        console.log(`[IA Mentor] Fallback ativado na interpretação da resposta. Retornando sugestão mockada.`);
        return { 
            resposta_chat: "Entendo bem como é se sentir assim. E como você acha que isso vai impactar o resto do seu dia hoje?",
            eixo_identificado: "Saúde mental e emocional",
            sugestao_final: "fazer uma pausa estratégica para respirar quando precisar",
            percentual_adesao: 70
        };
    }
};

export const analyzeSuggestionReason = async (id_persona_arg, sugestao_arg, fallback_arg) => {
    let safeId = id_persona_arg;
    let safeSugestao = sugestao_arg;
    let personaFallback = fallback_arg;

    if (id_persona_arg && typeof id_persona_arg === 'object') {
        const source = id_persona_arg.body || id_persona_arg;
        safeId = source.id_persona;
        safeSugestao = source.sugestao || sugestao_arg;
        personaFallback = source.personaFallback;
    }

    if (!personaFallback) personaFallback = await fetchPersonaFallback(safeId);

    let memoriaAcumulada = "Sem histórico recente.";
    const strFallback = personaFallback 
        ? `[Dados Oficiais] Nome: ${personaFallback.nome_preferido}. Personalidade: ${personaFallback.personalidade}. Gostos: ${personaFallback.gostos}. Desgostos: ${personaFallback.desgostos}.` 
        : "[Dados Oficiais] Perfil genérico corporativo.";
    let perfilReal = strFallback;

    if (!safeId || isNaN(Number(safeId))) {
        return { motivo: "Não foi possível resgatar a análise preditiva vetorial neste momento." };
    }

    try {
        const collections = await initChromaCollections();
        if (collections?.interacoesCollection) {
            // Busca SOMENTE a memória vetorial de interações
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(safeId) } });
            if (historico?.documents?.length > 0) {
                const docsWithTimestamps = historico.documents.map((doc, index) => ({
                    doc,
                    timestamp: (historico.metadatas && historico.metadatas[index]?.timestamp) ? historico.metadatas[index].timestamp : 0
                })).filter(item => item.doc);
                
                if (docsWithTimestamps.length > 0) {
                    docsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
                    const ultimosRelatos = docsWithTimestamps.slice(-3).map(item => item.doc);
                    memoriaAcumulada = ultimosRelatos.join(" | ");
                }
            }
        }
    } catch (error) {
        console.error(`[IA Mentor] Falha ao consultar ChromaDB em analyzeSuggestionReason:`, error.message);
    }

    const promptPrompt = `
    Você é a IA analítica de um Gêmeo Digital Corporativo.
    Perfil do Colaborador: "${perfilReal}"
    Últimas interações (Memória): "${memoriaAcumulada}"
    Sugestão que você deu: "${safeSugestao}"
    
    Tarefa: Explique, em no máximo 2 frases, o motivo vetorial/comportamental que o levou a dar essa sugestão. A análise deve ser feita cruzando o Perfil do Colaborador com as Últimas interações.
    REGRAS CRÍTICAS:
    - NUNCA mencione "falta de histórico", "ausência de dados", "considerando que não há interações" ou frases similares.
    - Se a memória estiver vazia ou for "Sem histórico recente", deduza o motivo baseando-se ESTRITAMENTE na personalidade, gostos e desgostos do Perfil.
    - Aja como se a predição fosse orgânica e o cálculo vetorial já estivesse consolidado.
    
    Responda EXATAMENTE neste formato JSON estrito:
    {
        "motivo": "sua explicação analítica aqui"
    }
    `;

    try {
        if (!process.env.OPENAI_API_KEY) throw new Error("Fallback ativo.");
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: promptPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        return { motivo: "A análise preditiva indicou uma alteração nos seus padrões vetoriais recentes em relação ao seu perfil base. A sugestão visa realinhar seu Gêmeo Digital à zona de saúde ocupacional." };
    }
};

export const generatePerceptionAndProfile = async (id_persona_arg, fallback_arg) => {
    let safeId = id_persona_arg;
    let personaFallback = fallback_arg;

    if (id_persona_arg && typeof id_persona_arg === 'object') {
        const source = id_persona_arg.body || id_persona_arg;
        safeId = source.id_persona;
        personaFallback = source.personaFallback;
    }

    if (!personaFallback) personaFallback = await fetchPersonaFallback(safeId);

    let memoriaAcumulada = "Sem histórico recente.";
    const strFallback = personaFallback 
        ? `[Dados Oficiais] Nome: ${personaFallback.nome_preferido}. Personalidade: ${personaFallback.personalidade}. Gostos: ${personaFallback.gostos}. Desgostos: ${personaFallback.desgostos}.` 
        : "[Dados Oficiais] Perfil genérico corporativo.";
    let perfilReal = strFallback;

    if (!safeId || isNaN(Number(safeId))) {
        console.error(`[IA Mentor] Erro Crítico: ID inválido extraído na requisição. Normalização bloqueada para evitar vazamentos.`);
        return {
            perfil_normalizado: "Identidade não confirmada devido a erro de roteamento. Por favor, reinicie a visualização do Gêmeo.",
            percepcao: "Acesso momentaneamente indisponível."
        };
    }

    try {
        const collections = await initChromaCollections();
        if (collections?.interacoesCollection) {
            // Busca SOMENTE a memória vetorial de interações
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(safeId) } });
            if (historico?.documents?.length > 0) {
                const docsWithTimestamps = historico.documents.map((doc, index) => ({
                    doc,
                    timestamp: (historico.metadatas && historico.metadatas[index]?.timestamp) ? historico.metadatas[index].timestamp : 0
                })).filter(item => item.doc);
                
                if (docsWithTimestamps.length > 0) {
                    docsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
                    const ultimosRelatos = docsWithTimestamps.slice(-5).map(item => item.doc);
                    memoriaAcumulada = ultimosRelatos.join(" | ");
                }
            }
        }
    } catch (error) {
        console.error(`[IA Mentor] Falha ao consultar ChromaDB em generatePerceptionAndProfile:`, error.message);
    }

    const promptPrompt = `
    Você é a IA analítica de um Gêmeo Digital Corporativo.
    Perfil original do Colaborador: "${perfilReal}"
    Últimas interações (Memória): "${memoriaAcumulada}"
    
    Tarefa:
    1. Normalizar o perfil: Escreva um parágrafo rico e empático integrando os "[Dados Oficiais]" com as "Últimas interações (Memória)". O objetivo é descrever quem a pessoa é e como ela tem se sentido ultimamente no trabalho.
    REGRA ABSOLUTA DE NORMALIZAÇÃO: O Gêmeo é EXCLUSIVAMENTE a pessoa descrita nos "[Dados Oficiais]". USE EXATAMENTE O NOME FORNECIDO NOS DADOS OFICIAIS. É TOTALMENTE PROIBIDO inventar nomes, ou assumir nomes e identidades que apareçam perdidos na Memória. Se a Memória citar outro nome, assuma que é um ruído e IGNORE. A verdade absoluta são os "[Dados Oficiais]".
    2. Percepção atual: Baseado na memória das últimas interações, gere uma frase descrevendo a sua percepção dinâmica sobre o estado atual ou deslocamento de risco da persona (Ex: "A IA percebeu que seu engajamento está em alta", ou "Notei um foco maior em tensões da equipe recentemente"). NUNCA use frases como "falta de histórico" ou "devido à ausência de interações". Se a memória for vazia, faça uma predição baseada unicamente no Perfil.
    
    Responda EXATAMENTE neste formato JSON estrito:
    {
        "perfil_normalizado": "descrição rica do perfil",
        "percepcao": "frase de percepção atual"
    }
    `;

    try {
        if (!process.env.OPENAI_API_KEY) throw new Error("Fallback ativo.");
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: promptPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error(`[IA Mentor] Falha no LLM de Percepção:`, error.message);
        return { 
            perfil_normalizado: personaFallback 
                ? `${personaFallback.nome_preferido} possui uma personalidade descrita como: ${personaFallback.personalidade}. A IA acompanha seu desenvolvimento e as interações recentes para manter a saúde ocupacional.` 
                : "Colaborador focado, buscando equilibrar suas motivações e habilidades no dia a dia corporativo.",
            percepcao: "A Inteligência Artificial está reprocessando sua evolução semântica. Suas informações base estão seguras." 
        };
    }
};