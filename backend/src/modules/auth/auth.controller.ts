import { Request, Response } from 'express';
import authService from './auth.service';
import { send } from 'process';
import { userService } from '../user';
import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';

// Cookie options for JWT token
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

class AuthController {
  //hàm checkEmail dùng để kiểm tra email đã tồn tại trong hệ thống hay chưa
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

  // hàm register dùng để đăng ký tài khoản mới và trả về token đăng nhập ngay sau khi đăng ký
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { user, token } = await authService.register({ email, password });

      // Set token in HTTP-only cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            slidesGenerated: user.slidesGenerated,
            maxSlidesPerMonth: user.maxSlidesPerMonth,
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

  // hàm login dùng để xác thực email + password, nếu đúng thì cho đăng nhập và trả về token
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { user, token } = await authService.login({ email, password });

      // Set token in HTTP-only cookie
      res.cookie('token', token, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            slidesGenerated: user.slidesGenerated,
            maxSlidesPerMonth: user.maxSlidesPerMonth,
          },
        },
        token: token
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  // hàm me dùng để check xem request hiện tại có user đăng nhập hợp lệ hay không và trả thông tin user đó
  async me(req: Request, res: Response) {
    try {
      const user = req.user as User | undefined;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            slidesGenerated: user.slidesGenerated,
            maxSlidesPerMonth: user.maxSlidesPerMonth,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            createdAt: user.createdAt,
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

  // hàm refreshToken dùng để làm mới token khi token cũ sắp hết hạn hoặc đã hết hạn
  async refreshToken(req: Request, res: Response) {
    try {
      // Get token from cookie first, then fallback to Authorization header
      const oldToken = req.cookies?.token ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.substring(7)
          : null);

      if (!oldToken) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const newToken = await authService.refreshToken(oldToken);

      // Set new token in cookie
      res.cookie('token', newToken, COOKIE_OPTIONS);

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

  // hàm logout dùng để kết thúc phiên đăng nhập – xóa cookie token
  async logout(req: Request, res: Response) {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  // hàm forgotPassword dùng để gửi email reset password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Generate reset token and send email
      const tokenReset = await authService.forgotPassword(email);
      const resetLink = `http://localhost:5173/reset-password?token=${tokenReset}`;
      await authService.sendEmailService(email, resetLink);

      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error: any) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  }

  // hàm validateResetToken dùng để kiểm tra token reset còn hợp lệ không
  async validateResetToken(req: Request, res: Response) {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }

      const result = await authService.validateResetToken(token);

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
    }
  }

  // hàm resetPassword dùng để đặt lại mật khẩu với token
  async resetPassword(req: Request, res: Response) {
    try {
      const { newPassword } = req.body;
      const {token} = req.query as { token: string };

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required',
        });
      }

      if (newPassword.length < 12) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 12 characters',
        });
      }

      await authService.resetPassword(token, newPassword);

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Password reset failed',
      });
    }
  }
   async googleCallback(req: Request, res: Response) {
    try {
      // Lay user tu req do passport cung cap
      const userGoogle = req.user;
      if (!userGoogle) {
        throw new Error('Google authentication failed');
      }
      const userAndTokenResult = await authService.loginOrSignupGoogle(userGoogle);

      // tra ve token trong cookie
      res.cookie('token', userAndTokenResult.token, COOKIE_OPTIONS);

      // chuyen huong ve frontend sau khi dang nhap thanh cong
      return res.redirect(`${process.env.FRONTEND_URL}/login?google_auth=success`);
    } catch (error) {
      // Redirect to frontend with error indication
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
}
}

export default new AuthController();
