import { Request, Response } from 'express';
import authService from './auth.service';

class AuthController {
  // Register new user
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
          token,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  // Login user
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
          token,
        },
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  // Get current user
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

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const oldToken = authHeader.substring(7);
      const newToken = await authService.refreshToken(oldToken);

      return res.status(200).json({
        success: true,
        data: { token: newToken },
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  // Logout (client-side token removal, optional backend tracking)
  async logout(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export default new AuthController();
