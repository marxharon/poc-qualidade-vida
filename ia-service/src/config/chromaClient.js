import { ChromaClient } from 'chromadb';
import 'dotenv/config';

const chroma = new ChromaClient({
    path: process.env.CHROMADB_URL || "http://localhost:8000"
});

export const initChromaCollections = async () => {
    const personasCollection = await chroma.getOrCreateCollection({
        name: "personas_base_embeddings",
        metadata: { "description": "Memória base do gêmeo digital gerada no onboarding" }
    });

    const interacoesCollection = await chroma.getOrCreateCollection({
        name: "memoria_interacoes_embeddings",
        metadata: { "description": "Memória de interações diárias do colaborador" }
    });

    return { personasCollection, interacoesCollection };
};