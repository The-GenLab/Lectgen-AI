import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository, sessionRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';
import { sendResetPasswordEmail } from '../../core/config/email';
import adminSettingsService from '../admin/admin-settings.service';

class AuthService {
  // Cấu hình JWT
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;
  private readonly ACCESS_TOKEN_EXPIRES_IN: string = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  private readonly SALT_ROUNDS = JWT.SALT_ROUNDS;

  // Tạo access token
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as any);
  }

  // Tạo refresh token ngẫu nhiên
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Tính thời gian hết hạn refresh token
  getRefreshTokenExpiryDate(): Date {
    const expiryDate = new Date();
    const days = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('d', ''));
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  }

  // Xác thực access token
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash mật khẩu
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // So sánh mật khẩu
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Kiểm tra email đã tồn tại chưa
  async checkEmailExists(email: string): Promise<boolean> {
    return !!(await userRepository.findByEmail(email));
  }

  // Đăng ký tài khoản
  async register(
    data: RegisterData
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    if (await userRepository.findByEmail(email)) {
      throw new Error('Email already registered');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Get monthly free quota from settings
    const monthlyFreeQuota = await adminSettingsService.getMonthlyFreeQuota();
    
    const user = await userRepository.create({
      email,
      name: email.split('@')[0],
      avatarUrl: null,
      passwordHash: await this.hashPassword(password),
      role: UserRole.FREE,
      maxSlidesPerMonth: monthlyFreeQuota,
    });

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken();
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { user, accessToken, refreshToken };
  }

  // Đăng nhập
  async login(
    data: LoginData
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;
    if(password.length === 0){
      throw new Error('Password cannot be empty');
    }
    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }
    if (!(await this.comparePassword(password, user.passwordHash))) {
      throw new Error('Invalid email or password');
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken();
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { user, accessToken, refreshToken };
  }

  // Lấy thông tin user từ access token
  async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await userRepository.findById(payload.userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  // Làm mới access token
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session) throw new Error('Invalid or expired refresh token');

    const user = await userRepository.findById(session.userId);
    if (!user) {
      await sessionRepository.delete(session.id);
      throw new Error('User not found');
    }

    const newAccessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = this.generateRefreshToken();
    await sessionRepository.delete(session.id);
    await sessionRepository.create({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Đăng xuất 1 thiết bị
  async logout(refreshToken: string): Promise<void> {
    await sessionRepository.deleteByRefreshToken(refreshToken);
  }

  // Đăng xuất tất cả thiết bị
  async logoutAll(userId: string): Promise<void> {
    await sessionRepository.deleteAllByUserId(userId);
  }

  // Gửi email quên mật khẩu
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('If the email exists, a password reset link has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await userRepository.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    if (!(await sendResetPasswordEmail(user.email, user.name, resetUrl))) {
      await userRepository.update(user.id, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      throw new Error('Failed to send password reset email');
    }
  }

  // Đặt lại mật khẩu
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(hashedToken);

    if (!user) throw new Error('Invalid or expired password reset token');
    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');

    await userRepository.update(user.id, {
      passwordHash: await this.hashPassword(newPassword),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  // Kiểm tra reset token còn hợp lệ không
  async validateResetToken(token: string): Promise<boolean> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return !!(await userRepository.findByResetToken(hashedToken));
  }

  // Xử lý đăng nhập / đăng ký bằng Google
  async handleGoogleAuth(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): Promise<{ user: User; accessToken: string; refreshToken: string; isNewUser: boolean }> {
    let user = await userRepository.findByEmail(googleUser.email);
    let isNewUser = false;

    if (!user) {
      const monthlyFreeQuota = await adminSettingsService.getMonthlyFreeQuota();
      user = await userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        passwordHash: '',
        googleId: googleUser.googleId,
        role: UserRole.FREE,
        maxSlidesPerMonth: monthlyFreeQuota,
      });
      isNewUser = true;
    } else if (!user.googleId) {
      user = (await userRepository.update(user.id, {
        googleId: googleUser.googleId,
      })) as User;
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken();
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { user, accessToken, refreshToken, isNewUser };
  }
}

export default new AuthService();
