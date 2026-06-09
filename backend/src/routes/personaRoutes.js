import express from 'express';
import { createPersona, getPersonaHistory, getPersonas } from '../controllers/personaController.js';

const router = express.Router();

router.get('/', getPersonas);
router.post('/', createPersona);
router.get('/:id/history', getPersonaHistory);

export default router;