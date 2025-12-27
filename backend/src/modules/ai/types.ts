/**
 * AI Service Type Definitions
 */

import { title } from "process";
import { z } from "zod";

/**
 * Zod Schema for Slide structure
 * This will be used for both validation and type inference
 */
export const SlideSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(80, "Title too long")
    .describe("The slide title (clear and concise heading)"),

  content: z
    .string()
    .min(1, "Content is required")
    .max(300, "Content too long")
    .describe("Brief description or context for the slide (1-3 sentences)"),

  bullet_points: z
    .array(z.string().min(1).max(150))
    .min(3, "At least 3 bullet points required")
    .max(6, "Maximum 6 bullet points")
    .describe("Key points or takeaways (3-6 items)"),

  note: z
    .string()
    .max(500)
    .optional()
    .describe("Optional speaker notes with additional context or examples"),
});

/**
 * Zod Schema for complete SlideData
 */
export const SlideDataSchema = z.object({
  title: z
    .string()
    .min(1, "Presentation title is required")
    .max(100, "Title too long")
    .describe("The main presentation title"),

  slides: z
    .array(SlideSchema)
    .min(5, "At least 5 slides required")
    .max(10, "Maximum 10 slides")
    .describe("Array of presentation slides"),
});

/**
 * Zod schemas for LaTeX Beamer output
 */
export const LatexSchema = z.object({
  title: z.string().describe("The main presentation title"),

  latex_code: z
    .string()
    .min(100, "LaTeX code too short")
    .describe(
      "The full LaTeX Beamer code for the presentation(start with \\documentclass)",
    ),
});

/**
 * Zod Schema for LaTeX Presentation Data (for structured output)
 * AI generates this, then we build LaTeX from it
 */
export const LatexSlideSchema = z.object({
  title: z.string().describe("Slide title"),
  bullets: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe("List of bullet points (3-6 items)"),
  codeSnippet: z
    .string()
    .optional()
    .describe(
      "Code example if applicable (Python/Java/etc). DO NOT include markdown backticks.",
    ),
});

export const LatexPresentationSchema = z.object({
  presentationTitle: z.string().describe("Main title of the presentation"),
  subtitle: z.string().describe("Subtitle of the presentation"),
  slides: z
    .array(LatexSlideSchema)
    .min(8)
    .max(12)
    .describe("Array of slides content (8-12 slides)"),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type Slide = z.infer<typeof SlideSchema>;
export type LatexData = z.infer<typeof LatexSchema>;
export type LatexSlide = z.infer<typeof LatexSlideSchema>;
export type LatexPresentationData = z.infer<typeof LatexPresentationSchema>;

/**
 * AI Generation Options
 */
export interface AIGenerationOptions {
  temperature?: number;
  maxSlides?: number;
  style?: "professional" | "casual" | "academic";
}
