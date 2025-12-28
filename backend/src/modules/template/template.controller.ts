import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../shared/utils/response';
// @ts-ignore - Import from same module
import templateService from './template.service';

// Multer file type
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

class TemplateController {
  /**
   * Upload template files (images and documents)
   * POST /api/template/upload
   */
  async uploadTemplate(req: any, res: Response) {
    try {
      // Support both single file (req.file) and multiple files (req.files)
      const files = req.files || (req.file ? [req.file] : []);
      
      if (files.length === 0) {
        return errorResponse(res, 'No files uploaded', 400);
      }

      const userId = req.user!.id;
      const conversationId = req.body.conversationId;

      const uploadedFiles = await Promise.all(
        files.map((file: UploadedFile) =>
          templateService.uploadTemplate(file, userId, conversationId)
        )
      );

      // If single file, return single object; if multiple, return array
      const responseData = files.length === 1 ? uploadedFiles[0] : uploadedFiles;

      return successResponse(res, responseData, `${uploadedFiles.length} file(s) uploaded successfully`, 201);
    } catch (error) {
      console.error('Upload template error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Failed to upload template');
    }
  }

  /**
   * Get user's template images
   * GET /api/template
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { analyzed } = req.query;

      const filter: any = { userId };
      if (analyzed !== undefined) {
        filter.analyzed = analyzed === 'true';
      }

      const templates = await templateService.getTemplates(filter);
      return successResponse(res, templates);
    } catch (error) {
      console.error('Get templates error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Failed to get templates');
    }
  }

  /**
   * Get template by ID
   * GET /api/template/:id
   */
  async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const template = await templateService.getTemplateById(id, userId);

      if (!template) {
        return errorResponse(res, 'Template not found', 404);
      }

      return successResponse(res, template);
    } catch (error) {
      console.error('Get template error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Failed to get template');
    }
  }

  /**
   * Delete template
   * DELETE /api/template/:id
   */
  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await templateService.deleteTemplate(id, userId);
      return successResponse(res, null, 'Template deleted successfully');
    } catch (error) {
      console.error('Delete template error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Failed to delete template');
    }
  }

  /**
   * Analyze template image style
   * POST /api/template/analyze
   */
  async analyzeTemplate(req: any, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, 'No image file uploaded', 400);
      }

      const imageBuffer = req.file.buffer;
      const analysisResult = await templateService.analyzeTemplateStyle(imageBuffer);

      return successResponse(res, analysisResult, 'Image analyzed successfully');
    } catch (error) {
      console.error('Analyze template error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Failed to analyze template');
    }
  }
}

export default new TemplateController();
