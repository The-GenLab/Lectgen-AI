import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { User } from './index';

// Payment attributes
export interface PaymentAttributes {
  id: string;
  userId: string;
  amount: number;
  planType: 'monthly' | 'yearly';
  paymentDate: Date;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    'id' | 'transactionId' | 'createdAt' | 'updatedAt'
  > {}

// Payment model
class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public userId!: string;
  public amount!: number;
  public planType!: 'monthly' | 'yearly';
  public paymentDate!: Date;
  public subscriptionStartDate!: Date;
  public subscriptionEndDate!: Date;
  public paymentMethod!: string;
  public status!: 'pending' | 'completed' | 'failed';
  public transactionId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    planType: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'momo',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'completed',
    },
    transactionId: {
      type: DataTypes.STRING,
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
    tableName: 'payments',
    timestamps: true,
  }
);

// Associations
Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Payment;

