import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SessionAttributes {
  id: string;
  userId: string;
  jti: string;
  hashedToken: string;
  rotatedFrom: string | null;
  userAgent: string | null;
  ip: string | null;
  valid: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'rotatedFrom' | 'userAgent' | 'ip' | 'valid' | 'createdAt' | 'updatedAt'> {}

class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: string;
  public userId!: string;
  public jti!: string;
  public hashedToken!: string;
  public rotatedFrom!: string | null;
  public userAgent!: string | null;
  public ip!: string | null;
  public valid!: boolean;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Check if session is expired
  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  // Check if session can be used
  public isUsable(): boolean {
    return this.valid && !this.isExpired();
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
      onDelete: 'CASCADE',
    },
    jti: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    hashedToken: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    rotatedFrom: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    valid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sessions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['jti'], unique: true },
      { fields: ['hashedToken'], unique: true },
      { fields: ['rotatedFrom'] },
      { fields: ['valid'] },
      { fields: ['expiresAt'] },
    ],
  }
);

export default Session;
