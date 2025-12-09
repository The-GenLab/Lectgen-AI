import { Request, Response } from 'express';
import conversationService from './conversation.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

class ConversationController {
  // Create new conversation
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { title } = req.body;
      const conversation = await conversationService.createConversation(req.user.id, title);

      return successResponse(res, { conversation }, 'Conversation created successfully', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to create conversation', 500);
    }
  }

  // Get all conversations for current user
  async getAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { conversations, total } = await conversationService.getUserConversations(
        req.user.id,
        limit,
        offset
      );

      return successResponse(res, { conversations, total, limit, offset }, 'Conversations retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get conversations', 500);
    }
  }

  // Get single conversation with messages
  async getById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const conversation = await conversationService.getConversation(id, req.user.id);

      if (!conversation) {
        return errorResponse(res, 'Conversation not found', 404);
      }

      return successResponse(res, { conversation }, 'Conversation retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get conversation', 500);
    }
  }

  // Update conversation title
  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        return errorResponse(res, 'Title is required', 400);
      }

      const conversation = await conversationService.updateConversationTitle(id, req.user.id, title);

      if (!conversation) {
        return errorResponse(res, 'Conversation not found', 404);
      }

      return successResponse(res, { conversation }, 'Conversation updated successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to update conversation', 500);
    }
  }

  // Delete conversation
  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const deleted = await conversationService.deleteConversation(id, req.user.id);

      if (!deleted) {
        return errorResponse(res, 'Conversation not found', 404);
      }

      return successResponse(res, null, 'Conversation deleted successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to delete conversation', 500);
    }
  }
}

export default new ConversationController();
