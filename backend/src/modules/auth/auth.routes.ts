import { Router } from 'express';
import authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// ==================== PUBLIC ROUTES ====================
// Các route không cần authentication

// Kiểm tra email đã tồn tại chưa
router.post('/check-email', authController.checkEmail);

// Đăng ký tài khoản mới
router.post('/register', authController.register); 

// Đăng nhập bằng email/password
router.post('/login', authController.login);

// Quên mật khẩu - Gửi email reset password
router.post('/forgot-password', authController.forgotPassword);

// Reset password với token
router.post('/reset-password', authController.resetPassword);

// Refresh access token bằng refresh token
router.post('/refresh-token', authController.refreshToken);

// ==================== GOOGLE OAUTH ROUTES ====================
// Khởi tạo Google OAuth flow
router.get('/google', authController.googleAuth);

// Google OAuth callback
router.get('/google/callback', authController.googleCallback);

// ==================== PROTECTED ROUTES ====================
// Các route cần authentication (JWT token)

// Lấy thông tin user hiện tại
router.get('/me', authenticate, authController.me);

// Đăng xuất (xóa refresh token)
router.post('/logout', authController.logout);

// Đăng xuất tất cả thiết bị
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
