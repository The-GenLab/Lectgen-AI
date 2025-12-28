import User, { UserCreationAttributes, UserAttributes } from '../models/User';
import { Op } from 'sequelize';
import { UserRole } from '../../shared/constants';

class UserRepository {
  // Create new user
  async create(userData: UserCreationAttributes): Promise<User> {
    return await User.create(userData);
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    return await User.findByPk(id);
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({ where: { email } });
  }

  // Find all users with pagination
  async findAll(options: { limit?: number; offset?: number } = {}): Promise<{ rows: User[]; count: number }> {
    const { rows, count } = await User.findAndCountAll({
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: [['createdAt', 'DESC']],
    });
    return { rows, count };
  }

  // Count all users
  async countAll(): Promise<number> {
    return await User.count();
  }

  // Find users by role
  async findByRole(role: UserRole): Promise<User[]> {
    return await User.findAll({
      where: { role },
      order: [['createdAt', 'DESC']],
    });
  }

  // Update user
  async update(id: string, updateData: Partial<UserAttributes>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return await user.update(updateData);
  }

  // Delete user
  async delete(id: string): Promise<boolean> {
    const result = await User.destroy({ where: { id } });
    return result > 0;
  }

  // Increment slides generated count
  async incrementSlidesGenerated(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    user.slidesGenerated += 1;
    return await user.save();
  }

  // Reset monthly quota for all users
  async resetMonthlyQuota(): Promise<number> {
    const [affectedCount] = await User.update(
      { slidesGenerated: 0 },
      { where: { role: 'FREE' } }
    );
    return affectedCount;
  }

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const count = await User.count({ where: { email } });
    return count > 0;
  }

  // Get user statistics
  async getStatistics(): Promise<{
    total: number;
    free: number;
    vip: number;
    admin: number;
  }> {
    const total = await User.count();
    const free = await User.count({ where: { role: UserRole.FREE } });
    const vip = await User.count({ where: { role: UserRole.VIP } });
    const admin = await User.count({ where: { role: UserRole.ADMIN } });

    return { total, free, vip, admin };
  }

  // Find users by an array of ids
  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) return [];
    return await User.findAll({ where: { id: ids } });
  }

  // Search users by email pattern
  async searchByEmail(emailPattern: string): Promise<User[]> {
    return await User.findAll({
      where: {
        email: {
          [Op.iLike]: `%${emailPattern}%`,
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  // Find user by reset password token (còn hạn)
  async findByResetToken(resetPasswordToken: string): Promise<User | null> {
    return await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: {
          [Op.gt]: new Date(), // Token phải còn hạn
        },
      },
    });
  }

  // Find user by Google ID
  async findByGoogleId(googleId: string): Promise<User | null> {
    return await User.findOne({ where: { googleId } });
  }
}

export default new UserRepository();
