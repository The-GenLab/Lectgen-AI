import { Request, Response, NextFunction } from 'express';
import { isVipOrAdmin, MessageType } from '../constants';
import adminSettingsService from '../../modules/admin/admin-settings.service';

/**
 * Middleware to check if the input method is enabled for FREE users
 * VIP and ADMIN users bypass this check
 */
export const checkInputMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // VIP and ADMIN can use all input methods
    if (isVipOrAdmin(req.user.role)) {
      return next();
    }

    // Get input methods settings
    const settings = await adminSettingsService.getSettings();
    const inputMethods = settings.inputMethods;

    // Get messageType from request body
    const { messageType } = req.body;

    if (!messageType) {
      // If no messageType, allow (validation will handle it later)
      return next();
    }

    // Check if the input method is enabled
    let isEnabled = false;
    let methodName = '';

    switch (messageType) {
      case MessageType.TEXT:
        isEnabled = inputMethods.text;
        methodName = 'Text input';
        break;
      case MessageType.AUDIO:
        isEnabled = inputMethods.audio;
        methodName = 'Audio input';
        break;
      case MessageType.IMAGE:
        isEnabled = inputMethods.image;
        methodName = 'Image input';
        break;
      default:
        // Unknown messageType, let validation handle it
        return next();
    }

    if (!isEnabled) {
      return res.status(403).json({
        success: false,
        message: `${methodName} is currently disabled. Please use an enabled input method or upgrade to VIP.`,
        data: {
          enabledMethods: {
            text: inputMethods.text,
            audio: inputMethods.audio,
            image: inputMethods.image,
          },
        },
      });
    }

    next();
  } catch (error: any) {
    console.error('Error checking input methods:', error);
    // On error, allow the request to proceed (fail open for availability)
    next();
  }
};

