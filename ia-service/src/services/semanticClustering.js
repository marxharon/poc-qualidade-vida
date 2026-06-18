import axios from 'axios';
import { initChromaCollections } from '../config/chromaClient.js';
import { kmeans } from 'ml-kmeans';
import 'dotenv/config';

export const discoverOrganicClusters = async (data_inicio, data_fim) => {
    console.log(`[IA Motor Preditivo] Iniciando Semantic Clustering no período ${data_inicio} a ${data_fim}...`);
    
    try {
        const collections = await initChromaCollections();
        if (!collections?.interacoesCollection) throw new Error("ChromaDB não inicializado.");

        // 1. Busca todos os vetores de Gêmeos Digitais no ChromaDB
        const interacoes = await collections.interacoesCollection.get({
            include: ['embeddings', 'documents']
        });

        if (!interacoes.embeddings || interacoes.embeddings.length === 0) {
             return [];
        }

        // 2. Roda a função matemática de K-Means para agrupar vetores espacialmente similares
        const data = interacoes.embeddings;
        const k = Math.min(3, data.length); // Limita a 3 clusters distintos para a POC
        const ans = kmeans(data, k, { initialization: 'kmeans++' });
        
        // Agrupa os documentos (relatos textuais) por cluster para o LLM ler
        const clustersTexts = Array.from({ length: k }, () => []);
        ans.clusters.forEach((clusterIndex, dataIndex) => {
             clustersTexts[clusterIndex].push(interacoes.documents[dataIndex]);
        });

        const clustersDescobertosIA = [];

        // 3. O LLM analisa os relatos do cluster matemático e o batiza
        for (let i = 0; i < k; i++) {
             const amostraTextos = clustersTexts[i].slice(-15).join(" | "); 
             
             const promptClustering = `
             Atue como o Analista IA de Bem-Estar. 
             Analise estes relatos anonimizados de um grupo de colaboradores que a matemática vetorial agrupou por similaridade de sentimento:
             "${amostraTextos}"
             
             Sintetize a dor ou motivação deste grupo em UM Gêmeo Organizacional.
             Retorne APENAS um JSON:
             - "nome_categoria": Nome criativo e específico para o cluster (ex: "Desenvolvedores em Isolamento Remoto").
             - "descricao_perfil": Descrição do perfil comportamental deste grupo.
             - "id_eixo_predominante": ID numérico (1 a 10) do eixo ESG que mais se destaca.
             - "sugestao_estrategica": Predição de risco e ação preventiva em 2 frases.
             - "pontuacao_agregada": Nota de 0 a 100 avaliando a saúde geral deste grupo baseada nos relatos.
             `;
             
             const iaClusterRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                 model: 'gpt-3.5-turbo',
                 messages: [{ role: 'user', content: promptClustering }],
                 response_format: { type: "json_object" },
                 temperature: 0.7
             }, { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } });
             
             const clusterData = JSON.parse(iaClusterRes.data.choices[0].message.content);
             
             clustersDescobertosIA.push(clusterData);
        }

        return clustersDescobertosIA;

    } catch (error) {
        console.error("Erro na clusterização dinâmica:", error);
        return [];
    }
};