import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const routeIntention = async ({ mensagem }) => {
    try {
        // 1. Carrega o prompt externo e injeta os dados do usuário
        const promptPath = path.join(__dirname, 'prompt.md');
        let promptContent = fs.readFileSync(promptPath, 'utf8');
        
        promptContent = promptContent.replace('{{mensagem}}', mensagem || '');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Chave OPENAI_API_KEY não encontrada no ambiente.");
        }

        // 2. Aciona o LLM com foco em velocidade (gpt-3.5-turbo) e determinismo (temperature 0.1)
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: promptContent }],
            response_format: { type: 'json_object' },
            temperature: 0.1 // O mais próximo de 0 para classificação determinística
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 10000 // Timeout muito baixo (10s), pois roteamento precisa ser rápido
        });

        const parsedData = JSON.parse(response.data.choices[0].message.content);
        
        console.log(`[Router Intention] Intenção detectada: ${parsedData.intencao} (${parsedData.confianca}%)`);
        return parsedData;

    } catch (error) {
        console.error(`[Router Intention] Falha ao processar a intenção:`, error.message);
        throw error; // Lança o erro para o orquestrador acionar o Fallback de Regex
    }
};