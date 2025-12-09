# 📋 Ý TƯỞNG DỰ ÁN: **LectGen-AI - AI Slide Generator Platform**

---

## 🎯 **TỔNG QUAN DỰ ÁN**

### **Concept**

Một nền tảng tạo slide bài giảng tự động bằng AI, cho phép người dùng tương tác qua **chat interface** (giống ChatGPT/Gemini) với khả năng nhập liệu đa dạng: **text, audio, và ảnh mẫu**. Hệ thống phân cấp người dùng FREE/VIP với admin dashboard quản lý toàn diện.

### **Giải quyết vấn đề gì?**

- Giảng viên/sinh viên mất nhiều thời gian làm slide
- Người không giỏi thiết kế cần template đẹp
- Cần tạo slide nhanh từ ý tưởng (text/voice)

### **Timeline: 2 THÁNG với 5 Developers**

---

## 🏗️ **KIẾN TRÚC HỆ THỐNG**

### **1. Frontend (User App)**

**Giao diện chính - ChatGPT-like Interface:**

#### **A. Chat Area (80% màn hình)**

- Hiển thị lịch sử hội thoại (user prompt + AI response)
- Mỗi response có:
  - Preview slide thumbnail
  - Nút "Download PDF"
  - Nút "Edit Slide" (xem sau)
  - Metadata: timestamp, số slide, file size

#### **B. Input Panel (20% màn hình dưới cùng)**

**3 tab input:**

1. **📝 Text Tab** (default)
   - Textbox lớn với placeholder: "Mô tả chủ đề bài giảng..."
   - Gợi ý prompt mẫu (dropdown)
2. **🎤 Audio Tab**
   - Nút Record (bấm giữ để nói)
   - Hiển thị waveform khi đang record
   - Preview transcript trước khi generate
3. **🖼️ Template Tab**
   - Upload 1 ảnh slide mẫu
   - AI phân tích và show preview: "Phát hiện style: Minimalist, màu xanh dương, bullet points..."
   - User confirm trước khi generate

#### **C. Sidebar (Trái)**

- **New Chat** button
- Lịch sử conversations (group theo ngày)
- User profile:
  - Avatar + tên
  - Role badge (FREE/VIP)
  - Usage: "3/5 slides used" (FREE) hoặc "∞ Unlimited" (VIP)
  - Nút "Upgrade to VIP" và sau khi bấm vào đưa người dùng đến trang hỗ trợ upgrade account lên tài khoản vip

#### **D. Settings Dropdown (Góc phải trên)**

- Logout
- View history
- Account settings
- Help/Documentation

---

### **2. Backend (API Services)**

#### **A. Core Services**

1. **AI Service (Langchain + Gemini)** ( An làm )
   - Text → Structured slide data (JSON)
   - 2 models:
     - FREE: `gemini-1.5-flash` (faster, basic)
     - VIP: `gemini-2.0-flash-exp` (slower, advanced content)
2. **Speech Service** ( Bình làm ) 
   - Audio file → Text transcript
   - Dùng Google Speech-to-Text API
   - Support Vietnamese accent
3. **Vision Service** ( Dũng )
   - Image → Style analysis
   - Extract: color scheme, layout type, font style
   - Output: style prompt để inject vào AI
4. **PDF Service (Puppeteer)** ( Thiện )
   - JSON slide data → Rendered PDF
   - 2 template levels:
     - FREE: Basic template (simple, 1-2 colors)
     - VIP: Premium template (gradients, icons, charts)

#### **B. Authentication & Authorization**

- JWT tokens (access + refresh)
- Roles: USER (FREE), VIP, ADMIN
- Password hashing: bcrypt

#### **C. Rate Limiting & Quota**

- FREE users:
  - Max 5 slides/month (reset đầu tháng)
  - Only text input
  - Basic template
- VIP users:
  - Unlimited slides
  - Audio + Image input
  - Premium templates
  - Priority queue (generate nhanh hơn)

---

### **3. Database Schema**

#### **PostgreSQL (dùng Sequelize)**


### **4. Storage (MinIO)**

#### **Buckets:**

1. **`audio-recordings`**

   - Format: `{user_id}/{conversation_id}/{timestamp}.webm`
   - Retention: 30 days (tự động xóa)

2. **`template-images`**

   - Format: `{user_id}/{conversation_id}/{timestamp}.jpg`
   - Retention: 90 days

3. **`generated-pdfs`**

   - Format: `{user_id}/{conversation_id}/{message_id}.pdf`
   - Retention: Permanent (hoặc 1 năm cho FREE)

4. **`user-avatars`**
   - Format: `{user_id}/avatar.jpg`

---

### **5. Admin Dashboard (Riêng biệt)**

#### **Pages:**

**A. Dashboard Overview**

- Cards:
  - Total Users (FREE/VIP split với pie chart)
  - Slides Generated Today/This Month (line chart)
  - Storage Used (progress bar)
  - Revenue This Month (nếu có payment)
- Recent Activity Feed (10 actions gần nhất)

**B. Users Management**

- Table columns:
  - Email, Role, Slides Used, Join Date, Last Active
- Filters: Role, Date range, Search
- Actions per row:
  - View Details
  - Change Role (FREE ↔ VIP ↔ ADMIN)
  - Reset Quota
  - Ban/Unban
  - Delete Account

**C. User Details Page**

- Tabs:
  - **Overview:** Profile info, statistics
  - **Chat History:** List conversations với preview
  - **Activity Log:** Login history, API calls
  - **Billing:** Payment history (nếu có)

**D. Chat History (Global)**

- Table với columns:
  - User Email, Conversation Title, Message Count, Created Date
- Click vào conversation → Xem full chat
- Inline preview:
  - Text messages: show content
  - Audio: play button
  - Image: thumbnail modal
  - PDF: download link

**E. System Settings**

- Quota config (FREE user limits)
- AI model selection
- MinIO connection test
- Maintenance mode toggle

**F. Analytics**

- Charts:
  - User growth (daily/monthly)
  - Slide generation trends
  - Most used features (text/audio/image %)
  - Peak usage hours (heatmap)





> "Ship fast, iterate later. Get MVP to users ASAP and collect feedback."

---

**Good luck team! 🚀**
