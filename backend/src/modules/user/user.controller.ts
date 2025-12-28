import { Request, Response } from 'express';
import userService from './user.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

class UserController {
  // Get current user profile (same as auth/me, but can be extended )
  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      return successResponse(res, { user: req.user }, 'Profile retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get profile', 500);
    }
  }

  // Update current user profile (name only)
  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return errorResponse(res, 'Name is required', 400);
      }

      const updatedUser = await userService.updateUserName(req.user.id, name.trim());

      return successResponse(res, { user: updatedUser }, 'Profile updated successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to update profile', 500);
    }
  }

  // Get all users (admin only)
  async getAllUsers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { rows: users, count: total } = await userService.getAllUsers(limit, offset);

      return successResponse(
        res,
        {
          users: users.map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            slidesGenerated: u.slidesGenerated,
            maxSlidesPerMonth: u.maxSlidesPerMonth,
            createdAt: u.createdAt,
          })),
          total,
          limit,
          offset,
        },
        'Users retrieved successfully'
      );
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get users', 500);
    }
  }

  // Get user by ID (admin only)
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(
        res,
        {
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
        'User retrieved successfully'
      );
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get user', 500);
    }
  }

  // Update user (admin only)
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, role, maxSlidesPerMonth } = req.body;

      const user = await userService.updateUser(id, {
        email,
        role,
        maxSlidesPerMonth,
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(res, { user }, 'User updated successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to update user', 500);
    }
  }

  // Delete user (admin only)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(id);

      if (!deleted) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(res, null, 'User deleted successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to delete user', 500);
    }
  }

  // Get user statistics (admin only)
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await userService.getUserStatistics();
      return successResponse(res, { statistics: stats }, 'Statistics retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get statistics', 500);
    }
  }

  // Search users (admin only)
  async searchUsers(req: Request, res: Response) {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return errorResponse(res, 'Email query parameter is required', 400);
      }

      const users = await userService.searchUsers(email);

      return successResponse(
        res,
        {
          users: users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
          })),
        },
        'Search completed successfully'
      );
    } catch (error: any) {
      return errorResponse(res, error.message || 'Search failed', 500);
    }
  }

  // Upgrade current user to VIP (authenticated)
  async upgradeToVIP(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { durationMonths } = req.body;

      if (!durationMonths || (durationMonths !== 1 && durationMonths !== 12)) {
        return errorResponse(res, 'durationMonths must be 1 (monthly) or 12 (yearly)', 400);
      }

      // Check if user is already VIP
      if (req.user.role === 'VIP') {
        return errorResponse(res, 'User is already VIP', 400);
      }

      const updatedUser = await userService.upgradeToVIP(req.user.id, durationMonths);

      if (!updatedUser) {
        return errorResponse(res, 'Failed to upgrade user', 500);
      }

      return successResponse(res, { user: updatedUser }, 'Successfully upgraded to VIP');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to upgrade to VIP', 500);
    }
  }
}

export default new UserController();
