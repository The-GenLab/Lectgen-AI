import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import Payment from '../../core/models/Payment';
import { UserRole, addMonths, QUOTA } from '../../shared/constants';
import adminSettingsService from '../admin/admin-settings.service';

class UserService {
  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    return await userRepository.findById(id);
  }

  // Update user name (for profile editing)
  async updateUserName(id: string, name: string): Promise<User | null> {
    return await userRepository.update(id, { name });
  }

  // Update user avatar
  async updateUserAvatar(id: string, avatarUrl: string | null): Promise<User | null> {
    return await userRepository.update(id, { avatarUrl });
  }

  // Update user profile
  async updateUser(id: string, updateData: Partial<{
    email: string;
    role: UserRole;
    maxSlidesPerMonth: number;
  }>): Promise<User | null> {
    return await userRepository.update(id, updateData);
  }

  // Upgrade user to VIP
  async upgradeToVIP(userId: string, durationMonths: number = 1): Promise<User | null> {
    const now = new Date();
    const subscriptionStartDate = now;
    const subscriptionExpiresAt = addMonths(now, durationMonths);
    
    // Determine plan type and amount
    const planType: 'monthly' | 'yearly' = durationMonths >= 12 ? 'yearly' : 'monthly';
    const amount = planType === 'yearly' ? 144 : 12 * durationMonths;

    // Update user to VIP
    const updatedUser = await userRepository.update(userId, {
      role: UserRole.VIP,
      subscriptionExpiresAt,
    });

    // Create payment record
    if (updatedUser) {
      await Payment.create({
        userId,
        amount,
        planType,
        paymentDate: now,
        subscriptionStartDate,
        subscriptionEndDate: subscriptionExpiresAt,
        paymentMethod: 'momo',
        status: 'completed',
      });
    }

    return updatedUser;
  }

  // Downgrade VIP to FREE (when subscription expires)
  async downgradeToFree(userId: string): Promise<User | null> {
    const monthlyFreeQuota = await adminSettingsService.getMonthlyFreeQuota();
    return await userRepository.update(userId, {
      role: UserRole.FREE,
      subscriptionExpiresAt: null,
      maxSlidesPerMonth: monthlyFreeQuota,
    });
  }

  // Get all users (admin only)
  async getAllUsers(limit: number = 50, offset: number = 0) {
    return await userRepository.findAll({ limit, offset });
  }

  // Get users by role (admin only)
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await userRepository.findByRole(role);
  }

  // Delete user (admin only)
  async deleteUser(id: string): Promise<boolean> {
    return await userRepository.delete(id);
  }

  // Get user statistics (admin only)
  async getUserStatistics() {
    return await userRepository.getStatistics();
  }

  // Search users by email (admin only)
  async searchUsers(emailPattern: string): Promise<User[]> {
    return await userRepository.searchByEmail(emailPattern);
  }

  // Reset monthly quota for all FREE users (cron job)
  async resetAllQuotas(): Promise<number> {
    return await userRepository.resetMonthlyQuota();
  }
}

export default new UserService();
