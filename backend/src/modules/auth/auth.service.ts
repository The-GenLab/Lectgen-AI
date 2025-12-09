import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userRepository } from '../../core/repositories';
import User from '../../core/models/User';
import { RegisterData, LoginData, TokenPayload, UserRole, JWT, QUOTA } from '../../shared/constants';

class AuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || JWT.DEFAULT_SECRET;
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || JWT.DEFAULT_EXPIRES_IN;
  private readonly SALT_ROUNDS = JWT.SALT_ROUNDS;

  // Generate JWT token
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as any);
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Compare password
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await userRepository.create({
      email,
      passwordHash,
      role: UserRole.FREE,
      maxSlidesPerMonth: QUOTA.FREE_USER_MAX_SLIDES,
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Login user
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const { email, password } = data;

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await userRepository.findById(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Refresh token
  async refreshToken(oldToken: string): Promise<string> {
    const payload = this.verifyToken(oldToken);
    
    // Verify user still exists
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token
    return this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

export default new AuthService();
