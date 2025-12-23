import { userRepository, usageLogRepository } from '../../core/repositories';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';
import { UserRole } from '../../shared/constants/enums';

class AdminService {
  /**
   * Get global system statistics
   */
  async getGlobalStats(startDate?: Date, endDate?: Date) {
    const usageStats = await usageLogRepository.getGlobalStats(startDate, endDate);
    const userStats = await userRepository.getStatistics();

    // Get quota status for free users
    const allFreeUsers = await userRepository.findByRole(UserRole.FREE);
    const topFreeUsers = allFreeUsers
      .sort((a, b) => b.slidesGenerated - a.slidesGenerated)
      .slice(0, 5);

    const quotaStatus = topFreeUsers.map(user => ({
      userName: user.name || user.email.split('@')[0],
      used: user.slidesGenerated,
      limit: user.maxSlidesPerMonth,
      usagePercent: Math.round((user.slidesGenerated / user.maxSlidesPerMonth) * 100)
    }));

    // Get VIP metrics
    const vipUsers = await userRepository.findByRole(UserRole.VIP);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get VIP generations today by querying usage logs
    const todayLogs = await usageLogRepository.findAll({
      startDate: todayStart,
      endDate: now
    });

    const vipUserIds = new Set(vipUsers.map(u => u.id));
    const vipGenerationsToday = todayLogs.rows.filter(log =>
      vipUserIds.has(log.userId) && log.actionType === ActionType.AI_GENERATION
    ).length;

    // Calculate average response time for VIP users (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = await usageLogRepository.findAll({
      startDate: sevenDaysAgo,
      endDate: now
    });

    const vipLogsWithDuration = recentLogs.rows.filter(log =>
      vipUserIds.has(log.userId) &&
      log.actionType === ActionType.AI_GENERATION &&
      log.status === ActionStatus.SUCCESS &&
      log.durationMs !== null &&
      log.durationMs > 0
    );

    const avgResponseTime = vipLogsWithDuration.length > 0
      ? Math.round(vipLogsWithDuration.reduce((sum, log) => sum + (log.durationMs || 0), 0) / vipLogsWithDuration.length)
      : 0;

    const vipMetrics = {
      activeVipUsers: vipUsers.length,
      vipGenerationsToday: vipGenerationsToday || 0,
      avgResponseTime: avgResponseTime,
      systemLoad: Math.floor(Math.random() * 40) + 20 // Mock 20-60% (need system metrics integration)
    };

    return {
      ...usageStats,
      totalUsers: userStats.total,
      usersByRole: {
        FREE: userStats.free,
        VIP: userStats.vip,
        ADMIN: userStats.admin,
      },
      quotaStatus,
      vipMetrics
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
