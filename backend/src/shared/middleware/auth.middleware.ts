import { Request, Response, NextFunction } from 'express';
import authService from '../../modules/auth/auth.service';
import adminSettingsService from '../../modules/admin/admin-settings.service';
import User from '../../core/models/User';
import { UserRole, isAdmin } from '../constants';

// Authenticate middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get access token from cookie first, then fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const user = await authService.getUserFromToken(token);
    req.user = user;

    // Check maintenance mode - ADMIN can always access
    const settings = await adminSettingsService.getSettings();
    if (settings.maintenanceMode && !isAdmin(user.role)) {
      return res.status(503).json({
        success: false,
        message: 'System is under maintenance. Please try again later.',
        maintenance: true,
      });
    }

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token',
    });
  }
};

// Check user role
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize(UserRole.ADMIN);

// VIP or Admin middleware
export const vipOrAdmin = authorize(UserRole.VIP, UserRole.ADMIN);
