import { ChatOpenAI } from "@langchain/openai";
import { initChromaCollections } from "../config/chromaClient.js";
import 'dotenv/config';

const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `Você é um mentor virtual focado em Qualidade de Vida no Trabalho (ESG). 
Comunique-se de forma empática e acolhedora. 
DIRETRIZ ESTRITA: NUNCA forneça diagnósticos médicos, terapêuticos ou clínicos. 
Sempre ofereça uma sugestão de melhoria e 4 opções de respostas curtas para o usuário escolher.`;

export const dailyInteraction = async (id_persona, eixoESGSelecionado, respostaColaboradorNatural) => {
    const prompt = `${systemPrompt}
    Eixo ESG de hoje: "${eixoESGSelecionado}".
    O colaborador relatou: "${respostaColaboradorNatural}".
    Retorne estritamente um JSON com a estrutura: {"sentimento_identificado": "...", "sugestao_acao": "...", "opcoes_respostas_curtas": ["op1", "op2", "op3", "op4"]}`;

    const resultadoJSON = await llm.invoke(prompt);
    const { interacoesCollection } = await initChromaCollections();

    await interacoesCollection.add({
        ids: [`interacao_${id_persona}_${Date.now()}`],
        documents: [`Eixo: ${eixoESGSelecionado} | Relato: ${respostaColaboradorNatural} | Mentor: ${resultadoJSON.content}`],
        metadatas: [{ id_persona, data_interacao: new Date().toISOString(), eixo: eixoESGSelecionado }]
    });

    return resultadoJSON.content;
};