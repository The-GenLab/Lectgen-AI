import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// User attributes
export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  role: 'FREE' | 'VIP' | 'ADMIN';
  slidesGenerated: number;
  maxSlidesPerMonth: number;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'slidesGenerated' | 'maxSlidesPerMonth' | 'subscriptionExpiresAt' | 'createdAt' | 'updatedAt'> {}

// User model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'FREE' | 'VIP' | 'ADMIN';
  public slidesGenerated!: number;
  public maxSlidesPerMonth!: number;
  public subscriptionExpiresAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check if user can generate slides
  public canGenerateSlides(): boolean {
    if (this.role === 'VIP' || this.role === 'ADMIN') {
      return true;
    }
    return this.slidesGenerated < this.maxSlidesPerMonth;
  }

  // Helper method to check if subscription is active
  public isSubscriptionActive(): boolean {
    if (this.role === 'FREE') return false;
    if (!this.subscriptionExpiresAt) return false;
    return new Date() < this.subscriptionExpiresAt;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('FREE', 'VIP', 'ADMIN'),
      allowNull: false,
      defaultValue: 'FREE',
    },
    slidesGenerated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxSlidesPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5, // FREE users get 5 slides/month
    },
    subscriptionExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
