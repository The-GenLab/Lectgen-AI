import { v4 as uuidv4 } from 'uuid';
import TemplateFile from '../../core/models/TemplateFile';
import { storageService } from '../storage';

interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
}

class TemplateService {
    /**
     * Upload template file (image or document) to MinIO
     */
    async uploadTemplate(
        file: UploadedFile,
        userId: string,
        conversationId?: string
    ) {
        // Determine file type and validate
        const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const documentMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        let fileType: 'image' | 'document';
        let bucketName: string;
        let maxSize: number;

        if (imageMimeTypes.includes(file.mimetype)) {
            fileType = 'image';
            bucketName = 'template-files';
            maxSize = 5 * 1024 * 1024; // 5MB for images
        } else if (documentMimeTypes.includes(file.mimetype)) {
            fileType = 'document';
            bucketName = 'template-files';
            maxSize = 10 * 1024 * 1024; // 10MB for documents
        } else {
            throw new Error('Invalid file type. Only images (JPG, PNG) and documents (PDF, DOCX, TXT) are allowed');
        }

        // Validate file size
        if (file.size > maxSize) {
            throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        // Upload to MinIO
        const objectName = await storageService.uploadFile(
            bucketName,
            file.buffer,
            uniqueFileName,
            file.mimetype
        );

        // generate presigned URL
        const fileUrl = await storageService.getPresignedUrl(bucketName, objectName);

        // save to database
        const templateFile = await TemplateFile.create({
            userId,
            conversationId,
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileType,
            analyzed: false,
        });

        return templateFile;
    }

    /**
     * Get templates with filters
     */
    async getTemplates(filter: {
        userId: string;
        analyzed?: boolean;
        conversationId?: string;
    }) {
        const templates = await TemplateFile.findAll({
            where: filter,
            order: [['createdAt', 'DESC']],
        });

        return templates;
    }

    /**
     * Get template by ID (with user ownership check)
     */
    async getTemplateById(id: string, userId: string) {
        const template = await TemplateFile.findOne({
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
        const template = await TemplateFile.findByPk(id);

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
