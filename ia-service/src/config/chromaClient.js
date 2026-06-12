import { ChromaClient } from 'chromadb';
import 'dotenv/config';

const CHROMADB_URL = process.env.CHROMADB_URL || (process.env.USE_LOCAL_SERVICES === 'true'
    ? 'http://localhost:8000'
    : 'https://beqv-chroma.onrender.com');


const chroma = new ChromaClient({
    path: CHROMADB_URL
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