# 📋 PHÂN CHIA CÔNG VIỆC DỰ ÁN LECTGEN-AI

**Timeline:** 2 tháng (8 tuần) | **Team:** 5 Developers Fullstack | **Start:** 9/12/2024

---

## 👥 TEAM SETUP

| Dev | Tỉ lệ công việc | Ghi chú |
|-----|----------------|---------|
| **Bình** | 40% BE + 40% FE + 20% AI | Backend Lead |
| **An** | 30% BE + 30% FE + 40% AI | **AI Lead** |
| **Thiện** | 40% BE + 40% FE + 20% AI | Frontend Lead |
| **Dũng** | 40% BE + 40% FE + 20% AI 
| **Mai Anh** | 40% BE + 40% FE + 20% DevOps | 

---

## 🗓️ SPRINT 1 (9/12-23/12): FOUNDATION & MVP

**Mục tiêu:** Register → Login → Chat text → AI generate → Nhận PDF

---

### 🔹 BÌNH (Auth & Chat UI Lead)

**Module:** Authentication + Chat Interface

#### **BACKEND (6 ngày):**

1. **Database Setup (9-11/12)** - 3 ngày
   - Setup Sequelize + PostgreSQL
   - Models: User, Conversation, Message
   - Relations: User 1-N Conversations, Conversation 1-N Messages
   - Migrations + seed data (test users)
   - ✅ Test: Query users, create conversation OK

2. **Auth Service (12-14/12)** - 3 ngày
   - `POST /api/auth/register` - bcrypt hash password
   - `POST /api/auth/login` - JWT token (access 7d, refresh 30d)
   - `POST /api/auth/logout` - blacklist token
   - `GET /api/auth/me` - get current user
   - Middleware: `authenticate()`, `requireRole([ADMIN])`
   - ✅ Test: Postman login → get token → call /me

#### **FRONTEND (6 ngày):**

3. **Project Setup (15-16/12)** - 2 ngày
   - Vite + React + TypeScript + TailwindCSS
   - Folder structure: `/components`, `/pages`, `/services`, `/hooks`
   - Axios setup với interceptor (auto attach token)
   - React Router v6 config

4. **Auth Pages (17-19/12)** - 3 ngày
   - `LoginPage.tsx` - form (email, password), submit → save token
   - `RegisterPage.tsx` - form (email, password, confirmPassword)
   - Protected route HOC `<ProtectedRoute>`
   - Context: `AuthContext` (user state, login/logout functions)
   - ✅ Test: Register → auto login → redirect to `/chat`

5. **Chat Layout (20-23/12)** - 4 ngày
   - `ChatPage.tsx` - layout 3 columns:
     - Left sidebar (20%): New chat button, conversation list (mock data)
     - Center (60%): Chat messages area
     - Right (20%): User profile dropdown (avatar, role badge)
   - Component: `<Sidebar />`, `<ChatArea />`, `<InputPanel />`
   - Responsive: mobile collapse sidebar
   - ✅ Test: UI hiển thị đúng layout

#### **PHỤ THUỘC:**
- Task 3,4,5 chờ Task 2 (API /auth/*)
- Task 5 cần **Thiện** (Task 11) làm API `/api/conversations`

#### **AI (2 ngày):**

6. **AI Prompt Templates (21-23/12)** - 2 ngày
   - File `prompts.ts` - Define system prompts for Gemini
   - Template: "Generate {n} slides about {topic} with structure..."
   - Helper: `buildPrompt(userInput, templateStyle)`
   - ✅ Test: Pass to An's AI service

---

### 🔹 AN (AI Lead)

**Module:** AI Services (Gemini, Speech, Vision, PDF)

#### **AI/BACKEND (10 ngày):**

1. **Gemini Text Service (9-12/12)** - 4 ngày
   - Setup `@google/generative-ai` SDK
   - Service: `generateSlides(prompt: string)` → JSON structure
   - Model: `gemini-1.5-flash`
   - JSON schema: `{ slides: [{ title, content[], layout }] }`
   - Error handling: retry 3 times, timeout 30s
   - ✅ Test: Input "Bài giảng AI" → Output JSON 5 slides

2. **PDF Generation Service (13-16/12)** - 4 ngày
   - Setup Puppeteer
   - HTML template: `basic-template.html` (FREE tier)
   - Function: `renderPDF(slideData: JSON)` → Buffer
   - Inject data vào template, convert to PDF
   - ✅ Test: Input JSON → Output PDF file

3. **API Generate Endpoint (17-19/12)** - 3 ngày
   - `POST /api/generate` - body: `{ conversationId, message }`
   - Flow:
     1. Call Gemini (Task 1)
     2. Generate PDF (Task 2)
     3. Save to temp folder
     4. Return: `{ pdfUrl, slideCount, messageId }`
   - ✅ Test: Postman call → nhận PDF URL

#### **FRONTEND (2 ngày):**

4. **AI Loading States (20-21/12)** - 2 ngày
   - Component: `<GeneratingLoader />` - spinner + text "AI đang tạo slide..."
   - Progress bar (fake): 0% → 50% (Gemini) → 100% (PDF done)
   - ✅ Test: Show khi call API generate

#### **PHỤ THUỘC:**
- Task 3 cần **Dũng** (Task 16) cung cấp upload PDF lên MinIO
- Task 3 cần **Bình** (Task 2) có JWT middleware

---

### 🔹 THIỆN (Chat Features & VIP System)

**Module:** Chat Logic + Message Display + VIP

#### **BACKEND (6 ngày):**

1. **Conversation API (9-11/12)** - 3 ngày
   - `GET /api/conversations` - list user's conversations
   - `POST /api/conversations` - create new chat
   - `GET /api/conversations/:id` - get messages
   - `DELETE /api/conversations/:id`
   - ✅ Test: Create conversation, fetch messages

2. **Message API (12-14/12)** - 3 ngày
   - `POST /api/messages` - save user message
   - `GET /api/messages/:conversationId` - pagination
   - Update: `pdfUrl`, `slideCount` after AI done
   - ✅ Test: Send message → save DB → fetch back

#### **FRONTEND (6 ngày):**

3. **Chat Messages Display (15-17/12)** - 3 ngày
   - Component: `<MessageBubble />` - user/assistant styles
   - Show: text, timestamp
   - Assistant message: thumbnail preview (mock), Download button
   - Auto scroll to bottom
   - ✅ Test: Send message → appear in chat

4. **Input Panel - Text Tab (18-19/12)** - 2 ngày
   - Component: `<TextInput />` - textarea, send button
   - Handle: Enter to send, Shift+Enter new line
   - Call API: `/api/generate` with message
   - ✅ Test: Type text → click send → loading → PDF appears

5. **Conversation Sidebar (20-21/12)** - 2 ngày
   - Component: `<ConversationList />` - fetch `/api/conversations`
   - Group by date (Today, Yesterday, Last 7 days)
   - Click → load messages
   - New Chat button → create new conversation
   - ✅ Test: Click conversation → switch chat

#### **AI (2 ngày):**

6. **Prompt Suggestions (22-23/12)** - 2 ngày
   - Dropdown: 5 gợi ý prompt mẫu
   - "Bài giảng về Machine Learning cơ bản"
   - "Giới thiệu lịch sử Việt Nam"
   - Click → fill vào textarea
   - ✅ Test: Click suggestion → auto fill

#### **PHỤ THUỘC:**
- Task 3,4,5 cần **An** (Task 3) có API `/api/generate`
- Task 5 cần **Bình** (Task 1) có DB conversations

---

### 🔹 DŨNG (Upload & Storage & Admin)

**Module:** File Upload + MinIO + Admin Dashboard

#### **BACKEND (6 ngày):**

1. **MinIO Setup (9-10/12)** - 2 ngày
   - Docker MinIO service
   - Create buckets: `generated-pdfs`, `audio-recordings`, `template-images`
   - Service: `uploadFile(bucket, file)` → presigned URL
   - ✅ Test: Upload file → get public URL

2. **Upload Middleware (11-12/12)** - 2 ngày
   - Multer config: max 10MB
   - `POST /api/upload/pdf` - temp upload
   - `POST /api/upload/audio` - for Sprint 2
   - ✅ Test: Postman upload file → MinIO URL

3. **Admin User API (13-15/12)** - 3 ngày
   - `GET /api/admin/users` - list all users (pagination)
   - `PUT /api/admin/users/:id/role` - change role (FREE/VIP/ADMIN)
   - `PUT /api/admin/users/:id/quota` - reset slides_generated
   - Middleware: `requireRole([ADMIN])`
   - ✅ Test: Admin token → change user role

#### **FRONTEND (6 ngày):**

4. **Download PDF Button (16-17/12)** - 2 ngày
   - Component: `<DownloadButton pdfUrl={url} />`
   - Click → fetch file → trigger download
   - Show: file size, download icon
   - ✅ Test: Click → download PDF

5. **Admin Login (18-19/12)** - 2 ngày
   - Page: `AdminLoginPage.tsx` - separate route `/admin/login`
   - Check role after login → redirect to `/admin/dashboard`
   - ✅ Test: Admin login → access dashboard

6. **Admin Users Table (20-23/12)** - 4 ngày
   - Page: `AdminUsersPage.tsx`
   - Table columns: Email, Role, Slides Used, Join Date
   - Actions: Change Role dropdown, Reset Quota button
   - Filters: Search email, filter by role
   - ✅ Test: View users, change role, reset quota

#### **AI (2 ngày):**

7. **PDF Template Styles (21-23/12)** - 2 ngày
   - CSS styles cho basic template
   - Color schemes: Blue, Green, Purple
   - Helper: `applyStyle(template, colorScheme)`
   - ✅ Test: Generate PDF với màu khác nhau

#### **PHỤ THUỘC:**
- Task 2 cần **Mai Anh** (Task 1) setup MinIO
- Task 4 cần **An** (Task 3) return pdfUrl
- Task 6 cần **Bình** (Task 2) có admin auth

---

### 🔹 MAI ANH (DevOps & Integration)

**Module:** Docker, Testing, Deployment

#### **DEVOPS (6 ngày):**

1. **Docker Compose (9-11/12)** - 3 ngày
   - Services: postgres, minio, backend, frontend
   - Volumes: persist DB data, MinIO data
   - Networks: backend-network
   - Env files: `.env.example`
   - ✅ Test: `docker-compose up` → all services running

2. **Environment Setup (12-13/12)** - 2 ngày
   - `.env` template với comments
   - Secrets: JWT_SECRET, DATABASE_URL, GEMINI_API_KEY
   - Document: `SETUP.md` - how to run locally
   - ✅ Test: Fresh clone → follow guide → app works

3. **GitHub Repo Structure (14/12)** - 1 ngày
   - Setup monorepo: `/backend`, `/frontend`, `/admin`
   - `.gitignore` files
   - README.md với project overview
   - ✅ Test: Push code, CI không lỗi

#### **BACKEND (3 ngày):**

4. **Health Check API (15/12)** - 1 ngày
   - `GET /api/health` - return: DB status, MinIO status
   - Check connections, return 200 OK
   - ✅ Test: Call endpoint → all services up

5. **Error Handler Middleware (16-17/12)** - 2 ngày
   - Catch all errors → format response
   - Log errors to console (use Winston)
   - Return: `{ error: message, statusCode }`
   - ✅ Test: Trigger error → proper response

#### **FRONTEND (3 ngày):**

6. **API Service Layer (18-19/12)** - 2 ngày
   - File: `api.ts` - axios instance
   - Interceptor: auto add token header
   - Interceptor: refresh token if 401
   - ✅ Test: Call API → token auto attached

7. **Toast Notifications (20/12)** - 1 ngày
   - Setup `react-toastify`
   - Success/Error/Info toasts
   - ✅ Test: Show toast on actions

#### **TESTING (3 ngày):**

8. **Backend Unit Tests (21-23/12)** - 3 ngày
   - Test: Auth service (register, login)
   - Test: Gemini service (mock API)
   - Test: PDF service (mock Puppeteer)
   - Coverage: >60%
   - ✅ Test: `npm test` all pass

#### **PHỤ THUỘC:**
- Task 1 phải XONG ĐẦU TIÊN (tất cả dev cần Docker)
- Task 8 cần code của **Bình** (Auth) và **An** (AI)

---

## 📊 SPRINT 1 DEPENDENCIES MAP
