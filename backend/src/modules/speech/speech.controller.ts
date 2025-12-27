import { Request, Response } from 'express';
import speechService from './speech.service';
import { successResponse, errorResponse } from '../../shared/utils/response';
import usageTrackingService from '../../shared/services/usageTracking.service';
import { ActionStatus } from '../../core/models/UsageLog';

class SpeechController {
    async transcribe(req: Request, res: Response) {
        try {
            if (!req.user) {
                return errorResponse(res, 'Unauthorized', 401);
            }

            const file = req.file;
            if (!file) {
                return errorResponse(res, 'No audio file uploaded', 400);
            }

            const model = typeof req.body?.model === 'string' ? req.body.model : undefined;
            const language = typeof req.body?.language === 'string' ? req.body.language : undefined;
            const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt : undefined;

            const startTime = Date.now();

            const transcript = await speechService.transcribeAudio({
                file,
                model,
                language,
                prompt,
                userRole: req.user.role,
            });

            const duration = Date.now() - startTime;

            // Log successful usage
            await usageTrackingService.logSpeechToText({
                userId: req.user.id,
                durationMs: duration,
                status: ActionStatus.SUCCESS,
                metadata: {
                    model,
                    language,
                    audioSize: file.size,
                },
            });

            return successResponse(res, { transcript }, 'Transcription successful');
        } catch (error: any) {
            // Log failed usage
            if (req.user) {
                await usageTrackingService.logSpeechToText({
                    userId: req.user.id,
                    durationMs: 0,
                    status: ActionStatus.FAILED,
                    errorMessage: error.message,
                });
            }

            return errorResponse(res, error.message || 'Failed to transcribe audio', 500);
        }
    }
}

export default new SpeechController();
