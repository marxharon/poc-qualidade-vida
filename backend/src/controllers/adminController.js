import { runAnalystGrouping } from '../services/analystAiService.js';

export const triggerAnalystMotor = async (req, res) => {
    try {
        const result = await runAnalystGrouping();
        res.status(200).json({ 
            message: "Motor Analista IA de BEQV executado com sucesso!", 
            detalhes: result 
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao executar o Motor de Agrupamento IA", details: error.message });
    }
};