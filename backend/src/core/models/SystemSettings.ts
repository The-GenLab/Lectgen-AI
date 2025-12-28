import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// SystemSettings attributes
export interface SystemSettingsAttributes {
  key: string;
  value: string; // JSON stringified value
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Optional fields for creation
export interface SystemSettingsCreationAttributes
  extends Optional<SystemSettingsAttributes, 'description' | 'createdAt' | 'updatedAt'> {}

// SystemSettings model
class SystemSettings extends Model<SystemSettingsAttributes, SystemSettingsCreationAttributes> implements SystemSettingsAttributes {
  public key!: string;
  public value!: string;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemSettings.init(
  {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'system_settings',
    timestamps: true,
  }
);

export default SystemSettings;

