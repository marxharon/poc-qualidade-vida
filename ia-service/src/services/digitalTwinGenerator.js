import { ChatOpenAI } from "@langchain/openai";
import { initChromaCollections } from "../config/chromaClient.js";
import 'dotenv/config';

const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
});

export const generateInitialDigitalTwin = async (id_persona, respostasOnboarding) => {
    const prompt = `Você é um Analista de Bem-estar Organizacional corporativo.
    Analise as respostas de onboarding do colaborador e crie um resumo do perfil do seu Gêmeo Digital:
    1. Prefere ser chamado de: ${respostasOnboarding.nome_preferido}
    2. Personalidade: ${respostasOnboarding.personalidade}
    3. Gostos: ${respostasOnboarding.gostos}
    4. Desgostos: ${respostasOnboarding.desgostos}
    5. Relação na equipe: ${respostasOnboarding.relacao_equipe}
    6. Sentimento no trabalho: ${respostasOnboarding.sentimento_trabalho}
    7. Motivações: ${respostasOnboarding.motivacoes}
    8. Skills: ${respostasOnboarding.hardskills_softskills}

    Resuma a essência desse Gêmeo Digital. Lembre-se do artigo: NUNCA dê diagnósticos clínicos, foque no bem-estar corporativo e na saúde ocupacional (ESG).`;

    const resumo = await llm.invoke(prompt);
    const { personasCollection } = await initChromaCollections();
    
    await personasCollection.upsert({
        ids: [id_persona.toString()],
        documents: [String(resumo.content)],
        metadatas: [{ id_persona }]
    });
    return resumo.content;
};