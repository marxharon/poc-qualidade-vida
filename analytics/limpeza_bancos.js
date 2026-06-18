import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Carrega as variáveis de ambiente a partir do backend (onde fica o DATABASE_URL)
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config(); // Fallback para .env local da pasta analytics, se houver

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://SEU_USUARIO:SUA_SENHA@localhost:5432/beqv_db';
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';

async function main() {
    console.log('🧹 Iniciando limpeza dos bancos de dados (PostgreSQL e ChromaDB)...');

    // 1. Limpeza do PostgreSQL
    console.log('\n🐘 Conectando ao PostgreSQL...');
    const db = new pg.Client({ connectionString: DATABASE_URL });
    
    try {
        await db.connect();
        
        console.log('Apagando registros das tabelas e resetando os IDs (Sequences)...');
        
        // TRUNCATE com CASCADE apaga os dados dessas tabelas mantendo as de domínio (eixos_esg) intactas.
        // RESTART IDENTITY zera os IDs auto-incrementais (sequences) para começarem do 1 novamente.
        await db.query(`
            TRUNCATE TABLE 
                historico_evolucao_esg, 
                gemeos_organizacionais, 
                interacoes, 
                personas, 
                colaboradores 
            RESTART IDENTITY CASCADE;
        `);

        console.log('✅ PostgreSQL limpo com sucesso.');
    } catch (error) {
        console.error('❌ Erro ao limpar PostgreSQL:', error.message);
    } finally {
        await db.end();
    }

    // 2. Limpeza do ChromaDB
    console.log('\n🧠 Conectando ao ChromaDB...');
    try {
        const colecoes = ['personas_base_embeddings', 'memoria_interacoes_embeddings'];
        
        for (const nomeColecao of colecoes) {
            try {
                // Tenta deletar a coleção via API REST do ChromaDB nativo
                await axios.delete(`${CHROMADB_URL}/api/v1/collections/${nomeColecao}`);
                console.log(`   🗑️ Coleção vetorial '${nomeColecao}' apagada com sucesso.`);
            } catch (e) {
                // Erro 404 significa que a coleção já não existia, o que é esperado se já estiver limpa.
                if (e.response && e.response.status === 404) {
                    console.log(`   ℹ️ Coleção vetorial '${nomeColecao}' não encontrada (já estava limpa).`);
                } else {
                    // Ignora erros de "Tenant does not exist" causados por bases completamente virgens
                    console.log(`   ℹ️ Coleção vetorial '${nomeColecao}' ignorada ou inexistente.`);
                }
            }
        }
        console.log('✅ ChromaDB limpo com sucesso.');
    } catch (error) {
        console.error('❌ Erro de conexão com o ChromaDB:', error.message);
    }

    console.log('\n🎉 Limpeza finalizada! O ambiente está totalmente zerado.');
    console.log('👉 Você já pode rodar: node monte_carlo.js');
}

main();