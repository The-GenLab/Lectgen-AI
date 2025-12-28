import { Request, Response } from 'express';
import authService from './auth.service';
import adminSettingsService from '../admin/admin-settings.service';
import { isAdmin } from '../../shared/constants';
import passport from '../../core/config/passport';

// Cookie options cho access token
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true, // 
  secure: process.env.NODE_ENV === 'production', 
  sameSite: 'lax' as const, 
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

// Cookie options cho refresh token
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
  path: '/',
};

class AuthController {

  // Kiểm tra email đã tồn tại
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

  //dang ky tai khoan
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

  //dang nhap
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

      // Check maintenance mode - ADMIN can always login
      const settings = await adminSettingsService.getSettings();
      if (settings.maintenanceMode && !isAdmin(user.role)) {
        return res.status(503).json({
          success: false,
          message: 'System is under maintenance. Please try again later.',
          maintenance: true,
        });
      }

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
  //lay thong tin nguoi dung dang nhap
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

  //lam moi token
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

  //dang xuat
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

  //dang xuat tat ca thiet bi
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

  //quen mat khau
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
  //dat lai mat khau
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
//check token dat lai mat khau
  async validateResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }

      const isValid = await authService.validateResetToken(token);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Token validation failed',
      });
    }
  }

  //khoi dong google oauth
  async googleAuth(req: Request, res: Response) {
    // Passport sẽ xử lý redirect đến Google
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res);
  }

  //xu ly callback google oauth
  async googleCallback(req: Request, res: Response) {
    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      try {
        if (err || !user) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        const result = await authService.handleGoogleAuth({
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        });

        // Set tokens in cookies
        res.cookie('accessToken', result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
        res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // Redirect về trang login-success để frontend fetch user data
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login-success`);
      } catch (error: any) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }
    })(req, res);
  }
}

export default new AuthController();
