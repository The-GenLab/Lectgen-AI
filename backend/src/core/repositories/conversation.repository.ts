import Conversation, { ConversationCreationAttributes, ConversationAttributes } from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

class ConversationRepository {
  // Create new conversation
  async create(conversationData: ConversationCreationAttributes): Promise<Conversation> {
    return await Conversation.create(conversationData);
  }

  // Find conversation by ID
  async findById(id: string): Promise<Conversation | null> {
    return await Conversation.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
        { model: Message, as: 'messages', order: [['createdAt', 'ASC']] },
      ],
    });
  }

  // Find conversation by ID without messages (lighter query)
  async findByIdLite(id: string): Promise<Conversation | null> {
    return await Conversation.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }],
    });
  }

  // Find all conversations for a user
  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<{ conversations: Conversation[]; total: number }> {
    const { rows: conversations, count: total } = await Conversation.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: Message,
          as: 'messages',
          attributes: ['id', 'role', 'messageType', 'contentText', 'createdAt'],
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    return { conversations, total };
  }

  // Find all conversations with pagination (admin)
  async findAll(limit: number = 50, offset: number = 0): Promise<{ conversations: Conversation[]; total: number }> {
    const { rows: conversations, count: total } = await Conversation.findAndCountAll({
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
        {
          model: Message,
          as: 'messages',
          attributes: ['id', 'role', 'messageType'],
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    return { conversations, total };
  }

  // Update conversation
  async update(id: string, updateData: Partial<ConversationAttributes>): Promise<Conversation | null> {
    const conversation = await this.findByIdLite(id);
    if (!conversation) return null;
    return await conversation.update(updateData);
  }

  // Update conversation title
  async updateTitle(id: string, title: string): Promise<Conversation | null> {
    return await this.update(id, { title });
  }

  // Delete conversation
  async delete(id: string): Promise<boolean> {
    const result = await Conversation.destroy({ where: { id } });
    return result > 0;
  }

  // Delete all conversations for a user
  async deleteByUserId(userId: string): Promise<number> {
    return await Conversation.destroy({ where: { userId } });
  }

  // Get conversation count for user
  async countByUserId(userId: string): Promise<number> {
    return await Conversation.count({ where: { userId } });
  }

  // Get total conversations count
  async count(): Promise<number> {
    return await Conversation.count();
  }
}

export default new ConversationRepository();
