import puppeteer from "puppeteer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import { SlideContent } from "./ai.service"; // Import kiểu dữ liệu từ bên AI

export const generatePDF = async (data: SlideContent): Promise<Buffer> => {
  try {
    console.log("🖨️ Đang khởi động máy in Puppeteer...");

    // 1. Đọc file template EJS
    // __dirname trong TS sau khi build sẽ trỏ vào folder dist, cần xử lý khéo
    const templatePath = path.join(__dirname, "../templates/slide.ejs");

    // Check xem file có tồn tại không (debug đường dẫn)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Không tìm thấy template tại: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf-8");

    // 2. Render EJS thành HTML string
    const html = ejs.render(templateHtml, data);

    // 3. Khởi động trình duyệt (Headless)
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Cần thiết khi chạy trên server/docker
    });

    const page = await browser.newPage();

    // 4. Set nội dung HTML
    await page.setContent(html, { waitUntil: "networkidle0" }); // Đợi load hết CSS/Font

    // 5. In ra PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // In cả màu nền
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    await browser.close();
    console.log("✅ Đã in xong PDF!");

    // Trả về Buffer (dạng nhị phân) để gửi về client
    // Lưu ý: puppeteer v24 trả về Uint8Array, cần ép về Buffer
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ Lỗi PDF Service:", error);
    throw error;
  }
};
