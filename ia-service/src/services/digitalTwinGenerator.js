import { ChatOpenAI } from "@langchain/openai";
import { initChromaCollections } from "../config/chromaClient.js";
import 'dotenv/config';

const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
});

export const generateInitialDigitalTwin = async (id_persona_arg, respostasOnboarding_arg) => {
    try {
        const id_persona = typeof id_persona_arg === 'object' ? id_persona_arg.id_persona : id_persona_arg;
        const respostas = respostasOnboarding_arg || (typeof id_persona_arg === 'object' ? id_persona_arg.respostasOnboarding : {}) || {};

        const prompt = `Você é um Analista de Bem-estar Organizacional corporativo.
        Analise as respostas de onboarding do colaborador e crie um resumo do perfil do seu Gêmeo Digital:
        1. Nome preferido: ${respostas.nome_preferido || "Colaborador"}
        2. Personalidade: ${respostas.personalidade || "Não informado"}
        3. Gostos: ${respostas.gostos || "Não informado"}
        4. Desgostos: ${respostas.desgostos || "Não informado"}
        5. Relação na equipe: ${respostas.relacao_equipe || "Não informado"}
        6. Sentimento no trabalho: ${respostas.sentimento_trabalho || "Não informado"}
        7. Motivações: ${respostas.motivacoes || "Não informado"}
        8. Skills: ${respostas.hardskills_softskills || "Não informado"}

        Resuma a essência desse Gêmeo Digital em 1 parágrafo. 
        INSTRUÇÕES CRÍTICAS:
        - Você DEVE iniciar o resumo com o Nome preferido do colaborador citado acima.
        - É ESTRITAMENTE PROIBIDO inventar nomes, problemas ou características que não estão na lista.
        - NUNCA dê diagnósticos clínicos, foque no bem-estar corporativo e na saúde ocupacional (ESG).`;

        const resumo = await llm.invoke(prompt);
        const { personasCollection } = await initChromaCollections();
        
        await personasCollection.upsert({
            ids: [id_persona.toString()],
            documents: [String(resumo.content)],
            metadatas: [{ id_persona }]
        });
        return resumo.content;
    } catch (error) {
        console.error("Erro ao gerar Gêmeo Digital inicial:", error);
        // Propaga o erro para que o serviço chamador (backend) possa tratá-lo adequadamente.
        // Isso evita que a aplicação quebre silenciosamente.
        throw new Error(`Falha na geração do Gêmeo Digital no ia-service: ${error.message}`);
    }
};