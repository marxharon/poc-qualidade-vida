import fs from 'fs';

/**
 * Lê um arquivo de prompt e injeta as variáveis de contexto dinâmicas.
 * 
 * @param {string} absoluteFilePath - Caminho absoluto do arquivo a ser lido.
 * @param {Object} variables - Objeto com as chaves a serem substituídas (ex: { nome: 'João' }).
 * @returns {string} O prompt final pronto para ser enviado ao LLM.
 */
export function loadPrompt(absoluteFilePath, variables = {}) {
  try {
    let promptContent = fs.readFileSync(absoluteFilePath, 'utf8');

    // Substitui TODAS as ocorrências de {{chave}} pelo valor em string correspondente
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      promptContent = promptContent.replace(regex, String(value));
    }

    return promptContent;
  } catch (error) {
    console.error(`[promptLoader] Erro ao carregar o arquivo de prompt em: ${absoluteFilePath}`, error.message);
    throw error;
  }
}