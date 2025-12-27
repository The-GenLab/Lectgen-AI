import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TemplateFileAttributes {
    id: string;
    userId: string;
    conversationId?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: 'image' | 'document';
    analyzed: boolean;
    styleData?: {
        colors?: string[];
        layoutType?: string;
        fontStyle?: string;
        stylePrompt?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface TemplateFileCreationAttributes extends Optional<TemplateFileAttributes, 'id' | 'conversationId' | 'fileType' | 'analyzed' | 'styleData' | 'createdAt' | 'updatedAt'> { }

class TemplateFile extends Model<TemplateFileAttributes, TemplateFileCreationAttributes> implements TemplateFileAttributes {
    public id!: string;
    public userId!: string;
    public conversationId?: string;
    public fileUrl!: string;
    public fileName!: string;
    public fileSize!: number;
    public mimeType!: string;
    public fileType!: 'image' | 'document';
    public analyzed!: boolean;
    public styleData?: {
        colors?: string[];
        layoutType?: string;
        fontStyle?: string;
        stylePrompt?: string;
    };
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

TemplateFile.init(
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
        conversationId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'conversations',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        fileUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileType: {
            type: DataTypes.ENUM('image', 'document'),
            defaultValue: 'image',
            allowNull: false,
        },
        analyzed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        styleData: {
            type: DataTypes.JSONB,
            allowNull: true,
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
        tableName: 'template_files',
        timestamps: true,
    }
);

export default TemplateFile;
