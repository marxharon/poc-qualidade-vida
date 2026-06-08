import express from 'express';
import { triggerAnalystMotor } from '../controllers/adminController.js';

const router = express.Router();

// Rota GET para facilitar os testes direto pelo navegador
router.get('/run-analyst', triggerAnalystMotor);

export default router;