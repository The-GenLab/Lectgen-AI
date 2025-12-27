import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userRepository, sessionRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';
import { sendResetPasswordEmail } from '../../core/config/email';

class AuthService {
  // Secret key dùng để ký và verify JWT 
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;

  // Thời gian hết hạn của access token
  private readonly ACCESS_TOKEN_EXPIRES_IN: string = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

  // Thời gian hết hạn của refresh token
  private readonly REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  // Số vòng salt dùng cho bcrypt khi hash password
  private readonly SALT_ROUNDS = JWT.SALT_ROUNDS;

  /**
   * Tạo Access Token JWT sau khi người dùng đăng nhập / đăng ký thành công
   * Payload chỉ chứa các thông tin cần thiết để định danh và phân quyền
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    } as any);
  }

  /**
   * Tạo Refresh Token - chuỗi ngẫu nhiên lưu trong database
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Tính thời gian hết hạn của refresh token (7 ngày)
   */
  getRefreshTokenExpiryDate(): Date {
    const expiryDate = new Date();
    // Parse refresh token expiry (e.g., "7d" -> 7 days)
    const days = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('d', ''));
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  }

  //Xác thực JWT token gửi từ client
 
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  //Hash mật khẩu người dùng trước khi lưu vào database
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  
  // So sánh mật khẩu người dùng nhập vào với password đã hash trong database
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  //Kiểm tra email đã tồn tại trong hệ thống hay chưa
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    return !!user;
  }

  //Đăng ký tài khoản mới
  async register(data: RegisterData): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    // Kiểm tra email đã được đăng ký hay chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate độ dài mật khẩu (tối thiểu 8 ký tự theo yêu cầu)
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash mật khẩu trước khi lưu DB
    const passwordHash = await this.hashPassword(password);

    // Tự động lấy name từ email (phần trước dấu @)
    const name = email.split('@')[0];

    // Tạo user mới với role và quota mặc định
    const user = await userRepository.create({
      email,
      name,
      avatarUrl: null,
      passwordHash,
      role: UserRole.FREE,
      maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
    });

    // Tạo access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Tạo refresh token và lưu vào database
    const refreshToken = this.generateRefreshToken();
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { user, accessToken, refreshToken };
  }

  // Đăng nhập người dùng
  async login(data: LoginData): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    // Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Kiểm tra nếu user đăng nhập bằng Google (không có password)
    if (!user.passwordHash) {
      throw new Error('This account uses Google login. Please login with Google.');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Tạo access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Tạo refresh token và lưu vào database
    const refreshToken = this.generateRefreshToken();
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { user, accessToken, refreshToken };
  }

  //Lấy thông tin user từ JWT token
  async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  //Làm mới JWT token (refresh token)
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Tìm session với refresh token
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    
    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Kiểm tra user vẫn tồn tại trong hệ thống
    const user = await userRepository.findById(session.userId);
    if (!user) {
      // Xóa session không hợp lệ
      await sessionRepository.delete(session.id);
      throw new Error('User not found');
    }

    // Tạo access token mới
    const newAccessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Tạo refresh token mới và cập nhật session
    const newRefreshToken = this.generateRefreshToken();
    
    // Xóa session cũ và tạo session mới
    await sessionRepository.delete(session.id);
    await sessionRepository.create({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: this.getRefreshTokenExpiryDate(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Đăng xuất người dùng (xóa refresh token)
  async logout(refreshToken: string): Promise<void> {
    await sessionRepository.deleteByRefreshToken(refreshToken);
  }

  // Đăng xuất tất cả thiết bị
  async logoutAll(userId: string): Promise<void> {
    await sessionRepository.deleteAllByUserId(userId);
  }

  // Forgot password - tạo reset token và gửi email
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      // Nhưng vẫn throw error để client biết
      throw new Error('If this email exists, a password reset link has been sent.');
    }

    // Tạo reset token (chuỗi ngẫu nhiên)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash reset token trước khi lưu vào database
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Thời gian hết hạn: 10 phút
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setMinutes(resetPasswordExpires.getMinutes() + 10);

    // Lưu token đã hash và thời gian hết hạn vào database
    await userRepository.update(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    // Tạo URL reset password (với token chưa hash)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Gửi email
    const emailSent = await sendResetPasswordEmail(user.email, user.name, resetUrl);
    
    if (!emailSent) {
      // Nếu gửi email thất bại, xóa token đã lưu
      await userRepository.update(user.id, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      throw new Error('Failed to send reset password email. Please try again later.');
    }
  }

  // Reset password với token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash token từ URL để so sánh với token trong database
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm user với token và còn hạn
    const user = await userRepository.findByResetToken(resetPasswordToken);

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate độ dài mật khẩu
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash mật khẩu mới
    const passwordHash = await this.hashPassword(newPassword);

    // Cập nhật password và xóa reset token
    await userRepository.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  // Xử lý Google OAuth login/register
  async handleGoogleAuth(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): Promise<{ user: User; accessToken: string; refreshToken: string; isNewUser: boolean }> {
    let user = await userRepository.findByEmail(googleUser.email);
    let isNewUser = false;

    if (user) {
      // User đã tồn tại, cập nhật googleId nếu chưa có
      if (!user.googleId) {
        user = await userRepository.update(user.id, {
          googleId: googleUser.googleId,
        }) as User;
      }
    } else {
      // Tạo user mới
      user = await userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        passwordHash: '', // Google OAuth user không cần password
        googleId: googleUser.googleId,
        role: UserRole.FREE,
        maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
      });
      isNewUser = true;
    }

    // Tạo access token
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Tạo refresh token
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
