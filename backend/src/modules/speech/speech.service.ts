import { UserRole } from '../../shared/constants';

type TranscribeParams = {
    file: Express.Multer.File;
    model?: string;
    language?: string;
    prompt?: string;
    userRole?: UserRole;
};

class SpeechService {
    private readonly DEFAULT_MODEL = 'whisper-1';
    private readonly DEFAULT_LOCAL_BASE_URL = 'http://whisper:8080';

    private getProvider(): 'openai' | 'local' {
        const provider = (process.env.STT_PROVIDER || 'openai').toLowerCase();
        return provider === 'local' ? 'local' : 'openai';
    }

    private async transcribeWithLocalWhisper(params: {
        file: Express.Multer.File;
        language?: string;
        prompt?: string;
    }): Promise<string> {
        const baseUrl = process.env.WHISPER_BASE_URL || this.DEFAULT_LOCAL_BASE_URL;
        const url = `${baseUrl.replace(/\/$/, '')}/inference`;

        const form = new FormData();

        const fileName = params.file.originalname || 'audio.webm';
        const fileType = params.file.mimetype || 'application/octet-stream';
        const audioBlob = new Blob([new Uint8Array(params.file.buffer)], { type: fileType });

        // whisper.cpp server expects field name "file"
        form.append('file', audioBlob, fileName);
        form.append('response_format', 'json');

        if (params.language) {
            form.append('language', params.language);
        }

        if (params.prompt) {
            form.append('prompt', params.prompt);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: form,
        });

        const data: any = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data?.error || data?.message || 'Local speech-to-text failed';
            throw new Error(message);
        }

        const text = data?.text;
        if (typeof text !== 'string') {
            throw new Error('Invalid response from local speech-to-text provider');
        }

        return text;
    }

    async transcribeAudio({ file, model, language, prompt }: TranscribeParams): Promise<string> {
        const provider = this.getProvider();
        if (provider === 'local') {
            return this.transcribeWithLocalWhisper({ file, language, prompt });
        }

        const openAiApiKey = process.env.OPENAI_API_KEY;
        if (!openAiApiKey) {
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
                Authorization: `Bearer ${openAiApiKey}`,
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
