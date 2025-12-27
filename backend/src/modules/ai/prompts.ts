/**
 * AI Prompt Templates for Slide Generation
 */

import { string } from "zod";
import { AIGenerationOptions } from "./types";

/**
 * System prompt for AI (defines AI behavior)
 */
export const SYSTEM_PROMPT = `You are an expert presentation designer and educator with years of experience creating engaging, educational slide decks.

Your role:
- Create well-structured, visually-balanced presentations
- Use clear, professional language appropriate for the audience
- Ensure logical flow from introduction to conclusion
- Include practical examples and actionable insights
- Make complex topics accessible and engaging

Important: You ALWAYS respond with structured JSON matching the exact schema provided. Never add markdown formatting, code blocks, or explanatory text.`;

/**
 * Generate standard slide prompt with options
 */
export const STANDARD_SLIDE_PROMPT = (
  topic: string,
  options?: AIGenerationOptions,
): string => {
  const maxSlides = options?.maxSlides || 8;
  const style = options?.style || "professional";

  const styleGuidelines = {
    professional:
      "Use formal language, industry terminology, and data-driven insights. Focus on practical applications.",
    casual:
      "Use conversational tone, relatable examples, and engaging storytelling. Make it approachable.",
    academic:
      "Use scholarly language, cite principles, include theoretical frameworks. Emphasize depth and accuracy.",
  };

  return `Create a comprehensive slide deck on the following topic:

**Topic**: ${topic}

**Style**: ${style}
${styleGuidelines[style]}

**Requirements**:

1. **Structure** (${maxSlides} slides total):
   - Slide 1: Introduction/Overview (set context, hook the audience)
   - Slides 2-${maxSlides - 1}: Core content (build concepts progressively)
   - Slide ${maxSlides}: Conclusion/Summary (key takeaways, call-to-action)

2. **Each slide must include**:
   - **title**: Clear, action-oriented heading (max 80 characters)
   - **content**: Compelling description that provides context (1-3 sentences, max 300 characters)
   - **bullet_points**: 3-6 concise key points (each max 150 characters)
   - **note** (optional): Speaker notes with examples, statistics, or additional context (max 500 characters)

3. **Content Guidelines**:
   - Start with fundamentals, progress to advanced concepts
   - Use active voice and strong verbs
   - Include real-world examples or use cases
   - Balance theory with practical application
   - Ensure each slide has a clear purpose
   - Avoid redundancy across slides

4. **Quality Standards**:
   - Accurate and up-to-date information
   - Consistent terminology throughout
   - Logical progression of ideas
   - Engaging and memorable content
   - Appropriate depth for the topic

Generate the slide deck now based on these specifications.`;
};

/**
 * LaTeX mode prompt (for future Phase 2)
 */
export const LATEX_SLIDE_PROMPT = (
  topic: string,
  options?: AIGenerationOptions,
): string => {
  const style = options?.style || "professional";

  const styleGuidelines = {
    professional: "Formal language, industry terminology, practical focus",
    casual: "Conversational tone, relatable examples, engaging",
    academic: "Scholarly language, theoretical frameworks, citations style",
  };

  return String.raw`Create a LaTeX Beamer presentation on: ${topic}
  
**Style**: ${style}
${styleGuidelines[style]}
**Requirements:**
1. **Structure** (8-12 frames total):
   - Frame 1: Title page (with \titlepage)
   - Frame 2: Table of contents (with \tableofcontents)
   - Frames 3-10: Core content organized in sections
   - Frame 11: Conclusion/Summary
   - Frame 12: Q&A / Thank you slide
2. **LaTeX Structure:**
   - Start with: \documentclass[10pt]{beamer}
   - Use theme: \usetheme{Madrid}
   - Use color theme: \usecolortheme{beaver}
   - Include packages: inputenc, fontenc, booktabs, graphicx, amsmath
   - Define title, subtitle, author, institute, date
   - Use \section{} for organizing content
   - Each frame must have: \begin{frame}{Title} ... \end{frame}
3. **Content Guidelines:**
   - Use itemize/enumerate for lists
   - Use blocks for definitions: \begin{block}{Title}...\end{block}
   - Use alertblock for warnings: \begin{alertblock}{Alert}...\end{alertblock}
   - Use exampleblock for examples
   - Include mathematical formulas where relevant: $$ ... $$
   - Use columns for comparisons: \begin{columns}...\end{columns}
   - Include tables with booktabs if suitable
   
4. **Quality Standards:**
   - Professional academic style
   - Clear logical flow between sections
   - Balanced content per frame (not too crowded)
   - Include speaker notes where helpful
   - Complete, compilable LaTeX code

5. **CRITICAL OUTPUT RULES (READ CAREFULLY):**
   - **NO COMMENTS:** Do NOT generate any comments (starting with %) anywhere in the code.
   - **LINE BREAKS:** The output JSON string must use explicit '\n' for line breaks. Do NOT output the LaTeX code as a single continuous line.
   - **ONE COMMAND PER LINE:** Ensure every LaTeX command (like \begin, \end, \item, \section) is on its own line.
   - **ESCAPE:** Properly escape backslashes in the JSON string (e.g., use \\documentclass instead of \documentclass inside the JSON value).

Return structured JSON with:
{
  "title": "Main presentation title",
  "latex_code": "Complete LaTeX code from \\documentclass to \\end{document}"
}`;
};
