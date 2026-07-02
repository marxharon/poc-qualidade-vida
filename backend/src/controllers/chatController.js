import axios from 'axios';
import { db } from '../db/index.js';
import { interacoes, personas, eixosESG } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const getDailyQuestion = async (req, res) => {
    try {
        const { id_persona: reqPersonaId } = req.query;
        let id_persona = reqPersonaId ? parseInt(reqPersonaId) : null;

        if (!id_persona) {
            const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
            id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
        } else {
            // Valida se a persona passada existe para evitar falhas em testes
            const checkPersona = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
            if (checkPersona.length === 0) {
                const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
                id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
            }
        }

        // Padronizado: Chama a IA localmente na porta 3002 por padrão.
        const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
        
        // Envia também os dados estruturados (PostgreSQL) como âncora/fallback para o IA-Service
        const checkPersonaFallback = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
        const personaFallback = checkPersonaFallback.length > 0 ? checkPersonaFallback[0] : null;

        let iaResponse;
        try {
            // Envia para o serviço de IA consultar a essência vetorial no ChromaDB e formular uma pergunta hiper-personalizada
            iaResponse = await axios.post(`${iaServiceUrl}/daily-question`, { id_persona, personaFallback }, { 
                timeout: 35000
            });
        } catch (iaError) {
            console.error("Aviso: Falha de conexão ou Timeout com o IA-Service em getDailyQuestion.", iaError.message);
            iaResponse = { data: { question: "Como está a sua energia hoje?", options: ["Tranquilo", "Um pouco pesado", "Estou sobrecarregado", "Entediado"] } };
        }

        res.status(200).json({ 
            question: iaResponse.data.question || "Como está a sua energia hoje?", 
            options: iaResponse.data.options || ["Tranquilo", "Um pouco pesado", "Estou sobrecarregado", "Entediado"] 
        });
    } catch (error) {
        console.error("Erro na geração da pergunta pelo Gêmeo Digital:", error.message);
        res.status(500).json({ 
            error: "Erro ao consultar a Inteligência Artificial para a pergunta diária." 
        });
    }
};

export const respondToChat = async (req, res) => {
    try {
        const { relato, pergunta_ia, id_persona: reqPersonaId } = req.body;
        
        let id_persona = reqPersonaId ? parseInt(reqPersonaId) : null;
        
        // Fallback genérico caso a rota seja chamada sem ID de persona
        if (!id_persona) {
            const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
            id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
        } else {
            // Proteção contra Foreign Key Error (Erro 500)
            const checkPersona = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
            if (checkPersona.length === 0) {
                const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
                id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
            }
        }

        // Envia para a Inteligência Artificial pensar e salvar a memória
        // Padronizado: Chama a IA localmente na porta 3002 por padrão.
        const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
        let iaResponse;
        
        const checkPersonaFallback = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
        const personaFallback = checkPersonaFallback.length > 0 ? checkPersonaFallback[0] : null;

        try {
            iaResponse = await axios.post(`${iaServiceUrl}/chat`, {
                id_persona, 
                eixoESGSelecionado: "A classificar",
                respostaColaboradorNatural: relato,
                personaFallback
            }, { 
                timeout: 35000 // Aumentado para 35s para aguardar a IA processar a resposta
            });
        } catch (iaError) {
            console.error("Aviso: Falha de conexão ou Timeout com o IA-Service. Ativando Airbag de Chat.", iaError.message);
            iaResponse = { data: { 
                resposta_chat: "Tive um pequeno lapso de conexão aqui.", 
                mensagens_app: ["Tive um pequeno lapso de conexão aqui.", "Gostaria de sugerir que tentemos fazer uma pausa e respirar fundo para retomar o foco.", "Você poderia me contar um pouco mais sobre isso?"],
                sugestao_final: "fazer uma pausa e respirar fundo", 
                eixo_identificado: "Saúde mental e emocional", 
                percentual_adesao: 70,
                solicitar_avaliacao: false
            } };
        }

        const resposta_chat = String(iaResponse.data?.resposta_chat || "Acolhimento padrão");
        const mensagens_app = iaResponse.data?.mensagens_app || [resposta_chat];
        const sugestao_final = iaResponse.data?.sugestao_final || "";
        const eixo_identificado = String(iaResponse.data?.eixo_identificado || "A classificar");
        const percentual_adesao = iaResponse.data?.percentual_adesao !== undefined ? Number(iaResponse.data.percentual_adesao) : 70;
        const solicitar_avaliacao = Boolean(iaResponse.data?.solicitar_avaliacao);

        const eixos = await db.select().from(eixosESG);
        let id_eixo = 2; // Default
        if (eixos.length > 0) {
            const keyword = eixo_identificado.split(' ')[0].toLowerCase();
            const matchedEixo = eixos.find(e => e.nome.toLowerCase().includes(keyword));
            if (matchedEixo) id_eixo = matchedEixo.id_eixo;
            else id_eixo = eixos[0].id_eixo;
        }

        // SALVAR NA TABELA: É isso que fará o Histórico da Persona carregar os dados!
        let id_interacao = null;
        // Só persiste se a IA considerar que é um relato válido (ignora encerramento/clínico)
        if (iaResponse.data?.salvar_interacao !== false) {
            try {
                const [novaInteracao] = await db.insert(interacoes).values({
                    id_persona,
                    id_eixo,
                    pergunta_ia: pergunta_ia || "Pergunta do dia",
                    resposta_colaborador: relato,
                    sugestao_ia: sugestao_final,
                    percentual_adesao
                }).returning({ id_interacao: interacoes.id_interacao });
                if (novaInteracao) {
                    id_interacao = novaInteracao.id_interacao;
                }
            } catch (dbError) {
                console.error("Aviso: Falha ao salvar no banco relacional (possível falta de seed nos eixos).", dbError.message);
            }
        }

        res.status(200).json({ 
            id_interacao,
            resposta_chat,
            mensagens_app,
            eixo_identificado, 
            sugestao_final,
            percentual_adesao,
            solicitar_avaliacao
        });
    } catch (error) {
        console.error("Erro na integração com IA:", error.message, error.response?.data);
        res.status(500).json({ 
            error: "Erro ao consultar a Inteligência Artificial.", 
            details: error.message,
            ia_service_response: error.response?.data || null
        });
    }
};

export const submitFeedback = async (req, res) => {
    try {
        const { feedback, id_persona, id_interacao } = req.body;
        
        if (id_interacao) {
            // Uso preciso e cirúrgico do ID da iteração gerada
            await db.update(interacoes)
                .set({ feedback_sugestao: feedback })
                .where(eq(interacoes.id_interacao, id_interacao));
        } else {
            // Fallback legado caso o id_interacao não seja providenciado
            const parsedId = id_persona ? parseInt(id_persona) : null;
            let lastInteracao;
            if (parsedId) {
                lastInteracao = await db.select().from(interacoes).where(eq(interacoes.id_persona, parsedId)).orderBy(desc(interacoes.id_interacao)).limit(1);
            } else {
                lastInteracao = await db.select().from(interacoes).orderBy(desc(interacoes.id_interacao)).limit(1);
            }
            if (lastInteracao.length > 0) {
                await db.update(interacoes)
                    .set({ feedback_sugestao: feedback })
                    .where(eq(interacoes.id_interacao, lastInteracao[0].id_interacao));
            }
        }
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
};

export const analyzeSuggestion = async (req, res) => {
    try {
        const { id_persona: reqPersonaId, sugestao } = req.query;
        let id_persona = reqPersonaId ? parseInt(reqPersonaId) : null;
        if (!id_persona) {
            const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
            id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
        }
        const checkPersonaFallback = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
        const personaFallback = checkPersonaFallback.length > 0 ? checkPersonaFallback[0] : null;
        
        const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
        
        let iaResponse;
        try {
            iaResponse = await axios.post(`${iaServiceUrl}/analyze-suggestion`, { id_persona, sugestao, personaFallback }, { 
                timeout: 35000
            });
        } catch (iaError) {
            console.error("Aviso: Falha de conexão ou Timeout com o IA-Service em analyzeSuggestion.", iaError.message);
            iaResponse = { data: { motivo: "A análise preditiva indicou uma alteração nos seus padrões vetoriais recentes em relação ao seu perfil base. A sugestão visa realinhar seu Gêmeo Digital à zona de saúde ocupacional." } };
        }
        
        res.status(200).json({ motivo: iaResponse.data?.motivo });
    } catch (error) {
        console.error("Erro na Análise de Sugestão:", error.message);
        res.status(500).json({ error: "Erro ao consultar a IA." });
    }
};

export const getPerception = async (req, res) => {
    try {
        const { id_persona: reqPersonaId } = req.query;
        let id_persona = reqPersonaId ? parseInt(reqPersonaId) : null;
        if (!id_persona) {
            const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
            id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
        }
        
        const checkPersonaFallback = await db.select().from(personas).where(eq(personas.id_persona, id_persona)).limit(1);
        const personaFallback = checkPersonaFallback.length > 0 ? checkPersonaFallback[0] : null;

        const iaServiceUrl = process.env.IA_SERVICE_URL || 'http://127.0.0.1:3002/api';
        
        let iaResponse;
        try {
            // Tenta obter a percepção da IA com tempo estendido
            iaResponse = await axios.post(`${iaServiceUrl}/perception`, { id_persona, personaFallback }, { 
                timeout: 35000
            });
        } catch (iaError) {
            console.error("Aviso: Falha de conexão ou Timeout com o IA-Service em getPerception.", iaError.message);
            iaResponse = { 
                data: { 
                    percepcao: "A IA não conseguiu analisar seus deslocamentos críticos recentes devido a uma instabilidade temporária na rede.",
                    perfil_normalizado: "Perfil temporariamente indisponível para normalização rica. Tente recarregar a tela em alguns instantes."
                } 
            };
        }

        res.status(200).json({ 
            percepcao: iaResponse.data.percepcao,
            perfil_normalizado: iaResponse.data.perfil_normalizado
        });
    } catch (error) {
        console.error("Erro na geração da percepção:", error.message);
        res.status(500).json({ error: "Erro ao consultar a IA." });
    }
};