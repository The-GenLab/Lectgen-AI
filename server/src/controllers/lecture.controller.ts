import { Request, Response } from "express";
import { genLectureContent } from "../services/ai.service";
import { generatePDF } from "../services/pdf.service";

export const generateLecture = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { topic } = req.body;

    if (!topic) {
      res.status(400).json({ success: false, message: "Thiếu topic!" });
      return;
    }

    // 1. Gọi AI lấy nội dung (JSON)
    console.log("Step 1: Gọi AI...");
    console.log("Body nhận được:", req.body);
    console.log("Topic:", req.body.topic);
    const slideData = await genLectureContent({ topic });

    // 2. Gọi Puppeteer tạo PDF (Buffer)
    console.log("Step 2: Tạo PDF...");
    const pdfBuffer = await generatePDF(slideData);

    // 3. Trả về file PDF cho trình duyệt download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="lecture-${Date.now()}.pdf"`, // Tên file tải xuống
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server!" });
  }
};
