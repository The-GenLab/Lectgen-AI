import { Router } from 'express';
import multer from 'multer';
import speechController from './speech.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
});

router.post('/transcribe', authenticate, upload.single('audio'), speechController.transcribe);

export default router;
