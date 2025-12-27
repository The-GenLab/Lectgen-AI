import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Session attributes
export interface SessionAttributes {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface SessionCreationAttributes
  extends Optional<SessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Session model - lưu refresh token trong database
class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: string;
  public userId!: string;
  public refreshToken!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to check if session is expired
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

Session.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE', // Xóa session khi user bị xóa
    },
    refreshToken: {
      type: DataTypes.STRING(128), // crypto.randomBytes(64).toString('hex') tạo chuỗi 128 ký tự
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
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
    tableName: 'sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['refreshToken'],
        unique: true,
      },
      {
        fields: ['expiresAt'],
      },
    ],
  }
);

export default Session;
