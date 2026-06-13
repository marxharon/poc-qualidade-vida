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
        
        // Envia para o serviço de IA consultar a essência vetorial no ChromaDB e formular uma pergunta hiper-personalizada
        const iaResponse = await axios.post(`${iaServiceUrl}/daily-question`, { id_persona });

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
        try {
            iaResponse = await axios.post(`${iaServiceUrl}/chat`, {
                id_persona, 
                eixoESGSelecionado: "A classificar",
                respostaColaboradorNatural: relato
            });
        } catch (iaError) {
            console.error("Aviso: Falha de conexão ou Timeout com o IA-Service. Ativando Airbag de Chat.", iaError.message);
            iaResponse = { data: { resposta_chat: "Tive um pequeno lapso de conexão aqui. Você poderia me contar um pouco mais sobre isso?", sugestao_final: "Lembre-se de fazer uma pausa e respirar fundo.", eixo_identificado: "Saúde mental e emocional" } };
        }

        // Flexibiliza a leitura dependendo de como o ia-service devolve o JSON
        const resposta_chat = iaResponse.data?.resposta_chat || iaResponse.data?.sugestao_acao || "Pode me falar mais sobre isso?";
        const sugestao_acao = iaResponse.data?.sugestao_final || iaResponse.data?.sugestao_acao || "Sugestão padrão acolhedora gerada (IA retornou formato inesperado).";
        const eixoIdentificado = iaResponse.data?.eixo_identificado || "Saúde mental e emocional";
        const percentual_adesao = Math.floor(Math.random() * 20) + 75; // Predição mockada para a POC

        const eixos = await db.select().from(eixosESG);
        let id_eixo = 2; // Default
        if (eixos.length > 0) {
            const keyword = eixoIdentificado.split(' ')[0].toLowerCase();
            const matchedEixo = eixos.find(e => e.nome.toLowerCase().includes(keyword));
            if (matchedEixo) id_eixo = matchedEixo.id_eixo;
            else id_eixo = eixos[0].id_eixo;
        }

        // SALVAR NA TABELA: É isso que fará o Histórico da Persona carregar os dados!
        try {
            await db.insert(interacoes).values({
                id_persona,
                id_eixo,
                pergunta_ia: pergunta_ia || "Pergunta do dia",
                resposta_colaborador: relato,
                sugestao_ia: sugestao_acao,
                percentual_adesao
            });
        } catch (dbError) {
            console.error("Aviso: Falha ao salvar no banco relacional (possível falta de seed nos eixos).", dbError.message);
        }

        res.status(200).json({ 
            sugestao_acao, 
            resposta_chat,
            eixo: eixoIdentificado, 
            percentual_adesao 
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
        const { feedback, id_persona } = req.body;
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
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
};