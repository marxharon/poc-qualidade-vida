import { Router } from 'express';
import { getDailyQuestion, respondToChat, submitFeedback } from '../controllers/chatController.js';

const router = Router();

router.get('/daily-question', getDailyQuestion);
router.post('/respond', respondToChat);
router.post('/feedback', submitFeedback);

export default router;