import { Router } from 'express';
import conversationController from './conversation.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', conversationController.create);
router.get('/', conversationController.getAll);
router.get('/:id', conversationController.getById);
router.patch('/:id', conversationController.update);
router.delete('/:id', conversationController.delete);

export default router;
