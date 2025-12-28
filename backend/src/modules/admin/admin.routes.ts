import { Router } from 'express';
import multer from 'multer';
import adminController from './admin.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { UserRole } from '../../shared/constants';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/admin/stats
router.get('/stats', adminController.getGlobalStats);

// POST /api/admin/users (Create new user)
router.post('/users', adminController.createUser);
// GET /api/admin/users 
router.get('/users', adminController.getAllUsers);
// GET /api/admin/users/:userId/stats
router.get('/users/:userId/stats', adminController.getUserStats);
// GET /api/admin/usage-logs 
router.get('/usage-logs', adminController.getUsageLogs);
// PATCH /api/admin/users/:userId/quota
router.patch('/users/:userId/quota', adminController.updateUserQuota);
// PATCH /api/admin/users/:userId/role
router.patch('/users/:userId/role', adminController.updateUserRole);
// POST /api/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', adminController.resetUserPassword);
// POST /api/admin/users/:userId/avatar
router.post('/users/:userId/avatar', upload.single('avatar'), adminController.uploadUserAvatar);

// GET /api/admin/billing
router.get('/billing', adminController.getBillingStats);
// GET /api/admin/billing/trend
router.get('/billing/trend', adminController.getRevenueTrend);

// GET /api/admin/settings
router.get('/settings', adminController.getSettings);
// PATCH /api/admin/settings
router.patch('/settings', adminController.updateSettings);

export default router;
