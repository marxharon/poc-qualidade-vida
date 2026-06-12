import axios from 'axios';
import { db } from '../db/index.js';
import { interacoes, personas, eixosESG } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const getDailyQuestion = async (req, res) => {
    const { exclude } = req.query;
    
    const questions = [
        "Como você está lidando com a sua carga de trabalho esta semana?",
        "Como está seu nível de energia e disposição hoje?",
        "Você tem conseguido fazer pausas durante o expediente?",
        "Como está o seu relacionamento e comunicação com a equipe hoje?",
        "Você está se sentindo reconhecido pelas suas entregas recentes?",
        "Como você avalia seu equilíbrio entre vida pessoal e profissional hoje?"
    ];

    let available = questions.filter(q => q !== exclude);
    if (available.length === 0) available = questions; // Reseta se todas foram usadas
    const randomQuestion = available[Math.floor(Math.random() * available.length)];

    res.status(200).json({ 
        question: randomQuestion, 
        options: ["Tranquilo", "Um pouco pesado", "Estou sobrecarregado", "Entediado"] 
    });
};

export const respondToChat = async (req, res) => {
    try {
        const { relato, pergunta_ia, id_persona: reqPersonaId } = req.body;
        const eixoSorteado = "Saúde mental e emocional";
        
        let id_persona = reqPersonaId;
        // Fallback genérico caso a rota seja chamada sem ID de persona
        if (!id_persona) {
            const lastPersona = await db.select().from(personas).orderBy(desc(personas.id_persona)).limit(1);
            id_persona = lastPersona.length > 0 ? lastPersona[0].id_persona : 1;
        }

        const eixos = await db.select().from(eixosESG).limit(1);
        const id_eixo = eixos.length > 0 ? eixos[0].id_eixo : 2;

        // Envia para a Inteligência Artificial pensar e salvar a memória
        const iaServiceUrl = process.env.IA_SERVICE_URL || (process.env.USE_LOCAL_SERVICES === 'true' 
            ? 'http://localhost:3002/api' 
            : 'https://ia-service-h3y5.onrender.com/api');
        const iaResponse = await axios.post(`${iaServiceUrl}/chat`, {
            id_persona, 
            eixoESGSelecionado: eixoSorteado,
            respostaColaboradorNatural: relato
        });

        // Flexibiliza a leitura dependendo de como o ia-service devolve o JSON
        const sugestao_acao = iaResponse.data?.data?.sugestao_acao || iaResponse.data?.sugestao_acao || "Sugestão padrão acolhedora gerada (IA retornou formato inesperado).";
        const percentual_adesao = Math.floor(Math.random() * 20) + 75; // Predição mockada para a POC

        // SALVAR NA TABELA: É isso que fará o Histórico da Persona carregar os dados!
        await db.insert(interacoes).values({
            id_persona,
            id_eixo,
            pergunta_ia: pergunta_ia || "Pergunta do dia",
            resposta_colaborador: relato,
            sugestao_ia: sugestao_acao,
            percentual_adesao
        });

        res.status(200).json({ 
            sugestao_acao, 
            eixo: eixoSorteado, 
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
        let lastInteracao;
        
        if (id_persona) {
            lastInteracao = await db.select().from(interacoes).where(eq(interacoes.id_persona, id_persona)).orderBy(desc(interacoes.id_interacao)).limit(1);
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