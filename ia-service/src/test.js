import { generateInitialDigitalTwin } from './services/digitalTwinGenerator.js';
import { dailyInteraction } from './services/conversationalMentor.js';

async function runTests() {
    console.log("=== INICIANDO TESTES DO SERVIÇO DE IA E CHROMADB ===\n");
    try {
        console.log("1. Testando Geração do Gêmeo Digital (Onboarding)...");
        const respostasMock = {
            nome_preferido: "Ana",
            personalidade: "Criativa e comunicativa",
            gostos: "Brainstormings, solucionar problemas",
            desgostos: "Tarefas muito repetitivas e burocracia",
            relacao_equipe: "Excelente, adoro colaborar",
            sentimento_trabalho: "Animada, mas com leve receio dos prazos curtos",
            motivacoes: "Impactar a sociedade com tecnologia",
            hardskills_softskills: "Design UX, facilidade em falar em público"
        };
        
        const resumo = await generateInitialDigitalTwin(101, respostasMock);
        console.log("-> Resumo do Gêmeo gerado no ChromaDB:\n", resumo, "\n");

        console.log("2. Testando Interação Diária (Mentor Conversacional)...");
        const interacao = await dailyInteraction(
            101, 
            "Saúde mental e emocional", 
            "Estou me sentindo um pouco ansiosa hoje com a entrega do projeto na sexta."
        );
        console.log("-> Resposta JSON estruturada do Mentor:\n", interacao);
    } catch (error) {
        console.error("ERRO nos testes. Verifique se o ChromaDB está rodando e a chave OpenAI é válida.", error);
    }
}
runTests();