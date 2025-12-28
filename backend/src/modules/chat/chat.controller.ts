import { Request, Response } from 'express';
import chatService from './chat.service';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { MessageType } from '../../shared/constants';
import usageTrackingService from '../../shared/services/usageTracking.service';
import { ActionStatus } from '../../core/models/UsageLog';

class ChatController {
  /**
   * Send message and get AI response
   * POST /api/chat/send
   * 
   * Request Body:
   * {
   *   conversationId?: string (optional, create new if not provided)
   *   messageType: 'TEXT' | 'AUDIO' | 'IMAGE'
   *   contentText?: string (for TEXT type)
   *   audioUrl?: string (for AUDIO type)
   *   imageUrl?: string (for IMAGE type)
   *   transcript?: string (for AUDIO type)
   *   styleAnalysis?: object (for IMAGE type)
   * }
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     conversation: { id, title, ... },
   *     userMessage: { id, role: 'USER', contentText, ... },
   *     assistantMessage: { id, role: 'ASSISTANT', contentText (latex), slideCount, ... }
   *   }
   * }
   */
  async sendMessage(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const {
        conversationId,
        messageType,
        contentText,
        audioUrl,
        imageUrl,
        transcript,
        styleAnalysis,
      } = req.body;

      // Validate messageType
      if (!messageType || !['TEXT', 'AUDIO', 'IMAGE'].includes(messageType)) {
        return errorResponse(res, 'Invalid messageType. Must be TEXT, AUDIO, or IMAGE', 400);
      }

      // Validate required fields based on messageType
      if (messageType === MessageType.TEXT && !contentText) {
        return errorResponse(res, 'contentText is required for TEXT messages', 400);
      }
      if (messageType === MessageType.AUDIO && (!audioUrl || !transcript)) {
        return errorResponse(res, 'audioUrl and transcript are required for AUDIO messages', 400);
      }
      if (messageType === MessageType.IMAGE && !imageUrl) {
        return errorResponse(res, 'imageUrl is required for IMAGE messages', 400);
      }

      console.log('[ChatController] Processing chat message:', {
        userId: req.user.id,
        conversationId,
        messageType,
      });

      // Send message and get AI response
      const result = await chatService.sendMessage({
        userId: req.user.id,
        conversationId,
        messageType: messageType as MessageType,
        contentText,
        audioUrl,
        imageUrl,
        transcript,
        styleAnalysis,
      });

      const duration = Date.now() - startTime;

      // Log usage for admin tracking
      await usageTrackingService.logAIGeneration({
        userId: req.user.id,
        tokensUsed: 2000, // TODO: Get actual token count
        durationMs: duration,
        status: ActionStatus.SUCCESS,
        metadata: {
          conversationId: result.conversation.id,
          messageType,
          slideCount: result.assistantMessage.slideCount || 0,
        },
      });

      console.log('[ChatController] Chat completed in', duration, 'ms');

      return successResponse(
        res,
        {
          conversation: result.conversation,
          userMessage: result.userMessage,
          assistantMessage: result.assistantMessage,
        },
        'Message sent and AI response generated successfully'
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[ChatController] Error:', error);

      // Log failed usage
      if (req.user) {
        await usageTrackingService.logAIGeneration({
          userId: req.user.id,
          durationMs: duration,
          status: ActionStatus.FAILED,
          errorMessage: error.message,
        });
      }

      return errorResponse(res, error.message || 'Failed to send message', 500);
    }
  }

  /**
   * Get messages for a conversation
   * GET /api/chat/conversations/:id/messages
   */
  async getMessages(req: Request, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const messages = await chatService.getConversationMessages(id, req.user.id);

      return successResponse(res, { messages }, 'Messages retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Failed to get messages', 500);
    }
  }
}

export default new ChatController();

