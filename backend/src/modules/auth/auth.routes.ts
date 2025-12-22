import { Router } from 'express';
import authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import passport from '../../core/config/google';
const router = Router();

// Public routes(cong khai)
router.post('/check-email', authController.checkEmail);
router.post('/register', authController.register); 
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

// Protected routes(bi mat)
router.get('/me', authenticate, authController.me);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
// router chuyen huong ve google oauth
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);
//router tra ve ket qua sau khi google xac thuc thanh cong
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        //trang loi khi dang nhap khong thanh cong
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    authController.googleCallback
);
export default router;
