import express from 'express';
import { createPersona } from '../controllers/personaController.js';

const router = express.Router();

router.post('/', createPersona);

export default router;