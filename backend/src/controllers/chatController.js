import axios from 'axios';

export const getDailyQuestion = async (req, res) => {
    res.status(200).json({ 
        question: "Como você está lidando com a sua carga de trabalho esta semana?", 
        options: ["Tranquilo", "Um pouco pesado", "Estou sobrecarregado", "Entediado"] 
    });
};

export const respondToChat = async (req, res) => {
    try {
        const { relato } = req.body;
        // Simulamos o eixo do dia da POC e um ID de persona genérico
        const eixoSorteado = "Saúde mental e emocional";
        
        // Envia para a Inteligência Artificial pensar e salvar a memória
        const iaResponse = await axios.post('http://localhost:3002/api/chat', {
            id_persona: 101, 
            eixoESGSelecionado: eixoSorteado,
            respostaColaboradorNatural: relato
        });

        res.status(200).json({ 
            sugestao_acao: iaResponse.data.data.sugestao_acao, 
            eixo: eixoSorteado, 
            percentual_adesao: Math.floor(Math.random() * 20) + 75 // Predição mockada para a POC
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao consultar a Inteligência Artificial." });
    }
};

export const submitFeedback = async (req, res) => {
    // Gravaria o feedback Boa/Ruim/Indiferente no PostgreSQL
    res.status(200).json({ success: true });
};