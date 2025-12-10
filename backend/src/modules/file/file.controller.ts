import { Request, Response } from 'express';
import fileService from './file.service';
import userService from '../user/user.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

class FileController {
  async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const avatarUrl = await fileService.uploadAvatar(req.file, req.user.id);
      if (req.user.avatarUrl) {
        await fileService.deleteAvatar(req.user.avatarUrl);
      }

      const updatedUser = await userService.updateUserAvatar(req.user.id, avatarUrl);

      return successResponse(res, { avatarUrl, user: updatedUser }, 'Avatar uploaded successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to upload avatar', 500);
    }
  }

  async deleteAvatar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!req.user.avatarUrl) {
        return errorResponse(res, 'No avatar to delete', 400);
      }

      await fileService.deleteAvatar(req.user.avatarUrl);

      const updatedUser = await userService.updateUserAvatar(req.user.id, null);

      return successResponse(res, { user: updatedUser }, 'Avatar deleted successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to delete avatar', 500);
    }
  }

  async getAvatar(req: Request, res: Response) {
    try {
      const { bucket, filename } = req.params;
      const avatarPath = `/${bucket}/avatars/${filename}`;

      const { stream, contentType, size } = await fileService.getAvatar(avatarPath);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 năm

      stream.pipe(res);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get avatar', 404);
    }
  }
}

export default new FileController();
