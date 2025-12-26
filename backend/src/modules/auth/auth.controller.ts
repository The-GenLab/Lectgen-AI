import { Request, Response } from 'express';
import authService from './auth.service';
import { userService } from '../user';
import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { generateCsrfToken, clearCsrfToken } from '../../shared/middleware';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  });
};

const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  slidesGenerated: user.slidesGenerated,
  maxSlidesPerMonth: user.maxSlidesPerMonth,
  subscriptionExpiresAt: user.subscriptionExpiresAt,
  createdAt: user.createdAt,
});

class AuthController {
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

  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || null;

      const { user, accessToken, refreshToken } = await authService.register(
        { email, password },
        userAgent,
        ip
      );

      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);

      // Generate CSRF token
      const csrfToken = generateCsrfToken(res);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: sanitizeUser(user),
          accessToken, // Return access token in response body
        },
        csrfToken, // Return CSRF token for frontend to store
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || null;

      const { user, accessToken, refreshToken } = await authService.login(
        { email, password },
        userAgent,
        ip
      );

      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);

      // Generate CSRF token
      const csrfToken = generateCsrfToken(res);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: sanitizeUser(user),
          accessToken, // Return access token in response body
        },
        csrfToken, // Return CSRF token for frontend to store
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

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
          user: sanitizeUser(user),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user',
      });
    }
  }

  // Refresh with token rotation
  async refreshToken(req: Request, res: Response) {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'No refresh token provided',
        });
      }

      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || null;

      // Rotate refresh token and get new access token
      const { accessToken, refreshToken: newRefreshToken } = 
        await authService.refreshAccessToken(refreshToken, userAgent, ip);

      // Set new refresh token in cookie
      setRefreshTokenCookie(res, newRefreshToken);

      // Rotate CSRF token as well
      const csrfToken = generateCsrfToken(res);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken, // Return new access token in response body
        },
        csrfToken, // Return new CSRF token
      });
    } catch (error: any) {
      // Clear cookies on error
      clearRefreshTokenCookie(res);
      clearCsrfToken(res);
      
      return res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  // Logout - no authentication required
  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      // Revoke refresh token if exists
      if (refreshToken) {
        try {
          await authService.revokeRefreshToken(refreshToken);
        } catch (error) {
          // Continue even if revocation fails
          console.error('Error revoking refresh token:', error);
        }
      }

      // Clear cookies
      clearRefreshTokenCookie(res);
      clearCsrfToken(res);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      // Always clear cookies even on error
      clearRefreshTokenCookie(res);
      clearCsrfToken(res);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  }

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
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${tokenReset}`;
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

      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || null;

      const { user, accessToken, refreshToken } = await authService.loginOrSignupGoogle(
        userGoogle,
        userAgent,
        ip
      );

      // Set refresh token in HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);

      // Generate CSRF token
      generateCsrfToken(res);

      // Redirect to frontend with success flag
      // Access token will be retrieved via /auth/me call from frontend
      return res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?success=true`);
    } catch (error) {
      // Clear cookies on error
      clearRefreshTokenCookie(res);
      clearCsrfToken(res);

      // Redirect to frontend with error indication
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
}
}

export default new AuthController();
