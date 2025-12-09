import { conversationRepository, messageRepository, userRepository } from '../../core/repositories';
import Conversation from '../../core/models/Conversation';
import Message from '../../core/models/Message';

class ConversationService {
  // Create new conversation
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const conversation = await conversationRepository.create({
      userId,
      title: title || 'New Conversation',
    });
    return conversation;
  }

  // Get conversation with messages
  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      return null;
    }

    // Check ownership
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    return conversation;
  }

  // Get all conversations for user
  async getUserConversations(userId: string, limit: number = 50, offset: number = 0) {
    return await conversationRepository.findByUserId(userId, limit, offset);
  }

  // Update conversation title
  async updateConversationTitle(conversationId: string, userId: string, title: string): Promise<Conversation | null> {
    const conversation = await conversationRepository.findByIdLite(conversationId);

    if (!conversation) {
      return null;
    }

    // Check ownership
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    return await conversationRepository.updateTitle(conversationId, title);
  }

  // Delete conversation
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await conversationRepository.findByIdLite(conversationId);

    if (!conversation) {
      return false;
    }

    // Check ownership
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    return await conversationRepository.delete(conversationId);
  }

  // Auto-generate conversation title from first message
  async autoGenerateTitle(conversationId: string, firstMessage: string): Promise<void> {
    const maxLength = 50;
    let title = firstMessage.substring(0, maxLength);
    
    if (firstMessage.length > maxLength) {
      title += '...';
    }

    await conversationRepository.updateTitle(conversationId, title);
  }
}

export default new ConversationService();
