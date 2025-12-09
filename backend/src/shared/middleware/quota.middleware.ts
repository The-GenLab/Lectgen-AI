import { Request, Response, NextFunction } from 'express';
import { isVipOrAdmin } from '../constants';

// Check if user has available quota
export const checkQuota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // VIP and ADMIN have unlimited quota
    if (isVipOrAdmin(req.user.role)) {
      return next();
    }

    // Check if FREE user has quota
    if (!req.user.canGenerateSlides()) {
      return res.status(403).json({
        success: false,
        message: 'Quota exceeded. Upgrade to VIP for unlimited slides.',
        data: {
          slidesGenerated: req.user.slidesGenerated,
          maxSlides: req.user.maxSlidesPerMonth,
        },
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error checking quota',
    });
  }
};
