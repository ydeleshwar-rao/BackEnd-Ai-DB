import { Router } from 'express';
import { aiController } from './ai.controller';

const router = Router();

// Health check
router.get('/status', aiController.status);

// Chat endpoints
router.post('/chat', aiController.chat);
router.post('/chat/followup', aiController.chatFollowUp);

// History management
router.get('/history/:sessionId', aiController.getHistory);
router.get('/history/:sessionId/export', aiController.exportHistory);
router.delete('/history/:sessionId', aiController.clearHistory);

// Admin endpoint
router.post('/clear-caches', aiController.clearCaches);

export default router;