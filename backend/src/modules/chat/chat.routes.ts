import { Router } from 'express';
import chatController from './chat.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { checkQuota } from '../../shared/middleware/quota.middleware';

const router = Router();

// Send message and get AI response (requires auth + quota check)
router.post('/send', authenticate, checkQuota, chatController.sendMessage);

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, chatController.getMessages);

export default router;

