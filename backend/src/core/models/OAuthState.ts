import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OAuthStateAttributes {
  id: string;
  state: string;
  hashedState: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OAuthStateCreationAttributes extends Optional<OAuthStateAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class OAuthState extends Model<OAuthStateAttributes, OAuthStateCreationAttributes> implements OAuthStateAttributes {
  public id!: string;
  public state!: string;
  public hashedState!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}

OAuthState.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    state: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    hashedState: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'oauth_states',
    timestamps: true,
    indexes: [
      { fields: ['state'], unique: true },
      { fields: ['hashedState'], unique: true },
      { fields: ['expiresAt'] },
    ],
  }
);

export default OAuthState;
