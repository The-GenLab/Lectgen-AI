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

## 🏗️ CẤU TRÚC HỆ THỐNG

### Kiến trúc tổng quan

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  Database   │
│  (React)    │◀─────│  (Express)   │◀─────│ (PostgreSQL)│
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ├─▶ MinIO (File Storage)
                           ├─▶ Gemini AI (LangChain)
                           └─▶ Whisper (Speech-to-Text)
```

### Stack công nghệ

- **Frontend**: React + TypeScript + Tailwind CSS + Ant Design
- **Backend**: Node.js + Express + TypeScript + Sequelize ORM
- **Database**: PostgreSQL
- **Storage**: MinIO (S3-compatible)
- **AI Services**:
  - Google Gemini (via LangChain) - Slide generation
  - Whisper (Local Docker) - Speech-to-text
- **Auth**: JWT (Access + Refresh tokens in HTTP-only cookies)

### Cấu trúc Backend Modules

```
backend/src/modules/
├── auth/          # Authentication & Authorization (JWT, login, register)
├── user/          # User management (profile, upgrade VIP)
├── conversation/  # Conversation CRUD
├── chat/          # AI Chat service (text/audio/image → LaTeX)
├── ai/            # Core AI Service (LangChain + Gemini)
├── speech/        # Speech-to-Text (Whisper integration)
├── template/      # Template image analysis & storage
├── file/          # Generic file operations (MinIO)
└── admin/         # Admin APIs (stats, logs, user management)
```

### Cấu trúc Frontend Pages

```
frontend/src/pages/
├── Auth/          # Login, Register, Forgot Password
├── Dashboard/     # Main Chat Interface (User App)
├── Settings/      # User settings, Avatar, Upgrade VIP
├── Payment/       # Checkout, Payment Success
└── Admin/         # Admin Dashboard, Users, Logs, Usage
```

### Database Schema (Core Models)

```
Users
  ├── id, email, name, avatarUrl
  ├── passwordHash, role (FREE/VIP/ADMIN)
  ├── slidesGenerated, maxSlidesPerMonth
  └── subscriptionExpiresAt

Sessions
  ├── id, userId
  ├── refreshToken
  └── expiresAt

Conversations
  ├── id, userId
  └── title

Messages
  ├── id, conversationId
  ├── role (USER/ASSISTANT)
  ├── messageType (TEXT/AUDIO/IMAGE)
  ├── contentText (LaTeX code)
  ├── audioUrl, imageUrl, transcript
  ├── styleAnalysis (JSONB)
  ├── pdfUrl, slideCount
  └── createdAt

UsageLogs
  ├── id, userId
  ├── actionType, status
  ├── metadata (JSONB)
  └── createdAt

TemplateFiles
  ├── id, userId
  ├── fileUrl, styleAnalysis
  └── createdAt
```

### Flow chính

**1. User tạo slide (Text Input)**

```
User Input → Chat API → AI Service → LaTeX → Database + MinIO
```

**2. User tạo slide (Audio Input)**

```
Audio → Speech Service (Whisper) → Text → Chat API → AI Service → LaTeX
```

**3. User tạo slide (Image Input)**

```
Image → Template Analysis → Style Prompt → Chat API → AI Service → LaTeX
```

**4. Authentication Flow**

```
Login → JWT Access Token (15m) + Refresh Token (7d) → HTTP-only cookies
Refresh → New Access Token (nếu Refresh Token còn hợp lệ)
```

### Storage Buckets (MinIO)

- `audio-recordings/` - Audio files từ user
- `template-images/` - Template images uploaded
- `avatars/` - User profile avatars
- `latex-files/` - Generated LaTeX files



