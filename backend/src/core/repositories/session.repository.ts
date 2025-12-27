import Session, { SessionCreationAttributes } from '../models/Session';
import { Op } from 'sequelize';

class SessionRepository {
  // Tạo session mới
  async create(sessionData: SessionCreationAttributes): Promise<Session> {
    return await Session.create(sessionData);
  }

  // Tìm session bằng refresh token
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return await Session.findOne({ 
      where: { 
        refreshToken,
        expiresAt: {
          [Op.gt]: new Date() // Chỉ lấy session còn hạn
        }
      } 
    });
  }

  // Tìm tất cả session của user
  async findByUserId(userId: string): Promise<Session[]> {
    return await Session.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  // Xóa session cụ thể
  async delete(id: string): Promise<boolean> {
    const result = await Session.destroy({ where: { id } });
    return result > 0;
  }

  // Xóa session bằng refresh token
  async deleteByRefreshToken(refreshToken: string): Promise<boolean> {
    const result = await Session.destroy({ where: { refreshToken } });
    return result > 0;
  }

  // Xóa tất cả session của user (logout tất cả thiết bị)
  async deleteAllByUserId(userId: string): Promise<number> {
    return await Session.destroy({ where: { userId } });
  }

  // Xóa các session hết hạn (cleanup job)
  async deleteExpiredSessions(): Promise<number> {
    return await Session.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
  }

  // Đếm số session active của user
  async countActiveByUserId(userId: string): Promise<number> {
    return await Session.count({
      where: {
        userId,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });
  }
}

export default new SessionRepository();
