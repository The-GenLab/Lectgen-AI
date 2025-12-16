import { v4 as uuidv4 } from 'uuid';
import TemplateImage from '../../core/models/TemplateImage';
import { storageService } from '../storage';

interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
}

class TemplateService {
    /**
     * Upload template image to MinIO
     */
    async uploadTemplate(
        file: UploadedFile,
        userId: string,
        conversationId?: string
    ) {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error('Only JPG and PNG images are allowed');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('File size must be less than 5MB');
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        // Upload to MinIO
        const objectName = await storageService.uploadFile(
            'template-images',
            file.buffer,
            uniqueFileName,
            file.mimetype
        );

        // Generate presigned URL
        const fileUrl = await storageService.getPresignedUrl('template-images', objectName);

        // Save to database
        const templateImage = await TemplateImage.create({
            userId,
            conversationId,
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            analyzed: false,
        });

        return templateImage;
    }

    /**
     * Get templates with filters
     */
    async getTemplates(filter: {
        userId: string;
        analyzed?: boolean;
        conversationId?: string;
    }) {
        const templates = await TemplateImage.findAll({
            where: filter,
            order: [['createdAt', 'DESC']],
        });

        return templates;
    }

    /**
     * Get template by ID (with user ownership check)
     */
    async getTemplateById(id: string, userId: string) {
        const template = await TemplateImage.findOne({
            where: { id, userId },
        });

        return template;
    }

    /**
     * Delete template
     */
    async deleteTemplate(id: string, userId: string) {
        const template = await this.getTemplateById(id, userId);

        if (!template) {
            throw new Error('Template not found or you do not have permission');
        }

        // Delete from MinIO
        try {
            const fileName = template.fileUrl.split('/').pop();
            if (fileName) {
                await storageService.deleteFile('template-images', fileName);
            }
        } catch (error) {
            console.error('Failed to delete file from MinIO:', error);
            // Continue with database deletion even if MinIO deletion fails
        }

        // Delete from database
        await template.destroy();
    }

    /**
     * Update template analysis result (for Vision Service team)
     */
    async updateAnalysisResult(
        id: string,
        styleData: {
            colors?: string[];
            layoutType?: string;
            fontStyle?: string;
            stylePrompt?: string;
        }
    ) {
        const template = await TemplateImage.findByPk(id);

        if (!template) {
            throw new Error('Template not found');
        }

        template.analyzed = true;
        template.styleData = styleData;
        await template.save();

        return template;
    }
}

export default new TemplateService();
