import { Router } from 'express';
import adminController from './admin.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { UserRole } from '../../shared/constants';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/admin/stats - Get global system statistics
router.get('/stats', adminController.getGlobalStats);

// GET /api/admin/users - Get all users with their quotas and stats
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId/stats - Get detailed stats for a specific user
router.get('/users/:userId/stats', adminController.getUserStats);

// GET /api/admin/usage-logs - Get usage logs with filters
router.get('/usage-logs', adminController.getUsageLogs);

// PATCH /api/admin/users/:userId/quota - Update user quota
router.patch('/users/:userId/quota', adminController.updateUserQuota);

// PATCH /api/admin/users/:userId/role - Update user role
router.patch('/users/:userId/role', adminController.updateUserRole);

export default router;
