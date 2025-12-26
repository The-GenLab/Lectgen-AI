import { Router } from 'express';
import authController from './auth.controller';
import authService from './auth.service';
import { authenticate, verifyCsrfToken } from '../../shared/middleware';
import passport from '../../core/config/google';

const router = Router();

// Routes công khai
router.post('/check-email', authController.checkEmail);
router.post('/register', authController.register); 
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

// Routes bảo mật
router.get('/me', authenticate, authController.me);

// Làm mới token - KHÔNG cần CSRF (đã được bảo vệ bởi httpOnly cookie)
router.post('/refresh', authController.refreshToken);

// Đăng xuất - yêu cầu CSRF
router.post('/logout', verifyCsrfToken, authController.logout);

// Google OAuth - với state parameter để bảo vệ CSRF
router.get('/google', async (req, res, next) => {
    try {
        // Tạo OAuth state parameter
        const state = await authService.generateOAuthState();
        
        // Truyền state cho passport
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false,
            state, // Bao gồm state parameter
        })(req, res, next);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to initiate Google OAuth',
        });
    }
});

// Google OAuth callback - xác thực state parameter
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    }),
    authController.googleCallback
);

export default router;
