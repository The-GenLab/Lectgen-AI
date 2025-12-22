/**
 * AI Controller
 * Handles HTTP requests for AI-powered slide generation
 */

import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../shared/utils";
import { AIGenerationOptions } from "./types";
import aiService from "./ai.service";
import usageTrackingService from "../../shared/services/usageTracking.service";
import { ActionStatus } from "../../core/models/UsageLog";

class AIController {
  /**
   * Generate slides from a text prompt
   * POST /api/ai/generate
   *
   * Request Body:
   * - prompt: string (required) - Topic or content description
   * - style: 'professional' | 'casual' | 'academic' (optional, default: 'professional')
   * - maxSlides: number (optional, default: 10, range: 5-20)
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     presentation: { title, slides: [...] },
   *     metadata: { slideCount, style, generatedAt }
   *   }
   * }
   */

  async generate(req: Request, res: Response): Promise<Response> {
    try {
      const { prompt, style = "professional", maxSlides = 10 } = req.body;

      // validate required fields

      // validate prompt
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return errorResponse(
          res,
          "Prompt is required and must be a non-empty string.",
          400,
        );
      }

      // validate style
      const validStyles = ["professional", "casual", "academic"];
      if (style && !validStyles.includes(style)) {
        return errorResponse(
          res,
          `Invalid style. Must be one of: ${validStyles.join(", ")}`,
          400,
        );
      }

      // validate maxSlides
      if (
        maxSlides &&
        (typeof maxSlides !== "number" || maxSlides < 5 || maxSlides > 20)
      ) {
        return errorResponse(
          res,
          "maxSlides must be a number between 5 and 20.",
          400,
        );
      }

      // Build options object
      const options: AIGenerationOptions = {
        style: style as "professional" | "casual" | "academic",
        maxSlides,
      };

      // generate slides using AI service
      console.log("[ AI Controller ] Generating slides...");

      const startTime = Date.now();

      const result = await aiService.generateSlideContent(prompt, options);

      const duration = Date.now() - startTime;

      console.log(
        `[ AI Controller ] Generated ${result.slides.length} slides in ${duration} ms`,
      );

      // Log usage for admin tracking
      if (req.user) {
        await usageTrackingService.logAIGeneration({
          userId: req.user.id,
          tokensUsed: 1500, // TODO: Get actual token count from Gemini response
          durationMs: duration,
          status: ActionStatus.SUCCESS,
          metadata: {
            model: "gemini-2.5-flash",
            prompt: prompt.substring(0, 100),
            slideCount: result.slides.length,
          },
        });
      }

      // success response with metadata
      return successResponse(
        res,
        {
          presentation: result,
          metadata: {
            slideCount: result.slides.length,
            style: options.style,
            generatedAt: new Date().toISOString(),
            duration: `${duration} ms`,
          },
        },
        "Slides generated successfully",
        200,
      );
    } catch (error: any) {
      console.log("[ AI Controller ] Error generating slides:", error);

      // Log failed usage
      if (req.user) {
        await usageTrackingService.logAIGeneration({
          userId: req.user.id,
          durationMs: Date.now() - (req as any).startTime || 0,
          status: ActionStatus.FAILED,
          errorMessage: error.message,
        });
      }

      return errorResponse(
        res,
        error.message || "Failed to generate slides",
        error.statusCode || 500,
      );
    }
  }

  /**
   * Generate slides with automatic retry logic
   * POST /api/ai/generate-with-retry
   *
   * Request Body:
   * - prompt: string (required)
   * - style: 'professional' | 'casual' | 'academic' (optional)
   * - maxSlides: number (optional)
   * - maxRetries: number (optional, default: 3, range: 1-5)
   *
   * Response: Same as generate() but includes maxRetries in metadata
   */
  async generateWithRetry(req: Request, res: Response): Promise<Response> {
    try {
      const {
        prompt,
        style = "professional",
        maxSlides = 10,
        maxRetries = 3,
      } = req.body;

      // validate prompt
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return errorResponse(
          res,
          "Prompt is required and must be a non-empty string.",
          400,
        );
      }

      // validate style
      const validStyles = ["professional", "casual", "academic"];
      if (style && !validStyles.includes(style)) {
        return errorResponse(
          res,
          `Invalid style. Must be one of: ${validStyles.join(", ")}`,
          400,
        );
      }

      // validate maxSlides
      if (
        maxSlides &&
        (typeof maxSlides !== "number" || maxSlides < 5 || maxSlides > 20)
      ) {
        return errorResponse(
          res,
          "maxSlides must be a number between 5 and 20.",
          400,
        );
      }

      // validate maxRetries
      if (
        maxRetries &&
        (typeof maxRetries !== "number" || maxRetries < 1 || maxRetries > 5)
      ) {
        return errorResponse(
          res,
          "maxRetries must be a number between 1 and 5",
          400,
        );
      }

      // Build options
      const options: AIGenerationOptions = {
        style: style as "professional" | "casual" | "academic",
        maxSlides,
      };

      // Generate slides with retry
      console.log(
        `[AI Controller] Generating slides with retry (max: ${maxRetries}) for prompt: "${prompt.substring(0, 50)}..."`,
      );
      const startTime = Date.now();

      const result = await aiService.generateSlideContentWithRetry(
        prompt,
        options,
        maxRetries,
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `[AI Controller] Generation with retry completed in ${duration}s`,
      );
      // Success response with metadata
      return successResponse(
        res,
        {
          presentation: result,
          metadata: {
            slideCount: result.slides.length,
            style: options.style,
            maxRetries,
            generatedAt: new Date().toISOString(),
            duration: `${duration}s`,
          },
        },
        "Slides generated successfully with retry logic",
        200,
      );
    } catch (error: any) {
      console.log("[AI Controller] Error generating slides with retry:", error);
      return errorResponse(
        res,
        error.message || "Failed to generate slides with retry",
        error.statusCode || 500,
      );
    }
  }
}

export default new AIController();
