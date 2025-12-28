import { Router } from 'express';
import chatController from './chat.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { checkQuota } from '../../shared/middleware/quota.middleware';
import { checkInputMethods } from '../../shared/middleware/input-methods.middleware';

const router = Router();

// Send message and get AI response (requires auth + input methods check + quota check)
router.post('/send', authenticate, checkInputMethods, checkQuota, chatController.sendMessage);

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, chatController.getMessages);

export default router;

