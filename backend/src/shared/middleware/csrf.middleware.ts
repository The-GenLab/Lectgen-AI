import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Tạo và thiết lập CSRF token cookie
 * Sử dụng mẫu double-submit cookie để bảo vệ CSRF
 */
export const generateCsrfToken = (res: Response): string => {
  const token = randomBytes(32).toString('hex');
  
  // Thiết lập cookie không phải httpOnly để frontend có thể đọc
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Phải đọc được bằng JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
  });

  return token;
};

/**
 * Xác thực CSRF token từ cookie khớp với header
 * Middleware kiểm tra mẫu double-submit cookie
 */
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  // Cả hai phải tồn tại và khớp nhau
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed',
    });
  }

  next();
};

/**
 * Xóa CSRF token cookie
 */
export const clearCsrfToken = (res: Response): void => {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Lấy CSRF token từ request cookies
 */
export const getCsrfToken = (req: Request): string | undefined => {
  return req.cookies?.[CSRF_COOKIE_NAME];
};
