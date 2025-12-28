import { Router } from 'express';
import adminSettingsService from './admin-settings.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

const router = Router();

/**
 * GET /api/settings/input-methods
 * Public endpoint to get enabled input methods (no authentication required)
 * Used by frontend to show/hide input options
 */
router.get('/input-methods', async (req, res) => {
  try {
    const inputMethods = await adminSettingsService.getInputMethods();
    return successResponse(res, inputMethods, 'Input methods retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error.message || 'Failed to get input methods', 500);
  }
});

/**
 * GET /api/settings/maintenance
 * Public endpoint to get maintenance mode status (no authentication required)
 * Used by frontend to show maintenance page
 */
router.get('/maintenance', async (req, res) => {
  try {
    const maintenanceMode = await adminSettingsService.getMaintenanceMode();
    return successResponse(res, { maintenanceMode }, 'Maintenance mode retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error.message || 'Failed to get maintenance mode', 500);
  }
});

export default router;

