import { UserRole } from '../../shared/constants';

type TranscribeParams = {
    file: Express.Multer.File;
    model?: string;
    language?: string;
    prompt?: string;
    userRole?: UserRole;
};

class SpeechService {
    private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    private readonly DEFAULT_MODEL = 'whisper-1';

    async transcribeAudio({ file, model, language, prompt }: TranscribeParams): Promise<string> {
        if (!this.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured');
        }

        const form = new FormData();

        const fileName = file.originalname || 'audio.webm';
        const fileType = file.mimetype || 'application/octet-stream';

        const audioBlob = new Blob([new Uint8Array(file.buffer)], { type: fileType });
        form.append('file', audioBlob, fileName);
        form.append('model', model || this.DEFAULT_MODEL);

        if (language) {
            form.append('language', language);
        }

        if (prompt) {
            form.append('prompt', prompt);
        }

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.OPENAI_API_KEY}`,
            },
            body: form,
        });

        const data: any = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data?.error?.message || data?.message || 'Speech-to-text failed';
            throw new Error(message);
        }

        const text = data?.text;
        if (typeof text !== 'string') {
            throw new Error('Invalid response from speech-to-text provider');
        }

        return text;
    }
}

export default new SpeechService();
