import { Router } from 'express';
import multer from 'multer';
import fileController from './file.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post('/avatar', authenticate, upload.single('avatar'), fileController.uploadAvatar);
router.delete('/avatar', authenticate, fileController.deleteAvatar);

// Public route để lấy ảnh: GET /api/files/:bucket/avatars/:filename
router.get('/:bucket/avatars/:filename', fileController.getAvatar);

export default router;
