import { Router } from 'express';
import authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();




router.post('/check-email', authController.checkEmail);


router.post('/register', authController.register); 

router.post('/login', authController.login);


router.post('/forgot-password', authController.forgotPassword);

router.post('/validate-reset-token', authController.validateResetToken);

router.post('/reset-password', authController.resetPassword);

router.post('/refresh-token', authController.refreshToken);


router.get('/google', authController.googleAuth);


router.get('/google/callback', authController.googleCallback);


router.get('/me', authenticate, authController.me);


router.post('/logout', authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
