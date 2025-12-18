import { Request, Response } from 'express';
import speechService from './speech.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

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

            const transcript = await speechService.transcribeAudio({
                file,
                model,
                language,
                prompt,
                userRole: req.user.role,
            });

            return successResponse(res, { transcript }, 'Transcription successful');
        } catch (error: any) {
            return errorResponse(res, error.message || 'Failed to transcribe audio', 500);
        }
    }
}

export default new SpeechController();
