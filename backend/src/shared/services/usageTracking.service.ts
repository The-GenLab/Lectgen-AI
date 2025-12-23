import { usageLogRepository, userRepository } from '../../core/repositories';
import { ActionType, ActionStatus } from '../../core/models/UsageLog';

interface LogUsageParams {
    userId: string;
    actionType: ActionType;
    tokensUsed?: number;
    durationMs?: number;
    cost?: number;
    status: ActionStatus;
    errorMessage?: string;
    metadata?: object;
}

class UsageTrackingService {
    /**
     * Log a usage event
     */
    async logUsage(params: LogUsageParams): Promise<void> {
        try {
            await usageLogRepository.create({
                userId: params.userId,
                actionType: params.actionType,
                tokensUsed: params.tokensUsed || null,
                durationMs: params.durationMs || null,
                cost: params.cost || null,
                status: params.status,
                errorMessage: params.errorMessage || null,
                metadata: params.metadata || null,
            });
        } catch (error) {
            // Don't throw error to avoid breaking the main flow
            console.error('Failed to log usage:', error);
        }
    }

    /**
     * Log AI generation usage
     */
    async logAIGeneration(params: {
        userId: string;
        tokensUsed?: number;
        durationMs: number;
        status: ActionStatus;
        errorMessage?: string;
        metadata?: { model?: string; prompt?: string; slideCount?: number };
    }): Promise<void> {
        await this.logUsage({
            userId: params.userId,
            actionType: ActionType.AI_GENERATION,
            tokensUsed: params.tokensUsed,
            durationMs: params.durationMs,
            cost: params.tokensUsed ? this.estimateCost(params.tokensUsed, 'ai-generation') : undefined,
            status: params.status,
            errorMessage: params.errorMessage,
            metadata: params.metadata,
        });

        // Increment user's slidesGenerated counter if successful
        if (params.status === ActionStatus.SUCCESS) {
            try {
                await userRepository.incrementSlidesGenerated(params.userId);
                console.log(`[UsageTracking] Incremented slidesGenerated for user ${params.userId}`);
            } catch (error) {
                console.error('[UsageTracking] Failed to increment slidesGenerated:', error);
            }
        }
    }

    /**
     * Log speech-to-text usage
     */
    async logSpeechToText(params: {
        userId: string;
        durationMs: number;
        status: ActionStatus;
        errorMessage?: string;
        metadata?: { model?: string; language?: string; audioSize?: number };
    }): Promise<void> {
        await this.logUsage({
            userId: params.userId,
            actionType: ActionType.SPEECH_TO_TEXT,
            durationMs: params.durationMs,
            cost: this.estimateCost(0, 'speech-to-text'),
            status: params.status,
            errorMessage: params.errorMessage,
            metadata: params.metadata,
        });
    }

    /**
     * Log PDF generation usage
     */
    async logPDFGeneration(params: {
        userId: string;
        durationMs: number;
        status: ActionStatus;
        errorMessage?: string;
        metadata?: { slideCount?: number; fileSize?: number };
    }): Promise<void> {
        await this.logUsage({
            userId: params.userId,
            actionType: ActionType.PDF_GENERATION,
            durationMs: params.durationMs,
            cost: 0, // PDF generation is free
            status: params.status,
            errorMessage: params.errorMessage,
            metadata: params.metadata,
        });
    }

    /**
     * Estimate cost based on tokens and action type
     * (Simplified pricing - adjust based on actual API pricing)
     */
    private estimateCost(tokens: number, actionType: string): number {
        switch (actionType) {
            case 'ai-generation':
                // Example: $0.002 per 1000 tokens (adjust based on Gemini pricing)
                return (tokens / 1000) * 0.002;
            case 'speech-to-text':
                // Example: $0.006 per minute (Whisper pricing)
                return 0.006;
            default:
                return 0;
        }
    }
}

export default new UsageTrackingService();
