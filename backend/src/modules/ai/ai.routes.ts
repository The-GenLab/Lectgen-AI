import { Router } from "express";
import aiController from "./ai.controller";

const router = Router();

/**
 * POST /api/ai/generate
 * Generate slides from text prompt
 */
router.post("/generate", aiController.genareate);

/**
 * POST /api/ai/generate-with-retry
 * Generate slides with automatic retry logic
 */
router.post("/generate-with-retry", aiController.genareateWithRetry);

export default aiRouter;
