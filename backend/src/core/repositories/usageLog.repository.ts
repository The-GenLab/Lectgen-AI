import UsageLog, { UsageLogCreationAttributes, ActionType, ActionStatus } from '../models/UsageLog';
import { Op } from 'sequelize';

class UsageLogRepository {
    /**
     * Create a new usage log entry
     */
    async create(data: UsageLogCreationAttributes): Promise<UsageLog> {
        return await UsageLog.create(data);
    }

    /**
     * Find usage log by ID
     */
    async findById(id: string): Promise<UsageLog | null> {
        return await UsageLog.findByPk(id);
    }

    /**
     * Find all usage logs with filters and pagination
     */
    async findAll(options: {
        userId?: string;
        actionType?: ActionType;
        status?: ActionStatus | string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
        q?: string;
        sortBy?: string;
        order?: 'ASC' | 'DESC';
    }): Promise<{ rows: any[]; count: number }> {
        const where: any = {};

        if (options.userId) {
            where.userId = options.userId;
        }

        if (options.actionType) {
            where.actionType = options.actionType;
        }

        if (options.status) {
            const s = String(options.status).toLowerCase();
            if (s === 'error') where.status = ActionStatus.FAILED;
            else if (s === 'warning') where.status = ActionStatus.PENDING;
            else if (s === 'info') where.status = ActionStatus.SUCCESS;
            else where.status = options.status;
        }

        if (options.startDate || options.endDate) {
            where.createdAt = {};
            if (options.startDate) {
                where.createdAt[Op.gte] = options.startDate;
            }
            if (options.endDate) {
                where.createdAt[Op.lte] = options.endDate;
            }
        }

        // Tìm kiếm text trong id, errorMessage, metadata **và** mở rộng tìm kiếm theo tên user
        if (options.q) {
            const q = `%${options.q}%`;

            // Thử tìm user có name phù hợp để lấy userId (tăng khả năng tìm theo tên người dùng)
            try {
                const User = require('../models/User').default;
                const matchedUsers = await User.findAll({ where: { name: { [Op.iLike]: q } }, attributes: ['id'] });
                const userIds = matchedUsers.map((u: any) => u.id);

                const Sequelize = require('sequelize');
                // id là uuid trong db, cần cast sang text để dùng iLike
                const orClauses: any[] = [
                    Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'text'), { [Op.iLike]: q }),
                    { errorMessage: { [Op.iLike]: q } },
                    Sequelize.where(Sequelize.cast(Sequelize.col('metadata'), 'text'), { [Op.iLike]: q })
                ];

                if (userIds.length > 0) {
                    orClauses.push({ userId: { [Op.in]: userIds } });
                }

                where[Op.or] = orClauses;
            } catch (err: any) {
                // Fallback khi cast metadata hoặc lookup user gặp lỗi
                console.warn('Search cast/user lookup failed:', err?.message ?? err);
                try {
                    const Sequelize = require('sequelize');
                    where[Op.or] = [
                        Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'text'), { [Op.iLike]: q }),
                        { errorMessage: { [Op.iLike]: q } }
                    ];
                } catch (innerErr: any) {
                    console.warn('Fallback search (id cast also failed):', innerErr?.message ?? innerErr);
                    where[Op.or] = [{ errorMessage: { [Op.iLike]: q } }];
                }
            }
        }

        // xác thực các trường sắp xếp tránh lỗi SQL injection
        const allowedSortFields = ['createdAt', 'id', 'actionType', 'status'];
        let orderArr: any = [['createdAt', 'DESC']];
        if (options.sortBy && allowedSortFields.includes(options.sortBy)) {
            orderArr = [[options.sortBy, options.order || 'DESC']];
        }

        let result;
        try {
            result = await UsageLog.findAndCountAll({
                where,
                limit: options.limit || 50,
                offset: options.offset || 0,
                order: orderArr as any,
            });
        } catch (err: any) {
            console.error('UsageLog.findAndCountAll failed', { err: err?.message ?? err, where, orderArr });
            throw new Error('Database query failed for usage logs: ' + (err?.message ?? String(err)));
        }

        // chuẩn hóa rows với level field cho frontend dễ dùng
        const rows = result.rows.map((r: UsageLog) => {
            const plain = (r as any).get ? (r as any).get({ plain: true }) : r;
            let level = 'info';
            if (plain.status === ActionStatus.FAILED) level = 'error';
            else if (plain.status === ActionStatus.PENDING) level = 'warning';
            else if (plain.status === ActionStatus.SUCCESS) level = 'info';
            return { ...plain, level };
        });

        return { rows, count: result.count };
    }

    /**
     * Get statistics for a specific user
     */
    async getUserStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        successRate: number;
        byActionType: { [key: string]: number };
    }> {
        const where: any = { userId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[Op.gte] = startDate;
            }
            if (endDate) {
                where.createdAt[Op.lte] = endDate;
            }
        }

        const logs = await UsageLog.findAll({ where });

        const totalCalls = logs.length;
        const totalTokens = logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.cost?.toString() || '0'), 0);
        const successCount = logs.filter(log => log.status === ActionStatus.SUCCESS).length;
        const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;

        const byActionType: { [key: string]: number } = {};
        logs.forEach(log => {
            byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;
        });

        return {
            totalCalls,
            totalTokens,
            totalCost,
            successRate,
            byActionType,
        };
    }

    /**
     * Get global statistics
     */
    async getGlobalStats(startDate?: Date, endDate?: Date): Promise<{
        totalCalls: number;
        totalTokens: number;
        totalCost: number;
        totalUsers: number;
        uniqueUserIds: string[];
        successRate: number;
        byActionType: { [key: string]: number };
    }> {
        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[Op.gte] = startDate;
            }
            if (endDate) {
                where.createdAt[Op.lte] = endDate;
            }
        }

        const logs = await UsageLog.findAll({ where });

        const totalCalls = logs.length;
        const totalTokens = logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + parseFloat(log.cost?.toString() || '0'), 0);
        const successCount = logs.filter(log => log.status === ActionStatus.SUCCESS).length;
        const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;

        const uniqueUsers = Array.from(new Set(logs.map(log => log.userId)));
        const totalUsers = uniqueUsers.length;

        const byActionType: { [key: string]: number } = {};
        logs.forEach(log => {
            byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;
        });

        return {
            totalCalls,
            totalTokens,
            totalCost,
            totalUsers,
            uniqueUserIds: uniqueUsers,
            successRate,
            byActionType,
        };
    }

    /**
     * Delete old logs (for cleanup)
     */
    async deleteOldLogs(beforeDate: Date): Promise<number> {
        const result = await UsageLog.destroy({
            where: {
                createdAt: {
                    [Op.lt]: beforeDate,
                },
            },
        });
        return result;
    }
}

export default new UsageLogRepository();
