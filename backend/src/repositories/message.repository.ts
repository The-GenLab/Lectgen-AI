import Message, { MessageCreationAttributes, MessageAttributes } from '../models/Message';
import Conversation from '../models/Conversation';
import { Op } from 'sequelize';

class MessageRepository {
  // Create new message
  async create(messageData: MessageCreationAttributes): Promise<Message> {
    return await Message.create(messageData);
  }

  // Find message by ID
  async findById(id: string): Promise<Message | null> {
    return await Message.findByPk(id, {
      include: [{ model: Conversation, as: 'conversation' }],
    });
  }

  // Find all messages in a conversation
  async findByConversationId(conversationId: string): Promise<Message[]> {
    return await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
    });
  }

  // Find messages with pagination
  async findByConversationIdPaginated(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    const { rows: messages, count: total } = await Message.findAndCountAll({
      where: { conversationId },
      limit,
      offset,
      order: [['createdAt', 'ASC']],
    });
    return { messages, total };
  }

  // Find messages by type
  async findByMessageType(
    conversationId: string,
    messageType: 'TEXT' | 'AUDIO' | 'IMAGE'
  ): Promise<Message[]> {
    return await Message.findAll({
      where: { conversationId, messageType },
      order: [['createdAt', 'ASC']],
    });
  }

  // Find user messages (USER role only)
  async findUserMessages(conversationId: string): Promise<Message[]> {
    return await Message.findAll({
      where: { conversationId, role: 'USER' },
      order: [['createdAt', 'ASC']],
    });
  }

  // Find assistant messages (ASSISTANT role only)
  async findAssistantMessages(conversationId: string): Promise<Message[]> {
    return await Message.findAll({
      where: { conversationId, role: 'ASSISTANT' },
      order: [['createdAt', 'ASC']],
    });
  }

  // Update message
  async update(id: string, updateData: Partial<MessageAttributes>): Promise<Message | null> {
    const message = await this.findById(id);
    if (!message) return null;
    return await message.update(updateData);
  }

  // Delete message
  async delete(id: string): Promise<boolean> {
    const result = await Message.destroy({ where: { id } });
    return result > 0;
  }

  // Delete all messages in a conversation
  async deleteByConversationId(conversationId: string): Promise<number> {
    return await Message.destroy({ where: { conversationId } });
  }

  // Count messages in conversation
  async countByConversationId(conversationId: string): Promise<number> {
    return await Message.count({ where: { conversationId } });
  }

  // Find messages with audio URLs (for MinIO cleanup)
  async findMessagesWithAudio(): Promise<Message[]> {
    return await Message.findAll({
      where: {
        audioUrl: {
          [Op.ne]: null,
        },
      },
    });
  }

  // Find messages with image URLs (for MinIO cleanup)
  async findMessagesWithImages(): Promise<Message[]> {
    return await Message.findAll({
      where: {
        imageUrl: {
          [Op.ne]: null,
        },
      },
    });
  }

  // Find messages with PDF URLs (for MinIO cleanup)
  async findMessagesWithPDFs(): Promise<Message[]> {
    return await Message.findAll({
      where: {
        pdfUrl: {
          [Op.ne]: null,
        },
      },
    });
  }

  // Get total slides generated count
  async getTotalSlidesGenerated(): Promise<number> {
    const result = await Message.sum('slideCount', {
      where: {
        slideCount: {
          [Op.ne]: null,
        },
      },
    });
    return result || 0;
  }

  // Search messages by content
  async searchByContent(searchTerm: string, limit: number = 50): Promise<Message[]> {
    return await Message.findAll({
      where: {
        [Op.or]: [
          {
            contentText: {
              [Op.iLike]: `%${searchTerm}%`,
            },
          },
          {
            transcript: {
              [Op.iLike]: `%${searchTerm}%`,
            },
          },
        ],
      },
      limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: Conversation, as: 'conversation' }],
    });
  }

  // Get messages created in date range
  async findByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    return await Message.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }
}

export default new MessageRepository();
