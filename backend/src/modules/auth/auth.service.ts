import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { userRepository } from '../../core/repositories';
import { Session, OAuthState } from '../../core/models';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

// Cấu hình token
const ACCESS_TOKEN_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày
const RESET_TOKEN_EXPIRES_IN = '15m';
const SALT_ROUNDS = JWT.SALT_ROUNDS;
const OAUTH_STATE_LIFETIME_MS = 5 * 60 * 1000; // 5 phút

class AuthService {

  // Tạo JWT access token (15 phút)
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET as jwt.Secret, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Tạo refresh token ngẫu nhiên (hex, không phải JWT)
  generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Tạo phiên refresh với token đã hash
  async createRefreshSession(
    userId: string,
    rotatedFrom: string | null = null,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ refreshToken: string; jti: string }> {
    const refreshToken = this.generateRefreshToken();
    const jti = randomBytes(16).toString('hex');
    const hashedToken = this.hashToken(refreshToken);

    await Session.create({
      userId,
      jti,
      hashedToken,
      rotatedFrom,
      userAgent,
      ip,
      valid: true,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
    });

    return { refreshToken, jti };
  }

  // Vô hiệu hóa chuỗi session (phát hiện tái sử dụng token)
  async invalidateSessionChain(jti: string): Promise<void> {
    await Session.update(
      { valid: false },
      {
        where: {
          [Op.or]: [{ jti }, { rotatedFrom: jti }],
        },
      }
    );
  }

  /**
   * Xác thực refresh token và trả về session
   * Kiểm tra: hash, trạng thái hợp lệ, thời hạn
   */
  async validateRefreshToken(refreshToken: string): Promise<Session | null> {
    const hashedToken = this.hashToken(refreshToken);
    
    const session = await Session.findOne({
      where: { hashedToken },
    });

    if (!session) {
      return null;
    }

    // Kiểm tra hết hạn hoặc không hợp lệ
    if (!session.isUsable()) {
      return null;
    }

    return session;
  }

  // Xoay vòng token: vô hiệu hóa phiên cũ, tạo phiên mới
  async rotateRefreshToken(
    oldSession: Session,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ refreshToken: string; jti: string }> {
    // Vô hiệu hóa phiên cũ
    await Session.update({ valid: false }, { where: { id: oldSession.id } });

    // Tạo phiên mới liên kết với phiên cũ
    return this.createRefreshSession(oldSession.userId, oldSession.jti, userAgent, ip);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    return !!user;
  }

  /**
   * Xác thực độ mạnh mật khẩu
   * Yêu cầu: tối thiểu 12 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt
   */
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 12) {
      return { valid: false, message: 'Password must be at least 12 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  async register(
    data: RegisterData,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Kiểm tra độ mạnh mật khẩu
    const passwordValidation = this.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || 'Password does not meet requirements');
    }

    const passwordHash = await this.hashPassword(password);

    const name = email.split('@')[0];

    const user = await userRepository.create({
      email,
      googleId: null,
      name,
      avatarUrl: null,
      passwordHash,
      role: UserRole.FREE,
      maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
    });

    // Generate access token (short-lived JWT)
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create refresh token session (long-lived, stored in DB)
    const { refreshToken } = await this.createRefreshSession(user.id, null, userAgent, ip);

    return { user, accessToken, refreshToken };
  }

  async login(
    data: LoginData,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate access token (short-lived JWT)
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create refresh token session (long-lived, stored in DB)
    const { refreshToken } = await this.createRefreshSession(user.id, null, userAgent, ip);

    return { user, accessToken, refreshToken };
  }

  async getUserFromAccessToken(token: string): Promise<User> {
    const payload = this.verifyAccessToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Refresh with token rotation and reuse detection
  async refreshAccessToken(
    refreshToken: string,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.validateRefreshToken(refreshToken);
    
    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Reuse detection: invalidate chain if token was rotated
    if (!session.valid) {
      await this.invalidateSessionChain(session.jti);
      throw new Error('Refresh token reuse detected - session invalidated');
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { refreshToken: newRefreshToken } = await this.rotateRefreshToken(
      session,
      userAgent,
      ip
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    
    await Session.update(
      { valid: false },
      { where: { hashedToken } }
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await Session.update(
      { valid: false },
      { where: { userId } }
    );
  }

  generateResetToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'reset' },
      ACCESS_TOKEN_SECRET as jwt.Secret,
      { expiresIn: RESET_TOKEN_EXPIRES_IN } as jwt.SignOptions
    );
  }

  verifyResetToken(token: string): { userId: string; email: string; type: string } {
    try {
      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; email: string; type: string };
      if (payload.type !== 'reset') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error: any) {
      // Check if token is expired
      if (error.name === 'TokenExpiredError') {
        throw new Error('Reset link has expired. Please request a new one.');
      }
      throw new Error('Invalid or expired reset token');
    }
  }

  // Validate reset token without changing password
  async validateResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    const payload = this.verifyResetToken(token);
    
    // Check if user still exists
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return { valid: true, email: user.email };
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = this.generateResetToken(user.id, user.email);

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = this.verifyResetToken(token);

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate password strength
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || 'Password does not meet requirements');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await userRepository.update(user.id, { passwordHash });
  }
  async sendEmailService(emailUser: string, resetLink: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `Lectgen Support <${process.env.EMAIL_USERNAME}>`,
      to: emailUser,
      subject: 'Reset Your Password - Lectgen',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d131b;">Reset Your Password</h2>
        <p style="color: #4c6c9a; line-height: 1.6;">You have requested to reset your password for your Lectgen account.</p>
        <p style="color: #4c6c9a; line-height: 1.6;">Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #136dec; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e7ecf3; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Lectgen - AI Slide Generator</p>
      </div>
      `,
    });
  }
  async loginOrSignupGoogle(
    googleUser: any,
    userAgent: string | null = null,
    ip: string | null = null
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    let user = await userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await userRepository.create({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatar,
        passwordHash: '',
        role: UserRole.FREE,
        maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
      });
    } else if (!user.googleId) {
      await userRepository.update(user.id, {
        googleId: googleUser.id,
        avatarUrl: user.avatarUrl || googleUser.avatar,
      });
      user.googleId = googleUser.id;
    }

    // Generate access token (short-lived JWT)
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create refresh token session (long-lived, stored in DB)
    const { refreshToken } = await this.createRefreshSession(user.id, null, userAgent, ip);

    return { user, accessToken, refreshToken };
  }


  // Generate OAuth state for CSRF protection
  async generateOAuthState(): Promise<string> {
    const state = randomBytes(32).toString('hex');
    const hashedState = this.hashToken(state);

    // Clean up expired states first
    await OAuthState.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    // Create new state
    await OAuthState.create({
      state,
      hashedState,
      expiresAt: new Date(Date.now() + OAUTH_STATE_LIFETIME_MS),
    });

    return state;
  }

  // Validate OAuth state (one-time use, deletes after verification)
  async validateOAuthState(state: string): Promise<boolean> {
    const hashedState = this.hashToken(state);

    const stateRecord = await OAuthState.findOne({
      where: { hashedState },
    });

    if (!stateRecord) {
      return false;
    }

    // Check if expired
    if (stateRecord.isExpired()) {
      await OAuthState.destroy({ where: { id: stateRecord.id } });
      return false;
    }

    // Delete state after use (one-time use)
    await OAuthState.destroy({ where: { id: stateRecord.id } });

    return true;
  }
}

export default new AuthService();
