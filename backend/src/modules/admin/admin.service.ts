import { userRepository, usageLogRepository } from '../../core/repositories';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';
import { UserRole } from '../../shared/constants/enums';
import userService from '../user/user.service';
import authService from '../auth/auth.service';
import fileService from '../file/file.service';
import adminSettingsService from './admin-settings.service';
import Payment from '../../core/models/Payment';
import User from '../../core/models/User';
import { Op } from 'sequelize';
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

  /**
   * Reset user password (admin only)
   */
  async resetUserPassword(userId: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    // @ts-ignore - hashPassword is private but we need it for admin reset
    const passwordHash = await (authService as any).hashPassword(newPassword);
    await userRepository.update(userId, { passwordHash: passwordHash as any });

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Upload avatar for user (admin only)
   */
  async uploadUserAvatar(userId: string, file: Express.Multer.File) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const avatarUrl = await fileService.uploadAvatar(file, userId);
    if (user.avatarUrl) {
      await fileService.deleteAvatar(user.avatarUrl);
    }

    const updatedUser = await userService.updateUserAvatar(userId, avatarUrl);
    return { avatarUrl, user: updatedUser };
  }

  /**
   * Create new user (Admin only)
   */
  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'FREE' | 'VIP' | 'ADMIN';
  }) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password using authService
    // @ts-ignore - hashPassword is private but we need it for admin create
    const passwordHash = await (authService as any).hashPassword(data.password);

    // Get monthly free quota for FREE users
    const monthlyFreeQuota = await adminSettingsService.getMonthlyFreeQuota();

    // Create user
    const user = await userRepository.create({
      email: data.email.trim(),
      name: data.name.trim(),
      passwordHash,
      role: data.role as UserRole,
      maxSlidesPerMonth: data.role === 'FREE' ? monthlyFreeQuota : -1, // -1 means unlimited for VIP/ADMIN
      slidesGenerated: 0,
      avatarUrl: null,
    });

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
    };
  }

  /**
   * Get billing/subscription statistics
   */
  async getBillingStats(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Get all active VIP users (with active subscriptions)
    const activeVipUsers = await User.findAll({
      where: {
        role: UserRole.VIP,
        subscriptionExpiresAt: {
          [Op.gt]: now,
        },
      },
    });

    // Calculate total revenue from all completed payments in current month
    const currentMonthPayments = await Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: currentMonthStart,
          [Op.lte]: now,
        },
      },
    });

    let monthlyRevenue = 0;
    currentMonthPayments.forEach(payment => {
      // Add full amount for each payment (total revenue, not recurring monthly)
      monthlyRevenue += parseFloat(payment.amount.toString());
    });
    monthlyRevenue = Math.round(monthlyRevenue * 100) / 100;

    // Calculate previous month total revenue (all completed payments in previous month)
    const previousMonthPayments = await Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd,
        },
      },
    });

    let previousMonthRevenue = 0;
    previousMonthPayments.forEach(payment => {
      // Add full amount for each payment (total revenue)
      previousMonthRevenue += parseFloat(payment.amount.toString());
    });
    previousMonthRevenue = Math.round(previousMonthRevenue * 100) / 100;

    // Calculate monthly revenue change
    const monthlyRevenueChange = previousMonthRevenue > 0
      ? Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 * 10) / 10
      : monthlyRevenue > 0 ? 100 : 0;


    // Get previous month active VIP users (users who were VIP and had active subscription at end of last month)
    // A user was active last month if their subscription expired after last month end
    const previousMonthActiveVip = await User.count({
      where: {
        role: UserRole.VIP,
        subscriptionExpiresAt: {
          [Op.gt]: lastMonthEnd,
        },
        createdAt: {
          [Op.lte]: lastMonthEnd,
        },
      },
    });

    const vipUsersChange = previousMonthActiveVip > 0
      ? Math.round(((activeVipUsers.length - previousMonthActiveVip) / previousMonthActiveVip) * 100 * 10) / 10
      : activeVipUsers.length > 0 ? 100 : 0;

    // Calculate conversion rate (only FREE and VIP users, exclude ADMIN)
    const totalUsers = await User.count({
      where: {
        role: {
          [Op.in]: [UserRole.FREE, UserRole.VIP],
        },
      },
    });
    const conversionRate = totalUsers > 0
      ? Math.round((activeVipUsers.length / totalUsers) * 100 * 10) / 10
      : 0;

    // Previous month conversion rate (only FREE and VIP users)
    const previousMonthTotal = await User.count({
      where: {
        role: {
          [Op.in]: [UserRole.FREE, UserRole.VIP],
        },
        createdAt: {
          [Op.lte]: lastMonthEnd,
        },
      },
    });
    const previousConversionRate = previousMonthTotal > 0
      ? (previousMonthActiveVip / previousMonthTotal) * 100
      : 0;

    const conversionRateChange = Math.round((conversionRate - previousConversionRate) * 10) / 10;

    // Get VIP subscribers with their latest payment info
    const vipSubscribers = await User.findAll({
      where: {
        role: UserRole.VIP,
        subscriptionExpiresAt: {
          [Op.gt]: now,
        },
      },
      order: [['subscriptionExpiresAt', 'DESC']],
    });

    // Get latest payment for each subscriber
    const subscribersWithPayments = await Promise.all(
      vipSubscribers.map(async (user) => {
        const latestPayment = await Payment.findOne({
          where: {
            userId: user.id,
            status: 'completed',
          },
          order: [['paymentDate', 'DESC']],
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          subscriptionStartDate: latestPayment?.subscriptionStartDate || null,
          planType: latestPayment?.planType || 'monthly',
          amount: latestPayment ? parseFloat(latestPayment.amount.toString()) : 0,
          paymentDate: latestPayment?.paymentDate || null,
        };
      })
    );

    return {
      monthlyRevenue,
      activeVipUsers: activeVipUsers.length,
      conversionRate,
      monthlyRevenueChange,
      vipUsersChange,
      conversionRateChange,
      subscribers: subscribersWithPayments,
    };
  }

  /**
   * Get revenue trend data for chart
   */
  async getRevenueTrend(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const effectiveStart = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const effectiveEnd = endDate || now;

    // Get all completed payments in the date range
    const payments = await Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: {
          [Op.gte]: effectiveStart,
          [Op.lte]: effectiveEnd,
        },
      },
      order: [['paymentDate', 'ASC']],
    });

    // Group payments by date
    const revenueByDate: Record<string, number> = {};
    payments.forEach(payment => {
      const dateStr = new Date(payment.paymentDate).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!revenueByDate[dateStr]) {
        revenueByDate[dateStr] = 0;
      }
      revenueByDate[dateStr] += parseFloat(payment.amount.toString());
    });

    // Generate array of all dates in range
    const dates: string[] = [];
    const currentDate = new Date(effectiveStart);
    while (currentDate <= effectiveEnd) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create chart data with cumulative revenue
    let cumulativeRevenue = 0;
    const chartData = dates.map(date => {
      const dailyRevenue = revenueByDate[date] || 0;
      cumulativeRevenue += dailyRevenue;
      return {
        date,
        revenue: parseFloat(dailyRevenue.toFixed(2)),
        cumulativeRevenue: parseFloat(cumulativeRevenue.toFixed(2)),
      };
    });

    return {
      data: chartData,
      totalRevenue: cumulativeRevenue,
      period: {
        startDate: effectiveStart.toISOString(),
        endDate: effectiveEnd.toISOString(),
      },
    };
  }
}

export default new AdminService();
