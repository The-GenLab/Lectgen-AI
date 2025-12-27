import { Request, Response } from 'express';
import authService from './auth.service';
import passport from '../../core/config/passport';

// Cookie options cho access token
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

// Cookie options cho refresh token
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

class AuthController {
  /**
   * Kiểm tra email đã tồn tại trong hệ thống hay chưa
   * POST /api/auth/check-email
   */
  async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const exists = await authService.checkEmailExists(email);

      return res.status(200).json({
        success: true,
        data: { exists },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Check email failed',
      });
    }
  }

  /**
   * Đăng ký tài khoản mới
   * POST /api/auth/register
   * Body: { email, password }
   * - Password tối thiểu 8 ký tự
   * - Tự động đăng nhập sau khi đăng ký
   * - Trả về access token và refresh token trong cookie
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { user, accessToken, refreshToken } = await authService.register({ email, password });

      // Set tokens in HTTP-only cookies
      res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            slidesGenerated: user.slidesGenerated,
            maxSlidesPerMonth: user.maxSlidesPerMonth,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  /**
   * Đăng nhập
   * POST /api/auth/login
   * Body: { email, password }
   * - Xác thực email + password
   * - Trả về access token và refresh token trong cookie
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { user, accessToken, refreshToken } = await authService.login({ email, password });

      // Set tokens in HTTP-only cookies
      res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            slidesGenerated: user.slidesGenerated,
            maxSlidesPerMonth: user.maxSlidesPerMonth,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * Lấy thông tin user hiện tại (protected route)
   * GET /api/auth/me
   * Requires: JWT token trong cookie hoặc Authorization header
   */
  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            avatarUrl: req.user.avatarUrl,
            role: req.user.role,
            slidesGenerated: req.user.slidesGenerated,
            maxSlidesPerMonth: req.user.maxSlidesPerMonth,
            subscriptionExpiresAt: req.user.subscriptionExpiresAt,
            createdAt: req.user.createdAt,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user',
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   * - Sử dụng refresh token trong cookie để tạo access token mới
   * - Cả access token và refresh token đều được làm mới
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const oldRefreshToken = req.cookies?.refreshToken;

      if (!oldRefreshToken) {
        return res.status(401).json({
          success: false,
          message: 'No refresh token provided',
        });
      }

      const { accessToken, refreshToken } = await authService.refreshAccessToken(oldRefreshToken);

      // Set new tokens in cookies
      res.cookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * Đăng xuất
   * POST /api/auth/logout
   * - Xóa refresh token khỏi database
   * - Xóa cookies
   */
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        // Xóa session khỏi database
        await authService.logout(refreshToken);
      }

      // Clear cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Logout failed',
      });
    }
  }

  /**
   * Đăng xuất tất cả thiết bị
   * POST /api/auth/logout-all
   * Requires: JWT token (authenticated user)
   */
  async logoutAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Xóa tất cả sessions của user
      await authService.logoutAll(req.user.id);

      // Clear cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Logout all failed',
      });
    }
  }

  /**
   * Quên mật khẩu - Gửi email reset password
   * POST /api/auth/forgot-password
   * Body: { email }
   * - Tạo reset token (10 phút)
   * - Gửi email với link reset password
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      await authService.forgotPassword(email);

      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error: any) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  }

  /**
   * Reset password với token
   * POST /api/auth/reset-password
   * Body: { token, newPassword }
   * - Token từ URL query được gửi qua email
   * - Password tối thiểu 8 ký tự
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }

      await authService.resetPassword(token, newPassword);

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed',
      });
    }
  }

  /**
   * Google OAuth - Khởi tạo authentication
   * GET /api/auth/google
   * - Redirect user đến Google consent screen
   */
  async googleAuth(req: Request, res: Response) {
    // Passport sẽ xử lý redirect đến Google
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res);
  }

  /**
   * Google OAuth Callback
   * GET /api/auth/google/callback
   * - Google redirect về đây sau khi user authorize
   * - Tạo hoặc update user
   * - Tạo tokens và redirect về frontend
   */
  async googleCallback(req: Request, res: Response) {
    passport.authenticate('google', { session: false }, async (err, user) => {
      try {
        if (err || !user) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }

        // Xử lý Google OAuth (tạo user hoặc login)
        const result = await authService.handleGoogleAuth({
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        });

        // Set tokens in cookies
        res.cookie('accessToken', result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
        res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // Redirect về frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/dashboard`);
      } catch (error: any) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }
    })(req, res);
  }
}

export default new AuthController();
