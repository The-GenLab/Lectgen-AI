import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class AuthService {
  // Khóa bí mật dùng để ký và xác thực JWT
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;

  // Thời gian hết hạn của JWT
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || JWT.DEFAULT_EXPIRES_IN;

  // Số vòng salt dùng cho bcrypt khi hash mật khẩu
  private readonly SALT_ROUNDS = JWT.SALT_ROUNDS;

  /**
   * Tạo JWT token sau khi người dùng đăng nhập hoặc đăng ký thành công
   * Payload chỉ chứa các thông tin cần thiết để định danh và phân quyền
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as any);
  }

  // Xác thực JWT token gửi từ client
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash mật khẩu người dùng trước khi lưu vào database
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // So sánh mật khẩu người dùng nhập vào với mật khẩu đã được hash trong database
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Kiểm tra email đã tồn tại trong hệ thống hay chưa
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    return !!user;
  }

  // Đăng ký tài khoản mới
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Kiểm tra email đã được đăng ký hay chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Kiểm tra độ dài mật khẩu để tăng bảo mật
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    // Hash mật khẩu trước khi lưu vào database
    const passwordHash = await this.hashPassword(password);

    // Tự động lấy tên người dùng từ phần trước dấu @ của email
    const name = email.split('@')[0];

    // Tạo user mới với role và quota mặc định
    const user = await userRepository.create({
      email,
      googleId: null,
      name,
      avatarUrl: null,
      passwordHash,
      role: UserRole.FREE,
      maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
    });

    // Tạo JWT token sau khi đăng ký thành công
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Đăng nhập người dùng
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    if (!user.passwordHash) {
      throw new Error('Invalid email or password');
    }
    // Kiểm tra mật khẩu người dùng nhập vào
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Tạo JWT token sau khi đăng nhập thành công
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Lấy thông tin user từ JWT token
  async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Làm mới JWT token (refresh token)
  async refreshToken(oldToken: string): Promise<string> {
    const payload = this.verifyToken(oldToken);

    // Kiểm tra user vẫn còn tồn tại trong hệ thống
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Tạo JWT token mới
    return this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  // Tạo token reset mật khẩu (thời gian sống ngắn)
  generateResetToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'reset' },
      this.JWT_SECRET,
      { expiresIn: '15m' } // Token reset mật khẩu hết hạn sau 15 phút
    );
  }

  // Xác thực token reset mật khẩu
  verifyResetToken(token: string): { userId: string; email: string; type: string } {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; type: string };
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

  // Quên mật khẩu - tạo reset token gửi về email người dùng
  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    // Tạo token reset mật khẩu
    const resetToken = this.generateResetToken(user.id, user.email);

    return resetToken;
  }

  // Đặt lại mật khẩu bằng token reset
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Xác thực token reset mật khẩu
    const payload = this.verifyResetToken(token);

    // Tìm user theo userId trong token
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    // Hash mật khẩu mới
    const passwordHash = await this.hashPassword(newPassword);

    // Cập nhật mật khẩu mới cho user
    await userRepository.update(user.id, { passwordHash });
  }
  // Gửi email
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
  async loginOrSignupGoogle(googleUser: any): Promise<{ user: User; token: string }> {
    // Kiểm tra xem user đã tồn tại trong hệ thống chưa
    let user = await userRepository.findByEmail(googleUser.email);

    if (!user) {
      // Nếu chưa, tạo tài khoản mới
      user = await userRepository.create({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatar,
        passwordHash: '',
        role: UserRole.FREE,
        maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
      });
    }

    // Tạo JWT token cho user
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }
}

export default new AuthService();
