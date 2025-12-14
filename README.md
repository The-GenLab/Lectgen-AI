# 📋 PHÂN CÔNG NHIỆM VỤ DỰ ÁN: LectGen-AI

---

## 1. 👩‍💻 Mai Anh  
**Frontend & Backend – Admin Dashboard**

Mai Anh chịu trách nhiệm xây dựng và quản lý **toàn bộ các màn hình Admin Dashboard**, đảm bảo trải nghiệm quản trị viên mượt mà, rõ ràng và chuyên nghiệp.

### Admin Dashboard Modules

- **LectGen-AI Dashboard Overview**  
  - Frontend & Backend  
  - Hiển thị KPI, biểu đồ dữ liệu thống kê

- **LectGen-AI User List Management**  
  - Frontend & Backend  
  - CRUD người dùng

- **LectGen-AI User Details**  
  - Frontend & Backend  
  - Hiển thị chi tiết user và các hành động quản trị

- **LectGen-AI Subscriptions & Billing**  
  - Frontend & Backend  
  - Quản lý thanh toán, gói VIP và doanh thu

- **LectGen-AI General Settings**  
  - Frontend & Backend  
  - Cài đặt hệ thống chung

- **LectGen-AI Slide & Content List**  
  - Frontend & Backend  
  - Quản lý danh sách slide đã tạo

- **LectGen-AI AI Models Config**  
  - Frontend & Backend  
  - Quản lý cấu hình các model AI

- **LectGen-AI System Logs**  
  - Frontend & Backend  
  - Hiển thị và lọc log hệ thống

---

## 2. 🧑‍💻 Bình  
**Fullstack & AI – User App: Chat Interface & Speech Service AI**

Bình phụ trách **giao diện chat chính của User App**, nơi người dùng tương tác với AI, và tích hợp **Speech Service AI**.

### User App – Chat Interface & Audio Input

- **LectGen-AI User App – Chat Interface**  
  - Frontend:  
    - Layout chính  
    - Hiển thị lịch sử hội thoại  
    - User Prompt  
    - AI Response Cards  
  - Backend:  
    - API xử lý Text Input  
    - Gửi request đến Core AI Service

- **AI Response Card UI**  
  - Frontend:  
    - Thumbnail  
    - Download PDF  
    - Edit Slide  
    - Metadata

- **LectGen-AI User App – Audio Input**  
  - Frontend:  
    - UI ghi âm  
    - Waveform visualization  
    - Preview transcript  
  - Backend & AI:  
    - Tích hợp Speech Service AI (Audio → Text)  
    - Gửi kết quả đến Core AI Service

- **Input Panel (Text Tab)**  
  - Frontend:  
    - Textbox  
    - Gợi ý prompt  
  - Backend:  
    - API gợi ý prompt (nếu có)

---

## 3. 🧠 An  
**Backend – Core AI Service (LangChain + Gemini)**

An chịu trách nhiệm xây dựng **trái tim của hệ thống AI**, tối ưu logic xử lý ngôn ngữ và sinh nội dung slide.

### Backend – Core AI Service

- **AI Service (LangChain + Gemini)**  
  - Xây dựng và tối ưu logic chính của AI Service

- **Text → Structured Slide Data (JSON)**  
  - Xử lý input văn bản từ:
    - Text Tab
    - Kết quả từ Speech Service  
  - Tạo dữ liệu slide dạng JSON

- **Image Style Analysis → Style Prompt → Structured Slide Data**  
  - Nhận kết quả từ Vision Service  
  - Kết hợp nội dung để tạo slide JSON

- **Model Management**  
  - Quản lý và chuyển đổi giữa:
    - `gemini-1.5-flash` (FREE)
    - `gemini-2.0-flash-exp` (VIP)

---

## 4. 🔐 Thiện  
**Fullstack & AI – Authentication Flows & PDF Service AI**

Thiện phụ trách **toàn bộ luồng xác thực người dùng** và **dịch vụ render PDF cho slide**.

### User App – Authentication & Onboarding

- **LectGen-AI User App – Onboarding**  
  - Frontend & Backend  
  - Quản lý trạng thái đã xem onboarding

- **Sign Up**  
  - Frontend & Backend  
  - Email/Password  
  - Google Auth

- **Log In**  
  - Frontend & Backend  
  - Email/Password  
  - Google Auth

- **Forgot Password**  
  - Frontend & Backend  
  - Khôi phục mật khẩu

- **Email Confirmation**  
  - Frontend & Backend  
  - Xác nhận email

- **Sign Up / Log In – Success & Error**  
  - Frontend: hiển thị trạng thái  
  - Backend: logic điều hướng và xử lý lỗi

### Backend – PDF Service

- **PDF Service (Puppeteer)**  
  - Render slide JSON thành PDF

- **Template Management**  
  - Quản lý template:
    - Basic
    - Premium  
  - Áp dụng theo vai trò người dùng

---

## 5. 🖼️ Dũng  
**Backend – Vision Service & Admin: Usage & Quota**

Dũng phụ trách **dịch vụ phân tích hình ảnh AI** và **quản lý usage/quota trên Admin Dashboard**.

### Backend – Vision Service

- **Vision Service**  
  - Phân tích hình ảnh mẫu (Image → Style Analysis)

- **Extract Style Data**  
  - Trích xuất:
    - Color scheme  
    - Layout type  
    - Font style  
  - Chuyển thành style prompt gửi sang Core AI Service

- **User App – Image / Template Input**  
  - Frontend:  
    - Upload ảnh  
    - Preview phân tích style  
  - Backend:  
    - API nhận ảnh  
    - Trả kết quả phân tích từ Vision Service

### Admin Dashboard – Usage & Quota

- **LectGen-AI Usage & Quota Overview**  
  - Frontend & Backend  
  - Hiển thị:
    - Thống kê sử dụng AI  
    - Quota theo user / gói  
  - Backend:
    - Logic quản lý quota  
    - Rate limiting

---

## ✅ TÓM TẮT PHÂN CÔNG

- **Mai Anh**: Toàn bộ Admin Dashboard *(trừ Usage & Quota)*  
- **Bình**: Chat Interface của User App & Speech Service AI  
- **An**: Core AI Service *(LangChain + Gemini)*  
- **Thiện**: Authentication, Onboarding & PDF Service AI  
- **Dũng**: Vision Service AI & Admin Usage / Quota

---
