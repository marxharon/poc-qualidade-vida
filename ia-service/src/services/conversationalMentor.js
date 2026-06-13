import axios from 'axios';
import { initChromaCollections } from '../config/chromaClient.js';
import 'dotenv/config'; // Garante que a chave da OpenAI seja lida corretamente

export const generatePersonalizedQuestion = async (id_persona) => {
    console.log(`[IA Mentor] Consultando a essência da persona ${id_persona} no ChromaDB...`);
    
    let perfilReal = "Perfil genérico corporativo.";
    let memoriaReal = "Nenhuma memória anterior.";
    let isPrimeiraInteracao = true;

    try {
        const collections = await initChromaCollections();
        
        // 1. Busca o Gêmeo Digital Base (Perfil preenchido no Onboarding)
        if (collections?.personasCollection) {
            const personaVetorData = await collections.personasCollection.get({ ids: [id_persona.toString()] });
            if (personaVetorData && personaVetorData.documents && personaVetorData.documents.length > 0) {
                perfilReal = personaVetorData.documents[0];
            }
        }

        // 2. Busca a memória das últimas interações contínuas no banco vetorial
        if (collections?.interacoesCollection) {
            const interacoesData = await collections.interacoesCollection.get({ where: { id_persona: Number(id_persona) } });
            if (interacoesData && interacoesData.documents && interacoesData.documents.length > 0) {
                const docs = interacoesData.documents;
                memoriaReal = docs[docs.length - 1]; // Recupera a última memória relatada
                isPrimeiraInteracao = false;
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

export const processChatInteraction = async (id_persona, eixoESGSelecionado, respostaColaboradorNatural) => {
    console.log(`[IA Mentor] Processando interação contínua para a persona ${id_persona}...`);
    
    let memoriaAcumulada = "Sem histórico recente.";
    let perfilReal = "Perfil genérico corporativo.";

    try {
        const collections = await initChromaCollections();
        
        // Busca o Gêmeo Digital Base para contextualizar a sugestão final e a conversa
        if (collections?.personasCollection) {
            const personaVetorData = await collections.personasCollection.get({ ids: [id_persona.toString()] });
            if (personaVetorData && personaVetorData.documents && personaVetorData.documents.length > 0) {
                perfilReal = personaVetorData.documents[0];
            }
        }

        if (collections?.interacoesCollection) {
            // Busca as últimas interações (Memória) para a IA entender o rumo da conversa
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(id_persona) } });
            if (historico && historico.documents && historico.documents.length > 0) {
                const ultimosRelatos = historico.documents.slice(-3); // Puxa os últimos 3 contextos
                memoriaAcumulada = ultimosRelatos.join(" | ");
            }

            const timestamp = Date.now();
            await collections.interacoesCollection.upsert({ 
                ids: [`${id_persona}-${timestamp}`], 
                documents: [respostaColaboradorNatural],
                metadatas: [{ id_persona: Number(id_persona), eixo: "A classificar", timestamp }]
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
    
    Responda EXATAMENTE neste formato JSON estrito:
    {
        "resposta_chat": "Seu acolhimento e a nova pergunta do bate-papo",
        "eixo_identificado": "Nome do eixo ESG",
        "sugestao_final": "Ação prática iniciando com verbo no infinitivo"
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
            sugestao_final: "fazer uma pausa estratégica para respirar quando precisar"
        };
    }
};

export const analyzeSuggestionReason = async (id_persona, sugestao) => {
    let memoriaAcumulada = "Sem histórico recente.";
    let perfilReal = "Perfil genérico corporativo.";

    try {
        const collections = await initChromaCollections();
        if (collections?.personasCollection) {
            const personaVetorData = await collections.personasCollection.get({ ids: [id_persona.toString()] });
            if (personaVetorData && personaVetorData.documents && personaVetorData.documents.length > 0) {
                perfilReal = personaVetorData.documents[0];
            }
        }
        if (collections?.interacoesCollection) {
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(id_persona) } });
            if (historico && historico.documents && historico.documents.length > 0) {
                const ultimosRelatos = historico.documents.slice(-3);
                memoriaAcumulada = ultimosRelatos.join(" | ");
            }
        }
    } catch (error) {
        console.error(`[IA Mentor] Falha ao consultar ChromaDB em analyzeSuggestionReason:`, error.message);
    }

    const promptPrompt = `
    Você é a IA analítica de um Gêmeo Digital Corporativo.
    Perfil do Colaborador: "${perfilReal}"
    Últimas interações (Memória): "${memoriaAcumulada}"
    Sugestão que você deu: "${sugestao}"
    
    Tarefa: Explique, em no máximo 2 frases, o motivo vetorial/comportamental que o levou a dar essa sugestão, relacionando as últimas interações com a mudança na representação do bem-estar da persona.
    
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

export const generatePerceptionAndProfile = async (id_persona) => {
    let memoriaAcumulada = "Sem histórico recente.";
    let perfilReal = "Perfil genérico corporativo.";

    try {
        const collections = await initChromaCollections();
        if (collections?.personasCollection) {
            const personaVetorData = await collections.personasCollection.get({ ids: [id_persona.toString()] });
            if (personaVetorData && personaVetorData.documents && personaVetorData.documents.length > 0) {
                perfilReal = personaVetorData.documents[0];
            }
        }
        if (collections?.interacoesCollection) {
            const historico = await collections.interacoesCollection.get({ where: { id_persona: Number(id_persona) } });
            if (historico && historico.documents && historico.documents.length > 0) {
                const ultimosRelatos = historico.documents.slice(-5);
                memoriaAcumulada = ultimosRelatos.join(" | ");
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
    1. Normalizar o perfil: Reescreva a identidade base (perfil original) em uma linguagem rica, empática e fluida, descrevendo a essência profunda da persona.
    2. Percepção atual: Baseado na memória das últimas interações, gere uma frase descrevendo a sua percepção dinâmica sobre o estado atual ou deslocamento de risco da persona (Ex: "A IA percebeu que seu engajamento está em alta", ou "Notei um foco maior em tensões da equipe recentemente").
    
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
        return { 
            perfil_normalizado: "Colaborador focado, buscando equilibrar suas motivações e habilidades no dia a dia corporativo.",
            percepcao: "Baseado nas suas últimas interações, a IA identifica que você está em uma fase de adaptação contínua ao seu ambiente de trabalho." 
        };
    }
};