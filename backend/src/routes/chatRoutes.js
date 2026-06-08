import express from 'express';
import { getDailyQuestion, respondToChat, submitFeedback } from '../controllers/chatController.js';

const router = express.Router();

router.get('/daily', getDailyQuestion);
router.post('/respond', respondToChat);
router.post('/feedback', submitFeedback);

export default router;