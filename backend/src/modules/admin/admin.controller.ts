import { Request, Response } from 'express';
import adminService from './admin.service';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';

class AdminController {
    /**
     * GET /api/admin/stats
     * Get global system statistics
     */
    
    async getGlobalStats(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;

            const stats = await adminService.getGlobalStats(
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            return successResponse(res, stats, 'Global stats retrieved successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to get global stats', 500);
        }
    }

    /**
     * GET /api/admin/users
     * Get all users with their quotas and stats
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const result = await adminService.getAllUsers({ limit, offset });

            return successResponse(res, result, 'Users retrieved successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to get users', 500);
        }
    }

    /**
     * GET /api/admin/users/:userId/stats
     * Get detailed stats for a specific user
     */
    async getUserStats(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            const stats = await adminService.getUserStats(
                userId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            return successResponse(res, stats, 'User stats retrieved successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to get user stats', 500);
        }
    }

    /**
     * GET /api/admin/usage-logs
     * Get usage logs with filters
     */
    async getUsageLogs(req: Request, res: Response) {
        try {
            const { userId, actionType, status, startDate, endDate, limit, offset } = req.query;

            const result = await adminService.getUsageLogs({
                userId: userId as string,
                actionType: actionType as ActionType,
                status: status as ActionStatus,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                limit: limit ? parseInt(limit as string) : 50,
                offset: offset ? parseInt(offset as string) : 0,
            });

            return successResponse(res, result, 'Usage logs retrieved successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to get usage logs', 500);
        }
    }

    /**
     * PATCH /api/admin/users/:userId/quota
     * Update user quota
     */
    async updateUserQuota(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { maxSlidesPerMonth } = req.body;

            if (typeof maxSlidesPerMonth !== 'number' || maxSlidesPerMonth < 0) {
                return errorResponse(res, 'Invalid maxSlidesPerMonth value', 400);
            }

            const result = await adminService.updateUserQuota(userId, maxSlidesPerMonth);

            return successResponse(res, result, 'User quota updated successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to update user quota', 500);
        }
    }

    /**
     * PATCH /api/admin/users/:userId/role
     * Update user role
     */
    async updateUserRole(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            if (!role || typeof role !== 'string') {
                return errorResponse(res, 'Invalid role value', 400);
            }

            const result = await adminService.updateUserRole(userId, role);

            return successResponse(res, result, 'User role updated successfully');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to update user role', 500);
        }
    }
}

export default new AdminController();
