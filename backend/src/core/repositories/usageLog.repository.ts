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
        status?: ActionStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ rows: UsageLog[]; count: number }> {
        const where: any = {};

        if (options.userId) {
            where.userId = options.userId;
        }

        if (options.actionType) {
            where.actionType = options.actionType;
        }

        if (options.status) {
            where.status = options.status;
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

        return await UsageLog.findAndCountAll({
            where,
            limit: options.limit || 50,
            offset: options.offset || 0,
            order: [['createdAt', 'DESC']],
        });
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

        const uniqueUsers = new Set(logs.map(log => log.userId));
        const totalUsers = uniqueUsers.size;

        const byActionType: { [key: string]: number } = {};
        logs.forEach(log => {
            byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;
        });

        return {
            totalCalls,
            totalTokens,
            totalCost,
            totalUsers,
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
