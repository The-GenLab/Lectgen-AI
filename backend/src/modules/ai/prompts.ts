/**
 * AI Prompt Templates for Slide Generation
 */

import { AIGenerationOptions } from './types';

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
  options?: AIGenerationOptions
): string => {
  const maxSlides = options?.maxSlides || 8;
  const style = options?.style || 'professional';

  const styleGuidelines = {
    professional: 'Use formal language, industry terminology, and data-driven insights. Focus on practical applications.',
    casual: 'Use conversational tone, relatable examples, and engaging storytelling. Make it approachable.',
    academic: 'Use scholarly language, cite principles, include theoretical frameworks. Emphasize depth and accuracy.',
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
export const LATEX_SLIDE_PROMPT = (topic: string): string => {
  return `Create a LaTeX Beamer presentation on: ${topic}

Requirements:
- Use standard Beamer document class
- Include mathematical formulas where relevant
- Use TikZ for diagrams if needed
- Professional academic style

Return ONLY valid LaTeX code between \\begin{document} and \\end{document}.`;
};
