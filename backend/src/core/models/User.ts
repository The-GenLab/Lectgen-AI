import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { UserRole, isVipOrAdmin, isFreeUser, isFutureDate, QUOTA } from '../../shared/constants';

// User attributes
export interface UserAttributes {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  passwordHash: string;
  role: UserRole;
  slidesGenerated: number;
  maxSlidesPerMonth: number;
  subscriptionExpiresAt: Date | null;
  googleId: string | null; 
  resetPasswordToken: string | null; 
  resetPasswordExpires: Date | null; 
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'slidesGenerated'
    | 'maxSlidesPerMonth'
    | 'subscriptionExpiresAt'
    | 'googleId'
    | 'resetPasswordToken'
    | 'resetPasswordExpires'
    | 'createdAt'
    | 'updatedAt'
  > {}

// User model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public name!: string;
  public avatarUrl!: string | null;
  public passwordHash!: string;
  public role!: UserRole;
  public slidesGenerated!: number;
  public maxSlidesPerMonth!: number;
  public subscriptionExpiresAt!: Date | null;
  public googleId!: string | null;
  public resetPasswordToken!: string | null;
  public resetPasswordExpires!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check if user can generate slides
  public canGenerateSlides(): boolean {
    if (isVipOrAdmin(this.role)) {
      return true;
    }
    return this.slidesGenerated < this.maxSlidesPerMonth;
  }

  // Helper method to check if subscription is active
  public isSubscriptionActive(): boolean {
    if (isFreeUser(this.role)) return false;
    return isFutureDate(this.subscriptionExpiresAt);
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '', 
    },
    role: {
      type: DataTypes.ENUM(UserRole.FREE, UserRole.VIP, UserRole.ADMIN),
      allowNull: false,
      defaultValue: UserRole.FREE,
    },
    slidesGenerated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxSlidesPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: QUOTA.DEFAULT_MAX_SLIDES,
    },
    subscriptionExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
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
