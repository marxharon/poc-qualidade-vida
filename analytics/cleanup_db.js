import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Configurações de Variáveis de Ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config(); // Tenta carregar .env local, se existir

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/beqv_db';
const CHROMADB_URL = process.env.CHROMADB_URL || (process.env.USE_LOCAL_SERVICES === 'true' 
    ? 'http://localhost:8000' 
    : 'https://beqv-chroma.onrender.com');

const { Client } = pg;

async function cleanup() {
    console.log('🧹 Iniciando limpeza do banco de dados (PostgreSQL e ChromaDB)...');
    
    // 1. Limpeza PostgreSQL
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        console.log('🐘 Conectado ao PostgreSQL. Removendo dados da simulação...');
        
        // TRUNCATE com CASCADE limpa as tabelas mantendo as dependências íntegras
        // Note que eixos_esg é mantida intacta pois é base de domínio.
        // RESTART IDENTITY garante que as sequences vão voltar para o ID 1
        const query = `
            TRUNCATE TABLE 
                historico_evolucao_esg, 
                interacoes, 
                personas, 
                colaboradores,
                gemeos_organizacionais
            RESTART IDENTITY CASCADE;
        `;
        await client.query(query);
        console.log('   ✅ Dados relacionais do PostgreSQL limpos e IDs resetados com sucesso!');
    } catch (error) {
        console.error('   ❌ Erro ao limpar PostgreSQL:', error.message);
    } finally {
        await client.end();
    }

    // 2. Limpeza ChromaDB
    try {
        console.log('🧠 Conectando ao ChromaDB para remover coleções vetoriais (memória da IA)...');
        const colecoesAlvo = ['personas_base_embeddings', 'memoria_interacoes_embeddings'];
        
        // Busca as coleções existentes primeiro para evitar erros na exclusão e abranger versões
        const res = await axios.get(`${CHROMADB_URL}/api/v1/collections`);
        const collectionsExistentes = res.data || [];

        for (const col of collectionsExistentes) {
            if (colecoesAlvo.includes(col.name)) {
                try {
                    await axios.delete(`${CHROMADB_URL}/api/v1/collections/${col.name}`);
                    console.log(`   ✅ Coleção vetorial '${col.name}' removida com sucesso.`);
                } catch (e) {
                    try {
                        if (col.id) {
                            await axios.delete(`${CHROMADB_URL}/api/v1/collections/${col.id}`);
                            console.log(`   ✅ Coleção vetorial '${col.name}' removida com sucesso (por ID).`);
                        }
                    } catch (err) {
                        console.log(`   ⚠️ Falha ao remover coleção vetorial '${col.name}'.`);
                    }
                }
            }
        }
        console.log('   ✅ Limpeza do banco vetorial ChromaDB concluída!');
    } catch (error) {
        console.warn('   ⚠️ Não foi possível limpar o ChromaDB via API REST. A instância pode já estar vazia ou offline.\n      (Detalhe: ' + error.message + ')');
    }

    console.log('\n🎉 Ambiente limpo e pronto! Você já pode executar o "monte_carlo.js" novamente com o banco de dados zerado.');
}

cleanup();