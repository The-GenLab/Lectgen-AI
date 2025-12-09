import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { configDotenv } from "dotenv";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";

configDotenv();

// 1. Handle input data using interface/zod schema

/* Cai nay la cai qan trong nhat, minh se dung cai nay de format cho tung silde
 * nma tam thoi lam don gian thoi de chay da =) */
const htmlSchema = z.object({
  title: z.string().describe("Tên của bài giảng"),
  slides: z
    .array(
      z.object({
        title: z.string().describe("Tiêu đề của slide"),
        content: z.string().describe("Nội dung chính tóm tắt"),
        bullet_points: z
          .array(z.string())
          .describe("Danh sách các ý nhỏ (3-5 ý)"),
        note: z.string().describe("Lời dẫn chi tiết cho người thuyết trình"),
      }),
    )
    .describe("Danh sách khoảng 5-7 slide nội dung"),
});

export type SlideContent = z.infer<typeof htmlSchema>;

interface genLectureProps {
  topic: string;
}

// 2. Function to generate slide prompt
export const genLectureContent = async ({
  topic,
}: genLectureProps): Promise<SlideContent> => {
  try {
    // 1. Init model
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.7,
    });

    // 2. Structured model by schema
    const structuredModel = model.withStructuredOutput(htmlSchema);

    // Prompt
    const template = `
      Bạn là giáo sư chuyên soạn bài giảng.
      Hãy tạo nội dung bài giảng về chủ đề: "{topic}".
      Nội dung phải chuyên sâu, logic, dễ hiểu.
    `;

    const prompt = PromptTemplate.fromTemplate(template);

    // Chain
    const chain = prompt.pipe(structuredModel);

    // Run
    console.log(`🤖 AI (Structured Mode) đang nấu content: ${topic}...`);

    const response = await chain.invoke({ topic });

    return response;
  } catch (error) {
    console.log("Lỗi ở ai.service.ts - genSlidePrompt:", error);
    throw error;
  }
};
