import { Router } from "express";
import aiController from "./ai.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/generate
 * Generate slides from text prompt
 */
router.post("/generate", aiController.generate);

/**
 * POST /api/ai/generate-with-retry
 * Generate slides with automatic retry logic
 */
router.post("/generate-with-retry", aiController.generateWithRetry);

/**
 * POST /api/ai/generate-latex
 * Generate LaTeX Beamer presentation from text prompt
 */
router.post("/generate-latex", aiController.generateLatex);
/**
 * POST /api/ai/generate-latex-with-retry
 * Generate LaTeX with automatic retry logic
 */
router.post("/generate-latex-with-retry", aiController.generateLatexWithRetry);

export default router;
