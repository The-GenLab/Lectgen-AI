import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Action types for usage tracking
export enum ActionType {
    AI_GENERATION = 'AI_GENERATION',
    SPEECH_TO_TEXT = 'SPEECH_TO_TEXT',
    PDF_GENERATION = 'PDF_GENERATION',
}

// Status of the action
export enum ActionStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PENDING = 'PENDING',
}

// UsageLog attributes
export interface UsageLogAttributes {
    id: string;
    userId: string;
    actionType: ActionType;
    tokensUsed: number | null;
    durationMs: number | null;
    cost: number | null;
    status: ActionStatus;
    errorMessage: string | null;
    metadata: object | null; // Additional data like model used, language, etc.
    createdAt: Date;
    updatedAt: Date;
}

// Optional fields for creation
export interface UsageLogCreationAttributes
    extends Optional<UsageLogAttributes, 'id' | 'tokensUsed' | 'durationMs' | 'cost' | 'errorMessage' | 'metadata' | 'createdAt' | 'updatedAt'> { }

// UsageLog model
class UsageLog extends Model<UsageLogAttributes, UsageLogCreationAttributes> implements UsageLogAttributes {
    public id!: string;
    public userId!: string;
    public actionType!: ActionType;
    public tokensUsed!: number | null;
    public durationMs!: number | null;
    public cost!: number | null;
    public status!: ActionStatus;
    public errorMessage!: string | null;
    public metadata!: object | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

UsageLog.init(
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
        actionType: {
            type: DataTypes.ENUM(...Object.values(ActionType)),
            allowNull: false,
        },
        tokensUsed: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Number of tokens used for AI API calls',
        },
        durationMs: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration of the action in milliseconds',
        },
        cost: {
            type: DataTypes.DECIMAL(10, 6),
            allowNull: true,
            comment: 'Estimated cost in USD',
        },
        status: {
            type: DataTypes.ENUM(...Object.values(ActionStatus)),
            allowNull: false,
            defaultValue: ActionStatus.SUCCESS,
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional data like model, language, prompt, etc.',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'usage_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['actionType'],
            },
            {
                fields: ['createdAt'],
            },
            {
                fields: ['userId', 'createdAt'],
            },
        ],
    }
);

export default UsageLog;
