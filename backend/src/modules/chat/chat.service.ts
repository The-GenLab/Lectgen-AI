import { conversationRepository, messageRepository, userRepository } from '../../core/repositories';
import Conversation from '../../core/models/Conversation';
import Message from '../../core/models/Message';
import { MessageRole, MessageType } from '../../shared/constants';
import aiService from '../ai/ai.service';
import conversationService from '../conversation/conversation.service';
import { storageService } from '../storage';
import queueService from '../../shared/services/queue.service';
import adminSettingsService from '../admin/admin-settings.service';

interface SendMessageParams {
  userId: string;
  conversationId?: string;
  messageType: MessageType;
  contentText?: string;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  styleAnalysis?: object;
}

interface ChatResponse {
  conversation: Conversation;
  userMessage: Message;
  assistantMessage: Message;
}

class ChatService {
  /**
   * Main chat method: Send user message and get AI response
   * Flow:
   * 1. Create/get conversation
   * 2. Save user message
   * 3. Generate LaTeX from AI
   * 4. Save assistant message with LaTeX
   * 5. Return both messages + conversation
   */
  async sendMessage(params: SendMessageParams): Promise<ChatResponse> {
    const {
      userId,
      conversationId,
      messageType,
      contentText,
      audioUrl,
      imageUrl,
      transcript,
      styleAnalysis,
    } = params;

    // 1. Get or create conversation
    let conversation: Conversation;
    if (conversationId) {
      const existingConv = await conversationRepository.findByIdLite(conversationId);
      if (!existingConv || existingConv.userId !== userId) {
        throw new Error('Conversation not found or unauthorized');
      }
      conversation = existingConv;
    } else {
      // Create new conversation
      const title = contentText 
        ? (contentText.substring(0, 50) + (contentText.length > 50 ? '...' : ''))
        : 'New Conversation';
      conversation = await conversationService.createConversation(userId, title);
    }

    // 2. Save user message
    const userMessage = await messageRepository.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      messageType,
      contentText,
      audioUrl,
      imageUrl,
      transcript,
      styleAnalysis,
    });

    // 3. Determine prompt for AI
    let prompt = '';
    if (messageType === MessageType.TEXT && contentText) {
      prompt = contentText;
    } else if (messageType === MessageType.AUDIO && transcript) {
      prompt = transcript;
    } else if (messageType === MessageType.IMAGE) {
      // For IMAGE type, combine topic with style analysis
      if (styleAnalysis) {
        const stylePrompt = this.buildStylePrompt(styleAnalysis);
        prompt = contentText 
          ? `${contentText}\n\nStyle requirements: ${stylePrompt}`
          : `Create a presentation with this style: ${stylePrompt}`;
      } else {
        // If no style analysis, just use contentText
        prompt = contentText || 'Create a presentation based on the uploaded template';
      }
    }

    if (!prompt) {
      throw new Error('Unable to generate prompt from message');
    }

    console.log('[ChatService] Generated prompt for AI:', prompt.substring(0, 200));

    // Get user to check role
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 4. Generate LaTeX from AI (with priority queue if enabled)
    console.log('[ChatService] Generating LaTeX for prompt:', prompt.substring(0, 100));
    
    // Get VIP config
    const settings = await adminSettingsService.getSettings();
    const { priorityQueue, processingMultiplier } = settings.vipConfig;

    let latexData;
    
    // If priority queue is enabled, use queue service
    if (priorityQueue) {
      console.log(`[ChatService] Using priority queue (multiplier: ${processingMultiplier})`);
      latexData = await queueService.enqueue({
        userId,
        userRole: user.role,
        execute: () => aiService.generateLatexContent(prompt),
      });
    } else {
      // If priority queue is disabled, process immediately
      latexData = await aiService.generateLatexContent(prompt);
    }

    // Apply processing multiplier for VIP users (affects retry/timeout logic)
    // The multiplier mainly affects queue priority (calculated in queue service)
    if ((user.role === 'VIP' || user.role === 'ADMIN') && processingMultiplier > 1) {
      console.log(`[ChatService] VIP user processing with multiplier: ${processingMultiplier}x`);
    }

    // 5. Upload LaTeX file to MinIO and save both code + URL
    const latexFileName = `${conversation.id}-${Date.now()}.tex`;
    const latexBuffer = Buffer.from(latexData.latex_code, 'utf-8');
    
    const objectName = await storageService.uploadFile(
      'generated-pdfs',
      latexBuffer,
      latexFileName,
      'text/plain'
    );

    // Save relative path: /generated-pdfs/uuid-filename.tex
    const latexFileUrl = `/generated-pdfs/${objectName}`;
    console.log('[ChatService] LaTeX saved to MinIO:', latexFileUrl);

    // 6. Save assistant message with BOTH raw LaTeX (for display) and file URL
    // contentText: raw LaTeX code (for display/copy)
    // pdfUrl: file URL in MinIO (for download)
    const assistantMessage = await messageRepository.create({
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      messageType: MessageType.TEXT,
      contentText: latexData.latex_code, // Keep raw LaTeX code
      pdfUrl: latexFileUrl, // Save MinIO URL for download
      slideCount: this.countSlides(latexData.latex_code),
    });

    // 6. Update conversation title if it's the first message
    if (!conversationId) {
      await conversationService.autoGenerateTitle(conversation.id, prompt);
    }

    return {
      conversation,
      userMessage,
      assistantMessage,
    };
  }

  /**
   * Build style prompt from styleAnalysis object
   */
  private buildStylePrompt(styleAnalysis: any): string {
    const parts: string[] = [];
    
    if (styleAnalysis.colorScheme) {
      parts.push(`Color scheme: ${styleAnalysis.colorScheme}`);
    }
    if (styleAnalysis.layoutType) {
      parts.push(`Layout: ${styleAnalysis.layoutType}`);
    }
    if (styleAnalysis.colors && Array.isArray(styleAnalysis.colors)) {
      parts.push(`Colors: ${styleAnalysis.colors.join(', ')}`);
    }
    if (styleAnalysis.traits && Array.isArray(styleAnalysis.traits)) {
      const traitLabels = styleAnalysis.traits.map((t: any) => t.label || t).join(', ');
      parts.push(`Style traits: ${traitLabels}`);
    }

    return parts.join('. ');
  }

  /**
   * Count number of slides in LaTeX code
   */
  private countSlides(latexCode: string): number {
    const frameMatches = latexCode.match(/\\begin\{frame\}/g);
    return frameMatches ? frameMatches.length : 0;
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<Message[]> {
    // Verify ownership
    const conversation = await conversationRepository.findByIdLite(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found or unauthorized');
    }

    return await messageRepository.findByConversationId(conversationId);
  }
}

export default new ChatService();

