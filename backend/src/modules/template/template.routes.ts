import { Router } from 'express';
const multer = require('multer');
import templateController from './template.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

/**
 * @route   POST /api/template/upload
 * @desc    Upload template image
 * @access  Private
 */
router.post(
    '/upload',
    authenticate,
    upload.single('file'),
    templateController.uploadTemplate
);

/**
 * @route   GET /api/template
 * @desc    Get user's template images
 * @access  Private
 * @query   analyzed=true/false (optional)
 */
router.get('/', authenticate, templateController.getTemplates);

/**
 * @route   GET /api/template/:id
 * @desc    Get template by ID
 * @access  Private
 */
router.get('/:id', authenticate, templateController.getTemplateById);

/**
 * @route   DELETE /api/template/:id
 * @desc    Delete template
 * @access  Private
 */
router.delete('/:id', authenticate, templateController.deleteTemplate);

export default router;
