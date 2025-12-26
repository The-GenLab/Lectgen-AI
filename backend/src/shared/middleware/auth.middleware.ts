import { Request, Response, NextFunction } from 'express';
import authService from '../../modules/auth/auth.service';
import User from '../../core/models/User';
import { UserRole } from '../constants';

// Mở rộng kiểu Express Request để bao gồm user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware xác thực - kiểm tra access token từ Authorization header
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy access token chỉ từ Authorization header (KHÔNG lấy từ cookies)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No access token provided',
      });
    }

    const accessToken = authHeader.substring(7);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'No access token provided',
      });
    }

    // Xác thực access token và lấy thông tin user
    const user = await authService.getUserFromAccessToken(accessToken);
    req.user = user;

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired access token',
    });
  }
};

// Kiểm tra quyền user
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

// Middleware chỉ dành cho Admin
export const adminOnly = authorize(UserRole.ADMIN);

// Middleware cho VIP hoặc Admin
export const vipOrAdmin = authorize(UserRole.VIP, UserRole.ADMIN);
