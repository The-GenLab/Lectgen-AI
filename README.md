# 📋 PHÂN CÔNG NHIỆM VỤ DỰ ÁN: LectGen-AI

## 🧑‍💻 Bình  
**Fullstack & AI – User App + Admin Content Management**

Bình phụ trách **User App chính** và đảm nhận thêm các màn hình Admin
liên quan trực tiếp đến **nội dung slide**.

### User App – Chat Interface & Speech Service AI

- **LectGen-AI User App – Chat Interface**
  - Frontend:
    - Layout chính
    - Lịch sử hội thoại
    - User Prompt
    - AI Response Cards
  - Backend:
    - API xử lý Text Input
    - Gửi request đến Core AI Service

- **AI Response Card UI**
  - Thumbnail
  - Download PDF
  - Edit Slide
  - Metadata

- **LectGen-AI User App – Audio Input**
  - Frontend:
    - Ghi âm
    - Waveform visualization
    - Preview transcript
  - Backend & AI:
    - Speech Service AI (Audio → Text)

- **Input Panel (Text Tab)**
  - Textbox
  - Prompt suggestions

### Admin Dashboard – Content

- **LectGen-AI Slide & Content List**
  - Quản lý danh sách slide đã tạo
  - View / delete / re-generate content

---

## 🧠 An  
**Backend – Core AI Service & Admin AI Configuration**

An tiếp quản các màn hình Admin liên quan trực tiếp đến **AI & model**.

### Backend – Core AI Service

- **AI Service (LangChain + Gemini)**
- **Text → Structured Slide JSON**
- **Image Style Prompt → Slide JSON**
- **Model switching (FREE / VIP)**

### Admin Dashboard – AI

- **LectGen-AI AI Models Config**
  - Quản lý cấu hình model
  - Mapping model theo gói FREE / VIP
  - Enable / disable model

---

## 🔐 Thiện  
**Fullstack & AI – Authentication, Billing & System Settings**

Thiện tiếp quản các màn hình Admin **liên quan user, billing và cấu hình hệ thống**
(vì đã nắm Auth + role).

### User App – Authentication & Onboarding

- Onboarding
- Sign Up / Log In (Email + Google)
- Forgot Password
- Email Confirmation
- Auth success / error states

### Backend – PDF Service

- PDF Service (Puppeteer)
- Template Management (Basic / Premium)

### Admin Dashboard – User & Billing

- **LectGen-AI User List Management**
  - CRUD users
  - Assign role FREE / VIP

- **LectGen-AI User Details**
  - Thông tin user
  - Trạng thái subscription

- **LectGen-AI Subscriptions & Billing**
  - Gói VIP
  - Doanh thu
  - Subscription status

- **LectGen-AI General Settings**
  - Cấu hình hệ thống chung

---

## 🖼️ Dũng  
**Backend – Vision Service, Usage, Quota & Admin Monitoring**

Dũng tiếp quản toàn bộ **monitoring + quota + log**, đúng với backend-heavy scope.

### Backend – Vision Service

- Image → Style Analysis
- Extract:
  - Color scheme
  - Layout type
  - Font style
- Generate style prompt gửi Core AI Service

### User App – Image Input

- Upload ảnh mẫu
- Preview style analysis
- API phân tích ảnh

### Admin Dashboard – Monitoring

- **LectGen-AI Usage & Quota Overview**
  - Thống kê usage AI
  - Quota theo user / gói
  - Rate limiting

- **LectGen-AI Dashboard Overview**
  - KPI tổng
  - Biểu đồ sử dụng hệ thống

- **LectGen-AI System Logs**
  - View / filter log
  - Audit system actions

---

## ✅ TÓM TẮT PHÂN CÔNG 

- **Bình**
  - User Chat App
  - Speech Service AI
  - Admin: Slide & Content

- **An**
  - Core AI Service
  - Admin: AI Models Config

- **Thiện**
  - Auth & Onboarding
  - PDF Service
  - Admin: Users, Billing, Settings

- **Dũng**
  - Vision Service
  - Admin: Usage, Quota, Dashboard Overview, System Logs

---
