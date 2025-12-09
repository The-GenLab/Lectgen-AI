import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Conversation from './Conversation';

// Message attributes
export interface MessageAttributes {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE';
  contentText: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  transcript: string | null;
  styleAnalysis: object | null;
  pdfUrl: string | null;
  slideCount: number | null;
  createdAt: Date;
}

// Optional fields for creation
export interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    'id' | 'contentText' | 'audioUrl' | 'imageUrl' | 'transcript' | 'styleAnalysis' | 'pdfUrl' | 'slideCount' | 'createdAt'
  > {}

// Message model
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public conversationId!: string;
  public role!: 'USER' | 'ASSISTANT';
  public messageType!: 'TEXT' | 'AUDIO' | 'IMAGE';
  public contentText!: string | null;
  public audioUrl!: string | null;
  public imageUrl!: string | null;
  public transcript!: string | null;
  public styleAnalysis!: object | null;
  public pdfUrl!: string | null;
  public slideCount!: number | null;
  public readonly createdAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('USER', 'ASSISTANT'),
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('TEXT', 'AUDIO', 'IMAGE'),
      allowNull: false,
    },
    contentText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transcript: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    styleAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slideCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: false, // Only createdAt, no updatedAt for messages
  }
);

// Associations
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

export default Message;
