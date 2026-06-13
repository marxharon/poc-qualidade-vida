import express from 'express';
import { 
    getDailyQuestion, 
    respondToChat, 
    submitFeedback,
    analyzeSuggestion, // <-- Nova importação
    getPerception      // <-- Nova importação
} from '../controllers/chatController.js';

const router = express.Router();

// Rotas existentes
router.get('/daily-question', getDailyQuestion);
router.post('/respond', respondToChat);
router.post('/feedback', submitFeedback);

// NOVAS ROTAS ADICIONADAS
// GET /chat/analyze-suggestion
router.get('/analyze-suggestion', analyzeSuggestion);

// GET /chat/perception
router.get('/perception', getPerception);

export default router;