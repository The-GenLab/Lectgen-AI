import { Request, Response } from 'express';
import adminService from './admin.service';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';

class AdminController {
    /**
     * GET /api/admin/stats
     * Lấy thống kê tổng quan của hệ thống
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
     * Lấy tất cả quotas và stats của users
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
     * Lấy thống kê chi tiết cho 1 user cụ thể theo userId
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
     * Lấy logs sử dụng theo bộ lọc.
     */
    async getUsageLogs(req: Request, res: Response) {
        try {
            // Chuân hóa và lấy các tham số từ query
            const raw: any = req.query || {};
            const userId = Array.isArray(raw.userId) ? raw.userId[0] : raw.userId;
            const actionTypeRaw = Array.isArray(raw.actionType) ? raw.actionType[0] : raw.actionType;
            const statusRaw = Array.isArray(raw.status) ? raw.status[0] : raw.status;
            const startDateRaw = Array.isArray(raw.startDate) ? raw.startDate[0] : raw.startDate;
            const endDateRaw = Array.isArray(raw.endDate) ? raw.endDate[0] : raw.endDate;
            const limitRaw = Array.isArray(raw.limit) ? raw.limit[0] : raw.limit;
            const offsetRaw = Array.isArray(raw.offset) ? raw.offset[0] : raw.offset;
            const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;
            const sortBy = Array.isArray(raw.sortBy) ? raw.sortBy[0] : raw.sortBy;
            const order = Array.isArray(raw.order) ? raw.order[0] : raw.order;

            console.debug('getUsageLogs called with', { userId, actionTypeRaw, statusRaw, startDateRaw, endDateRaw, limitRaw, offsetRaw, q, sortBy, order });

            // xác thực các tham số trạng thái và loại hành động
            const friendlyLevels = ['error', 'warning', 'info'];
            if (statusRaw) {
                const s = String(statusRaw).toLowerCase();
                const isActionStatus = Object.values(ActionStatus).includes((statusRaw as unknown) as ActionStatus);
                if (!isActionStatus && !friendlyLevels.includes(s)) {
                    return errorResponse(res, 'Invalid status filter', 400);
                }
            }

            if (actionTypeRaw && !Object.values(ActionType).includes((actionTypeRaw as unknown) as ActionType)) {
                return errorResponse(res, 'Invalid actionType filter', 400);
            }

            const result = await adminService.getUsageLogs({
                userId: userId as string,
                actionType: actionTypeRaw as ActionType,
                status: statusRaw as string | undefined,
                startDate: startDateRaw ? new Date(startDateRaw as string) : undefined,
                endDate: endDateRaw ? new Date(endDateRaw as string) : undefined,
                limit: limitRaw ? parseInt(limitRaw as string) : 50,
                offset: offsetRaw ? parseInt(offsetRaw as string) : 0,
                q: q as string | undefined,
                sortBy: sortBy as string | undefined,
                order: (order as string | undefined) as 'ASC' | 'DESC' | undefined,
            });

            return successResponse(res, result, 'Usage logs retrieved successfully');
        } catch (error: any) {
            console.error('getUsageLogs failed:', error && (error.stack || error.message) ? (error.stack || error.message) : error);
            return errorResponse(res, error?.message || 'Failed to get usage logs', 500);
        }
    }

    /**
     * PATCH /api/admin/users/:userId/quota
     * Cập nhật quota của user
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
     * Cập nhật role của user
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
