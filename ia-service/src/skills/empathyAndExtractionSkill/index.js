import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPrompt } from '../../utils/promptLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const empathyAndExtraction = async (contexto) => {
    try {
        const promptPath = path.join(__dirname, 'prompt.md');
        
        // Injeta os dados da Persona utilizando o utilitário
        const promptContent = loadPrompt(promptPath, {
            nome_preferido: contexto.nome_preferido || 'Colaborador',
            personalidade: contexto.personalidade || 'Indefinida',
            gostos_desgostos: contexto.gostos_desgostos || 'Indefinido',
            mensagem: contexto.mensagem || ''
        });

        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Chave OPENAI_API_KEY não encontrada no ambiente.");
        }

        // Definição do JSON Schema Estrito para o gpt-4o-mini
        const jsonSchema = {
            name: "empathy_and_extraction_schema",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    resposta_chat: {
                        type: "string",
                        description: "Resposta acolhedora ou conselho. NUNCA DEVE TER PONTO DE INTERROGAÇÃO."
                    },
                    modo_escuta: {
                        type: "string",
                        enum: ["ESCUTA_ATIVA", "DIRECIONAMENTO"],
                        description: "Modo de interação. Escuta ativa apenas acolhe, Direcionamento propõe sugestão."
                    },
                    eixo_identificado: {
                        type: "string",
                        enum: [
                            "Saúde física",
                            "Saúde mental e emocional",
                            "Clima organizacional e engajamento",
                            "Equilíbrio entre vida pessoal e profissional",
                            "Segurança e saúde ocupacional",
                            "Diversidade, equidade e inclusão",
                            "Desenvolvimento e crescimento profissional",
                            "Reconhecimento e recompensas",
                            "Qualidade das relações interpessoais",
                            "Segurança psicológica e cultura de escuta"
                        ],
                        description: "O eixo de acompanhamento ESG mais aderente à mensagem."
                    },
                    sugestao_final: {
                        type: "string",
                        description: "Ação prática sugerida de forma humana e fluida. Nunca use jargões de sistema. Se for ESCUTA_ATIVA, ofereça um desfecho acolhedor e natural."
                    },
                    percentual_adesao: {
                        type: "integer",
                        description: "Número inteiro de 0 a 100 indicando o nível de saúde neste eixo."
                    },
                    topico_esgotado: {
                        type: "boolean",
                        description: "True se o colaborador parece ter finalizado seu raciocínio, False se for um desabafo isolado."
                    },
                    solicitar_avaliacao: {
                        type: "boolean",
                        description: "True se a sugestão for uma ação clara que requeira feedback do colaborador."
                    }
                },
                required: ["resposta_chat", "modo_escuta", "eixo_identificado", "sugestao_final", "percentual_adesao", "topico_esgotado", "solicitar_avaliacao"],
                additionalProperties: false
            }
        };

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: promptContent }],
            response_format: { type: 'json_schema', json_schema: jsonSchema },
            temperature: 0.5
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 20000 // Maior tempo dado o raciocínio complexo de extração
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error(`[Empathy & Extraction] Falha ao processar empatia:`, error.message);
        throw error;
    }
};