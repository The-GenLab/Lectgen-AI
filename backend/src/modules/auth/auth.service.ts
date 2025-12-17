import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';

class AuthService {
  // Secret key dùng để ký và verify JWT 
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;

  // Thời gian hết hạn của JWT 
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || JWT.DEFAULT_EXPIRES_IN;

  // Số vòng salt dùng cho bcrypt khi hash password
  private readonly SALT_ROUNDS = JWT.SALT_ROUNDS;

  /**
   * Tạo JWT token sau khi người dùng đăng nhập / đăng ký thành công
   * Payload chỉ chứa các thông tin cần thiết để định danh và phân quyền
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as any);
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
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Kiểm tra email đã được đăng ký hay chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate độ dài mật khẩu (tăng bảo mật)
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters');
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

    // Kiểm tra mật khẩu
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
  async refreshToken(oldToken: string): Promise<string> {
    const payload = this.verifyToken(oldToken);

    // Kiểm tra user vẫn tồn tại trong hệ thống
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

  // Tạo reset password token (short-lived)
  generateResetToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' } // Reset token expires in 1 hour
    );
  }

  // Verify reset password token
  verifyResetToken(token: string): { userId: string; email: string; type: string } {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; type: string };
      if (payload.type !== 'reset') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  // Forgot password - generate reset token and log it (email service would send it)
  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists - but still return to prevent timing attacks
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = this.generateResetToken(user.id, user.email);
    

    return resetToken;
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify the reset token
    const payload = this.verifyResetToken(token);

    // Find user
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate password length
    if (newPassword.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user password
    await userRepository.update(user.id, { passwordHash });
  }
}

export default new AuthService();
