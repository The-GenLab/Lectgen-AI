import { userRepository, usageLogRepository } from '../../core/repositories';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';
import { UserRole } from '../../shared/constants/enums';
import * as os from 'os';

class AdminService {
  /**
   * lấy CPU load hiện tại của hệ thống
   */
  private getSystemLoad(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.min(Math.max(usage, 0), 100); // giới hạn giá trị 0 - 100
  }

  /**
   * Get global system statistics
   */
  async getGlobalStats(startDate?: Date, endDate?: Date) {
    const now = new Date();

    // Sử dụng khoảng tgian mặc định nếu ko có tham số
    const effectiveStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const effectiveEnd = endDate ? new Date(endDate) : now;

    // Lấy thống kê sử dụng và người dùng cho range được chọn
    const usageStats = await usageLogRepository.getGlobalStats(effectiveStart, effectiveEnd);
    const userStats = await userRepository.getStatistics();

    // Số người dùng hoạt động theo role
    let activeUsersByRole = { FREE: 0, VIP: 0, ADMIN: 0 };
    if (usageStats.uniqueUserIds && usageStats.uniqueUserIds.length > 0) {
      const activeUsers = await userRepository.findByIds(usageStats.uniqueUserIds as string[]);
      activeUsers.forEach(u => {
        if (u.role === UserRole.FREE) activeUsersByRole.FREE++;
        else if (u.role === UserRole.VIP) activeUsersByRole.VIP++;
        else if (u.role === UserRole.ADMIN) activeUsersByRole.ADMIN++;
      });
    }

    // tính toán số liệu so sánh với khoảng tgian trước đó
    const periodLengthMs = effectiveEnd.getTime() - effectiveStart.getTime();
    const prevEnd = new Date(effectiveStart.getTime() - 1);
    const prevStart = new Date(effectiveStart.getTime() - periodLengthMs);

    const lastPeriodStats = await usageLogRepository.getGlobalStats(prevStart, prevEnd);

    // Tính tỉ lệ thay đổi token sử dụng compared to previous period
    const tokenChange = lastPeriodStats.totalTokens > 0
      ? Number((((usageStats.totalTokens - lastPeriodStats.totalTokens) / lastPeriodStats.totalTokens) * 100).toFixed(1))
      : (usageStats.totalTokens > 0 ? 100 : 0);

    // Tính tỉ lệ thay đổi số lượt tạo slides (calls) so we can display Slides Gen trend
    const slidesChange = lastPeriodStats.totalCalls > 0
      ? Number((((usageStats.totalCalls - lastPeriodStats.totalCalls) / lastPeriodStats.totalCalls) * 100).toFixed(1))
      : (usageStats.totalCalls > 0 ? 100 : 0);

    // So sánh số user free mới trong khoảng tgian so với khoảng tgian trước đó
    const allFreeUsers = await userRepository.findByRole(UserRole.FREE);
    const newFreeUsersThisPeriod = allFreeUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= effectiveStart && createdAt <= effectiveEnd;
    }).length;
    const newFreeUsersPrevPeriod = allFreeUsers.filter(user => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= prevStart && createdAt <= prevEnd;
    }).length;
    //tỉ lệ tăng trưởng của free user
    const freeUserGrowth = newFreeUsersPrevPeriod > 0
      ? Number(((newFreeUsersThisPeriod - newFreeUsersPrevPeriod) / newFreeUsersPrevPeriod * 100).toFixed(1))
      : (newFreeUsersThisPeriod > 0 ? 100 : 0);

    // Tỉ lệ ở lại của user vip (tức là có subscription active) so với tổng số user vip có sub trong khoảng tgian
    const vipUsers = await userRepository.findByRole(UserRole.VIP);
    const vipUsersWithSubscription = vipUsers.filter(user => user.subscriptionExpiresAt !== null);
    const totalVipWithSub = vipUsersWithSubscription.length;
    const activeVipUsers = vipUsersWithSubscription.filter(user => {
      return new Date(user.subscriptionExpiresAt!) > effectiveEnd;
    });

    const vipRetention = totalVipWithSub > 0
      ? Number((activeVipUsers.length / totalVipWithSub * 100).toFixed(1))
      : 0;


    // Lấy status quota của top 5 user free dùng nhiều nhất
    const topFreeUsers = allFreeUsers
      .sort((a, b) => b.slidesGenerated - a.slidesGenerated)
      .slice(0, 5);

    const quotaStatus = topFreeUsers.map(user => {
      const used = user.slidesGenerated || 0;
      const limit = user.maxSlidesPerMonth || 0;
      const usagePercent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : (used > 0 ? 100 : 0);
      return {
        userName: user.name || user.email.split('@')[0],
        used,
        limit,
        usagePercent
      };
    });

    // Chỉ số của users vip
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Đếm số lần tạo slide của user vip trong ngày hôm nay
    const todayLogs = await usageLogRepository.findAll({
      startDate: todayStart,
      endDate: now
    });

    const vipUserIds = new Set(vipUsersWithSubscription.map(u => u.id));
    const vipGenerationsToday = todayLogs.rows.filter(log =>
      vipUserIds.has(log.userId) && log.actionType === ActionType.AI_GENERATION
    ).length;

    // Tính thời gian phản hồi trung bình của user vip trong 7 ngày qua
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

    const activeVipUsersNow = vipUsersWithSubscription.filter(u => new Date(u.subscriptionExpiresAt!) > now).length;

    const vipMetrics = {
      activeVipUsers: activeVipUsersNow,
      vipGenerationsToday: vipGenerationsToday || 0,
      avgResponseTime: avgResponseTime,
      systemLoad: this.getSystemLoad()
    };

    return {
      ...usageStats,
      totalCost: Number((usageStats.totalCost || 0).toFixed(2)),
      successRate: Number(((usageStats.successRate || 0)).toFixed(1)),
      totalUsers: userStats.total,
      usersByRole: {
        FREE: userStats.free,
        VIP: userStats.vip,
        ADMIN: userStats.admin,
      },
      // activeUsersByRole shows number of unique users with activity in the selected range, grouped by role
      activeUsersByRole,
      comparison: {
        tokenChange,
        slidesChange,
        freeUserGrowth,
        vipRetention
      },
      quotaStatus,
      vipMetrics
    };
  }

  /**
   * Lấy tất cả user với quota và stats
   */
  async getAllUsers(options: { limit?: number; offset?: number }) {
    const { rows: users, count } = await userRepository.findAll({
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    // Lấy stats cho từng user
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
   * Lấy thống kê chi tiết cho 1 user cụ thể theo userId
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
        avatarUrl: user.avatarUrl,
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
   * Lấy logs sử dụng với các bộ lọc
   */
  async getUsageLogs(options: {
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
  }) {
    // forward as any to repository (repository accepts both enums and friendly strings)
    return await usageLogRepository.findAll(options as any);
  }

  /**
   * Câp nhật quota của user
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
   * Cập nhật role của user
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
