import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { STANDARD_SLIDE_PROMPT, SYSTEM_PROMPT } from "./prompts";
import { AIGenerationOptions, SlideData, SlideDataSchema } from "./types";

/**
 * AIService class:
 * -
 */
class AIService {
  private model: ChatGoogleGenerativeAI;

  // create model in constructor
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }

    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: apiKey,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });
  }

  /**
   * Generate slide content from text prompt using Zod structured output
   */
  async generateSlideContent(
    prompt: string,
    options?: AIGenerationOptions,
  ): Promise<SlideData> {
    try {
      console.log(
        "AI Service: Generating slides for:",
        prompt.substring(0, 50) + "...",
      );

      const startTime = Date.now();

      // Create structured output model with Zod schema
      const structuredModel = this.model.withStructuredOutput(SlideDataSchema, {
        name: "slide_generation",
      });

      // Generate full prompt
      const fullPrompt = STANDARD_SLIDE_PROMPT(prompt, options);

      // Invoke model with structured output
      const slideData = await structuredModel.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: fullPrompt },
      ]);

      const duration = Date.now() - startTime;

      console.log(" AI Service: Generated", slideData.slides.length, "slides");
      console.log(" Generation time:", duration, "ms");

      // Zod already validated, now do additional business logic validation
      this.validateBusinessRules(slideData);

      return slideData;
    } catch (error: any) {
      console.error(" AI Service Error:", error);

      // Handle Zod validation errors
      if (error.name === "ZodError") {
        const issues = error.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
        throw new Error(`AI response validation failed: ${issues}`);
      }

      // Handle API errors
      if (error.message?.includes("API key")) {
        throw new Error("Invalid GOOGLE_API_KEY");
      }

      if (error.message?.includes("quota")) {
        throw new Error("Google API quota exceeded. Please try again later.");
      }

      if (error.message?.includes("timeout")) {
        throw new Error("AI generation timed out. Please try again.");
      }

      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Additional business logic validation (beyond Zod schema)
   */
  private validateBusinessRules(slideData: SlideData): void {
    // Check for duplicate slide titles
    const titles = slideData.slides.map((s) => s.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      console.warn("  Warning: Duplicate slide titles detected");
    }

    // Check if first slide is an introduction
    const firstSlide = slideData.slides[0];
    if (
      !firstSlide.title.toLowerCase().includes("intro") &&
      !firstSlide.title.toLowerCase().includes("overview")
    ) {
      console.warn("Warning: First slide might not be an introduction");
    }

    // Check if last slide is a conclusion/summary
    const lastSlide = slideData.slides[slideData.slides.length - 1];
    if (
      !lastSlide.title.toLowerCase().includes("conclu") &&
      !lastSlide.title.toLowerCase().includes("summar")
    ) {
      console.warn("Warning: Last slide might not be a conclusion");
    }
  }

  /**
   * Alternative method: Generate with retry logic (for production)
   */
  async generateSlideContentWithRetry(
    prompt: string,
    options?: AIGenerationOptions,
    maxRetries: number = 3,
  ): Promise<SlideData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(` Attempt ${attempt}/${maxRetries}`);
        return await this.generateSlideContent(prompt, options);
      } catch (error: any) {
        lastError = error;
        console.error(` Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }
}

export default new AIService();
