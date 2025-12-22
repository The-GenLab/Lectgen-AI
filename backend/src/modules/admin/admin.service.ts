import { userRepository, usageLogRepository } from '../../core/repositories';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';

class AdminService {
  /**
   * Get global system statistics
   */
  async getGlobalStats(startDate?: Date, endDate?: Date) {
    const usageStats = await usageLogRepository.getGlobalStats(startDate, endDate);
    const totalUsers = await userRepository.countAll();

    return {
      ...usageStats,
      totalUsers,
    };
  }

  /**
   * Get all users with their quotas and stats
   */
  async getAllUsers(options: { limit?: number; offset?: number }) {
    const { rows: users, count } = await userRepository.findAll({
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await usageLogRepository.getUserStats(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
          slidesGenerated: user.slidesGenerated,
          maxSlidesPerMonth: user.maxSlidesPerMonth,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          createdAt: user.createdAt,
          stats: {
            totalCalls: stats.totalCalls,
            totalTokens: stats.totalTokens,
            totalCost: stats.totalCost,
            successRate: stats.successRate,
          },
        };
      })
    );

    return {
      users: usersWithStats,
      total: count,
    };
  }

  /**
   * Get detailed stats for a specific user
   */
  async getUserStats(userId: string, startDate?: Date, endDate?: Date) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await usageLogRepository.getUserStats(userId, startDate, endDate);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        slidesGenerated: user.slidesGenerated,
        maxSlidesPerMonth: user.maxSlidesPerMonth,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        createdAt: user.createdAt,
      },
      stats,
    };
  }

  /**
   * Get usage logs with filters
   */
  async getUsageLogs(options: {
    userId?: string;
    actionType?: ActionType;
    status?: ActionStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    return await usageLogRepository.findAll(options);
  }

  /**
   * Update user quota
   */
  async updateUserQuota(userId: string, maxSlidesPerMonth: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await userRepository.update(userId, { maxSlidesPerMonth });

    return {
      message: 'User quota updated successfully',
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await userRepository.update(userId, { role } as any);

    return {
      message: 'User role updated successfully',
    };
  }
}

export default new AdminService();
