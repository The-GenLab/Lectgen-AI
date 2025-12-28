import { Router } from 'express';
import userController from './user.controller';
import { authenticate, adminOnly } from '../../shared/middleware/auth.middleware';

const router = Router();

// User routes (authenticated)
router.get('/profile', authenticate, userController.getProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.post('/upgrade', authenticate, userController.upgradeToVIP);

// Admin routes
router.get('/', authenticate, adminOnly, userController.getAllUsers);
router.get('/search', authenticate, adminOnly, userController.searchUsers);
router.get('/statistics', authenticate, adminOnly, userController.getStatistics);
router.get('/:id', authenticate, adminOnly, userController.getUserById);
router.patch('/:id', authenticate, adminOnly, userController.updateUser);
router.delete('/:id', authenticate, adminOnly, userController.deleteUser);

export default router;
