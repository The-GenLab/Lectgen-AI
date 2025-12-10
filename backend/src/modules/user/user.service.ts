import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { UserRole, addMonths, QUOTA } from '../../shared/constants';

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
    const subscriptionExpiresAt = addMonths(new Date(), durationMonths);

    return await userRepository.update(userId, {
      role: UserRole.VIP,
      subscriptionExpiresAt,
    });
  }

  // Downgrade VIP to FREE (when subscription expires)
  async downgradeToFree(userId: string): Promise<User | null> {
    return await userRepository.update(userId, {
      role: UserRole.FREE,
      subscriptionExpiresAt: null,
      maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
    });
  }

  // Get all users (admin only)
  async getAllUsers(limit: number = 50, offset: number = 0) {
    return await userRepository.findAll(limit, offset);
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
