import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  LATEX_SLIDE_PROMPT,
  STANDARD_SLIDE_PROMPT,
  SYSTEM_PROMPT,
} from "./prompts";
import {
  AIGenerationOptions,
  LatexData,
  LatexPresentationData,
  LatexPresentationSchema,
  SlideData,
  SlideDataSchema,
} from "./types";

/**
 * AIService class:
 * - Handles AI interactions for slide and LaTeX generation
 * - Uses LangChain's ChatGoogleGenerativeAI model
 * - Implements structured output with Zod schemas
 * - Includes error handling and business logic validation
 */
class AIService {
  private model: ChatGoogleGenerativeAI;

  // create model in constructor
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }

    console.log("[ AI Service ]: apiKey ", apiKey);

    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: apiKey,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });
  }

  /**
   * Additional business logic validation (beyond Zod schema)
   */
  private validateBusinessRules(slideData: SlideData): void {
    // Check for duplicate slide titles
    const titles = slideData.slides.map((s) => s.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      console.warn(" [ AIService Warning ]: Duplicate slide titles detected");
    }

    // Check if first slide is an introduction
    const firstSlide = slideData.slides[0];
    if (
      !firstSlide.title.toLowerCase().includes("intro") &&
      !firstSlide.title.toLowerCase().includes("overview")
    ) {
      console.warn(
        "[ AIService Warning ]: First slide might not be an introduction",
      );
    }

    // Check if last slide is a conclusion/summary
    const lastSlide = slideData.slides[slideData.slides.length - 1];
    if (
      !lastSlide.title.toLowerCase().includes("conclu") &&
      !lastSlide.title.toLowerCase().includes("summar")
    ) {
      console.warn(
        "[ AIService Warning ]: Last slide might not be a conclusion",
      );
    }
  }
  private validateLatexBusinessRules(latexData: LatexData): void {
    const code = latexData.latex_code;

    // Required: documentclass beamer
    if (!code.includes("\\documentclass") || !code.includes("beamer")) {
      throw new Error("LaTeX code must include \\documentclass{beamer}");
    }

    // Required: document environment
    if (!code.includes("\\begin{document}")) {
      throw new Error("LaTeX code missing \\begin{document}");
    }
    if (!code.includes("\\end{document}")) {
      throw new Error("LaTeX code missing \\end{document}");
    }

    // Required: title
    if (!code.includes("\\title{") && !code.includes("\\title[")) {
      console.warn("[ AIService Warning ]: LaTeX missing \\title{}");
    }

    // Required: at least one frame
    if (!code.includes("\\begin{frame}")) {
      throw new Error("LaTeX must have at least one frame");
    }

    // Recommended: theme
    if (!code.includes("\\usetheme{")) {
      console.warn("[ AIService Warning ]: LaTeX missing \\usetheme{}");
    }

    // Recommended: section structure
    if (!code.includes("\\section{")) {
      console.warn(
        "[ AIService Warning ]: LaTeX missing \\section{} for organization",
      );
    }

    // Check minimum length (avoid too short/empty generation)
    if (code.length < 500) {
      throw new Error(
        "LaTeX code too short (< 500 characters). Possible generation failure.",
      );
    }

    // Optional: Check basic packages
    const recommendedPackages = ["inputenc", "fontenc"];
    recommendedPackages.forEach((pkg) => {
      if (!code.includes(`\\usepackage`) || !code.includes(pkg)) {
        console.warn(
          `[ AIService Warning ]: LaTeX missing recommended package: ${pkg}`,
        );
      }
    });

    console.log("[ AIService ]: LaTeX validation passed");
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
        "[ AI Service ]: Generating slides for:",
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

      console.log(
        " [ AI Service ]: Generated",
        slideData.slides.length,
        "slides",
      );
      console.log(" Generation time:", duration, "ms");

      // Zod already validated, now do additional business logic validation
      this.validateBusinessRules(slideData);

      return slideData;
    } catch (error: any) {
      console.error(" [ AI Service Error ]:", error);

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

  /**
   * Generate LaTeX Beamer presentation from text prompt
   * Uses withStructuredOutput for 100% reliable JSON parsing
   * Steps:
   * 1. Use AI with structured output to generate presentation data
   * 2. Build LaTeX code from structured data using buildLatexFromJSON()
   * 3. Validate the generated LaTeX code
   */
  async generateLatexContent(prompt: string): Promise<LatexData> {
    try {
      console.log(
        "[ AI Service ]: Generating LaTeX Data for:",
        prompt.substring(0, 50) + "...",
      );

      const startTime = Date.now();

      // 1. Use Structured Output (No more manual JSON parsing!)
      const structuredModel = this.model.withStructuredOutput(
        LatexPresentationSchema,
        {
          name: "latex_data_generation",
        },
      );

      const fullPrompt = LATEX_SLIDE_PROMPT(prompt);

      // 2. Invoke AI - Returns structured object automatically
      const jsonData = await structuredModel.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: fullPrompt },
      ]);

      console.log(
        "[ AI Service ]: Got structured data. Building LaTeX...",
        `(${jsonData.slides.length} slides)`,
      );

      // 3. Build LaTeX from structured data (type-safe!)
      const latexCode = this.buildLatexFromJSON(jsonData);

      // Create the final result
      const result: LatexData = {
        title: jsonData.presentationTitle,
        latex_code: latexCode,
      };

      const duration = Date.now() - startTime;
      console.log(
        "[ AI Service ]: Generated LaTeX:",
        result.title,
        `(${latexCode.length} chars)`,
      );
      console.log("Generation time:", duration, "ms");

      // Validate the LaTeX code
      this.validateLatexBusinessRules(result);

      return result;
    } catch (error: any) {
      console.error("[ AI Service LaTeX Error ]:", error);

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

      throw new Error(`LaTeX generation failed: ${error.message}`);
    }
  }

  /**
   * Generate LaTeX with retry logic (for production)
   */
  async generateLatexContentWithRetry(
    prompt: string,
    options?: AIGenerationOptions,
    maxRetries: number = 3,
  ): Promise<LatexData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`);
        return await this.generateLatexContent(prompt, options);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  // ================================
  //        Handle Latex
  // ================================

  /**
   * Escape LaTeX special characters (standard approach)
   * Simply add backslash before special characters, no text replacement
   */
  private escapeLatex(text: string): string {
    if (!text) return "";
    return text
      .replace(/\\/g, "\\textbackslash{}") // Backslash → \\
      .replace(/&/g, "\\&") // Ampersand
      .replace(/%/g, "\\%") // Percent
      .replace(/\$/g, "\\$") // Dollar
      .replace(/#/g, "\\#") // Hash
      .replace(/_/g, "\\_") // Underscore
      .replace(/\{/g, "\\{") // Left brace
      .replace(/\}/g, "\\}") // Right brace
      .replace(/\^/g, "\\^{}") // Caret (needs {})
      .replace(/~/g, "\\~{}") // Tilde (needs {})
      .replace(/`/g, "'") // Backtick → single quote (fix backtick issue)
      .replace(/--/g, "-"); // Double dash → single dash (fix double dash)
  }

  /**
   * Format text with Markdown support
   * Process: 1. Escape LaTeX → 2. Convert Markdown (**text** → \textbf{text})
   */
  private formatText(text: string): string {
    if (!text) return "";

    // Step 1: Escape LaTeX special characters first
    let formatted = this.escapeLatex(text);

    // Step 2: Convert Markdown bold **text** to \textbf{text}
    // Match **text** but not ****
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}");

    return formatted;
  }

  /**
   * Build LaTeX Beamer code from JSON structure
   * This function constructs a complete LaTeX document from the AI-generated JSON
   */

  // Note: For Vietnamese support, uncomment the following lines:
  // \\usepackage[T5]{fontenc}
  // \\usepackage[vietnamese]{babel}

  private buildLatexFromJSON(data: LatexPresentationData): string {
    let latex = `\\documentclass[10pt]{beamer}
\\usetheme{metropolis}
\\usepackage{lmodern}
\\usepackage{xcolor}
\\usepackage[utf8]{inputenc}
\\usepackage{listings}

\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  breakatwhitespace=true,
  columns=flexible,
  keepspaces=true,
  showstringspaces=false,
  frame=single,
  backgroundcolor=\\color{lightgray!20}
}

\\title{${this.formatText(data.presentationTitle)}}
\\subtitle{${this.formatText(data.subtitle)}}
\\author{AI Generator}
\\date{\\today}
\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}[fragile]{Table of Contents}
\\tableofcontents
\\end{frame}
`;

    // Build each slide from JSON
    for (const slide of data.slides) {
      // ALWAYS add [fragile] to ALL frames (prevents "Runaway argument" error)
      latex += `\\section{${this.formatText(slide.title)}}\n`;
      latex += `\\begin{frame}[fragile]{${this.formatText(slide.title)}}\n`;

      // Add bullet points with formatText (supports Markdown bold)
      if (slide.bullets && slide.bullets.length > 0) {
        latex += `  \\begin{itemize}\n`;
        for (const point of slide.bullets) {
          latex += `    \\item ${this.formatText(point)}\n`;
        }
        latex += `  \\end{itemize}\n`;
      }

      // Add code snippet with lstlisting (auto line wrapping, no overflow)
      if (slide.codeSnippet) {
        latex += `  \\begin{exampleblock}{Code Example}\n`;
        latex += `    \\begin{lstlisting}\n`;
        latex += slide.codeSnippet + "\n";
        latex += `    \\end{lstlisting}\n`;
        latex += `  \\end{exampleblock}\n`;
      }

      latex += `\\end{frame}\n\n`;
    }

    // Final thank you slide
    latex += `
\\begin{frame}[standout]
  \\centering
  \\Huge Thank You!
\\end{frame}

\\end{document}`;

    return latex;
  }
}

export default new AIService();
