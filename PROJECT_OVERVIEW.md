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
  - Nút "Upgrade to VIP"

#### **D. Settings Dropdown (Góc phải trên)**

- Logout
- View history
- Account settings
- Help/Documentation

---

### **2. Backend (API Services)**

#### **A. Core Services**

1. **AI Service (Langchain + Gemini)**
   - Text → Structured slide data (JSON)
   - 2 models:
     - FREE: `gemini-1.5-flash` (faster, basic)
     - VIP: `gemini-2.0-flash-exp` (slower, advanced content)
2. **Speech Service**
   - Audio file → Text transcript
   - Dùng Google Speech-to-Text API
   - Support Vietnamese accent
3. **Vision Service**
   - Image → Style analysis
   - Extract: color scheme, layout type, font style
   - Output: style prompt để inject vào AI
4. **PDF Service (Puppeteer)**
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

#### **PostgreSQL (dùng Prisma ORM)**

**Users Table:**

```
- id: UUID
- email: string (unique)
- password_hash: string
- role: enum (FREE, VIP, ADMIN)
- slides_generated: int
- max_slides_per_month: int
- subscription_expires_at: datetime (cho VIP)
- created_at, updated_at
```

**Conversations Table:**

```
- id: UUID
- user_id: foreign key
- title: string (auto-generate từ first message)
- created_at, updated_at
```

**Messages Table:**

```
- id: UUID
- conversation_id: foreign key
- role: enum (USER, ASSISTANT)
- message_type: enum (TEXT, AUDIO, IMAGE)
- content_text: text (nếu TEXT)
- audio_url: string (MinIO link)
- image_url: string (MinIO link)
- transcript: text (nếu AUDIO → text)
- style_analysis: json (nếu IMAGE)
- pdf_url: string (link PDF đã generate)
- slide_count: int
- created_at
```

**Templates Table (VIP Marketplace - phase sau):**

```
- id: UUID
- created_by: foreign key (user_id)
- name: string
- preview_image: string
- style_config: json
- price: decimal (nếu bán)
- downloads: int
```

---

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

---

## 🎨 **ROADMAP CHO 2 THÁNG (5 Developers)**

### **🔥 PRIORITY: Làm những gì QUAN TRỌNG NHẤT trước**

---

## **📅 SPRINT PLAN (4 sprints x 2 weeks)**

### **Sprint 1 (Tuần 1-2): Foundation & MVP Core**

#### **Team Setup:**

- **Dev 1 (Backend Lead):** Database + Auth
- **Dev 2 (Backend):** AI Service + PDF Generation
- **Dev 3 (Frontend Lead):** Chat UI + Routing
- **Dev 4 (Frontend):** Auth UI + State Management
- **Dev 5 (DevOps/Fullstack):** Docker setup + API integration

#### **Deliverables:**

✅ **Backend:**

- [ ] PostgreSQL + Prisma setup
- [ ] Users, Conversations, Messages schema
- [ ] JWT authentication (register/login/logout)
- [ ] `/api/auth/*` routes
- [ ] `/api/generate` endpoint (text only)
- [ ] AI Service: Gemini integration
- [ ] PDF Service: Puppeteer basic template

✅ **Frontend:**

- [ ] Project setup (Vite + React + TailwindCSS)
- [ ] Login/Register pages
- [ ] Protected routes
- [ ] Chat interface layout (sidebar + chat area + input)
- [ ] Text input only
- [ ] Download PDF button

✅ **DevOps:**

- [ ] Docker Compose (PostgreSQL + Backend + Frontend)
- [ ] Environment variables setup
- [ ] Local development workflow

**Demo:** User có thể register → login → chat text → nhận PDF

---

### **Sprint 2 (Tuần 3-4): Multi-Input & Storage**

#### **Focus:**

- **Dev 1:** MinIO integration + File upload service
- **Dev 2:** Google Speech-to-Text + Audio processing
- **Dev 3:** Audio recording UI + Image upload UI
- **Dev 4:** Chat history + Conversation management
- **Dev 5:** API routes cho audio/image + Testing

#### **Deliverables:**

✅ **Backend:**

- [ ] MinIO setup (Docker)
- [ ] Upload service (audio + image)
- [ ] Speech-to-Text integration
- [ ] Gemini Vision integration (style analysis)
- [ ] `/api/generate/audio` endpoint
- [ ] `/api/generate/with-template` endpoint
- [ ] Update Messages table (audio_url, image_url)

✅ **Frontend:**

- [ ] Audio recording component (Web Audio API)
- [ ] Waveform visualization
- [ ] Preview transcript modal
- [ ] Image upload + preview
- [ ] Style analysis display
- [ ] Chat history sidebar (list conversations)
- [ ] New chat button

✅ **Storage:**

- [ ] MinIO buckets: audio-recordings, template-images, generated-pdfs
- [ ] Presigned URL generation

**Demo:** User có thể record audio → preview transcript → generate PDF
User có thể upload ảnh mẫu → xem style analysis → generate PDF

---

### **Sprint 3 (Tuần 5-6): VIP System & Rate Limiting**

#### **Focus:**

- **Dev 1:** Quota system + Rate limiting middleware
- **Dev 2:** Premium templates + Better AI prompts
- **Dev 3:** VIP badge + Usage display UI
- **Dev 4:** Upgrade to VIP page + Feature comparison
- **Dev 5:** Queue system (BullMQ) + Redis

#### **Deliverables:**

✅ **Backend:**

- [ ] Update schema: `slides_generated`, `max_slides_per_month`
- [ ] Middleware: `checkQuota()`
- [ ] Increment usage after generation
- [ ] BullMQ setup (job queue cho PDF generation)
- [ ] Redis setup (caching)
- [ ] 2 AI models (FREE vs VIP)
- [ ] 2 PDF templates (basic vs premium)

✅ **Frontend:**

- [ ] User profile dropdown (show role + usage)
- [ ] Quota display: "3/5 slides used"
- [ ] "Upgrade to VIP" button
- [ ] Pricing page (feature comparison table)
- [ ] Block UI when quota exceeded (show upgrade prompt)

✅ **Features:**

- [ ] FREE: 5 slides/month, text only, basic template
- [ ] VIP: Unlimited, audio+image, premium template

**Demo:** FREE user tạo 5 slides → bị block → see upgrade prompt
VIP user tạo unlimited slides với premium template

---

### **Sprint 4 (Tuần 7-8): Admin Dashboard & Polish**

#### **Focus:**

- **Dev 1 + Dev 5:** Admin backend APIs
- **Dev 2:** Admin frontend (Next.js app)
- **Dev 3 + Dev 4:** Bug fixes + UI polish + Responsive design
- **Testing:** E2E testing + Load testing

#### **Deliverables:**

✅ **Admin Dashboard:**

- [ ] Admin authentication
- [ ] Dashboard overview (stats cards + charts)
- [ ] Users management table
- [ ] View user details + chat history
- [ ] Change user role (FREE/VIP/ADMIN)
- [ ] Global chat history viewer

✅ **Backend:**

- [ ] `/api/admin/users` (CRUD)
- [ ] `/api/admin/stats` (analytics)
- [ ] `/api/admin/chats` (all chats)
- [ ] Admin middleware (verify role)

✅ **Polish:**

- [ ] Error handling (toast notifications)
- [ ] Loading states (skeletons)
- [ ] Responsive design (mobile support)
- [ ] Dark mode (optional)
- [ ] Performance optimization
- [ ] Security audit

✅ **Testing:**

- [ ] Unit tests (backend services)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load testing (100 concurrent users)

**Demo:** Admin login → xem dashboard → quản lý users → xem chat history
Full product ready to deploy

---

## 📊 **TECH STACK HOÀN CHỈNH**

### **Frontend:**

- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/ui (UI components)
- TanStack Query (API state)
- Zustand (global state)
- React Router v6 (routing)
- Axios (HTTP client)
- React Hook Form (forms)

### **Backend:**

- Node.js + TypeScript
- Express.js (web framework)
- Prisma (ORM)
- PostgreSQL (database)
- MinIO (object storage)
- BullMQ + Redis (job queue)
- JWT (auth)
- Zod (validation)

### **AI/ML:**

- Langchain
- Google Gemini API (text generation + vision)
- Google Speech-to-Text API
- Puppeteer (PDF rendering)

### **Admin:**

- Next.js 14 (SSR admin app)
- Recharts (analytics)
- TanStack Table (data grid)

### **DevOps:**

- Docker + Docker Compose
- Nginx (reverse proxy)
- GitHub Actions (CI/CD)

---

## 👥 **PHÂN CÔNG TEAM (5 Developers)**

### **Backend Team (2 devs):**

**Dev 1 - Backend Lead:**

- Database schema design
- Authentication & authorization
- Rate limiting & quota system
- Admin APIs

**Dev 2 - AI Specialist:**

- Langchain + Gemini integration
- Speech-to-Text integration
- Vision API integration
- PDF generation (Puppeteer)

### **Frontend Team (2 devs):**

**Dev 3 - Frontend Lead:**

- Project architecture
- Chat interface UI
- Routing & state management
- Responsive design

**Dev 4 - UI/UX Developer:**

- Auth pages (login/register)
- Audio recording component
- Image upload component
- Chat history sidebar
- VIP upgrade page

### **Fullstack/DevOps (1 dev):**

**Dev 5 - DevOps & Integration:**

- Docker setup
- CI/CD pipeline
- MinIO integration
- BullMQ + Redis setup
- API integration (connect frontend ↔ backend)
- Admin dashboard (Next.js)
- Testing & deployment

---

## ⚠️ **RỦI RO & GIẢI PHÁP**

### **1. Timeline Rất GẤP (2 tháng)**

- **Rủi ro:** Không đủ thời gian làm tất cả features
- **Giải pháp:**
  - **CUT SCOPE:** Không làm payment integration trong 2 tháng
  - **CUT SCOPE:** Template marketplace → phase sau
  - **CUT SCOPE:** Slide editor → phase sau
  - Focus 100% vào: Chat + AI + Auth + Admin basic

### **2. AI Cost**

- **Rủi ro:** Gemini API không free, nhiều user = tốn tiền
- **Giải pháp:**
  - Set hard limit: 1000 requests/ngày
  - Monitor cost real-time
  - Cache popular topics (Redis)

### **3. Performance**

- **Rủi ro:** Puppeteer tốn RAM, 100 concurrent users = crash
- **Giải pháp:**
  - Queue system (max 10 concurrent jobs)
  - Timeout: 60s per job

### **4. Abuse**

- **Rủi ro:** User tạo nhiều account FREE để bypass limit
- **Giải pháp:**
  - Email verification bắt buộc
  - Rate limit per IP: max 3 accounts/IP

### **5. Audio Quality**

- **Rủi ro:** Speech-to-Text sai với Vietnamese accent
- **Giải pháp:**
  - Preview transcript trước khi generate
  - Nút "Edit transcript" để sửa

---

## 🎯 **SUCCESS METRICS**

### **KPIs cần track:**

1. **User Acquisition:**

   - Sign-ups/tháng
   - FREE → VIP conversion rate (target: 5%)

2. **Engagement:**

   - Slides generated/user/tháng
   - Chat sessions/user/tuần
   - Retention rate (D7, D30)

3. **Product:**
   - AI generation success rate (target: > 95%)
   - Avg PDF generation time (target: < 30s)
   - User satisfaction (NPS score)

---

## 🚀 **DELIVERABLES SAU 2 THÁNG**

### **✅ Phải có (MVP):**

1. Chat interface với text/audio/image input
2. AI generate slides (Gemini)
3. PDF export
4. Authentication (register/login)
5. FREE/VIP tiers với quota system
6. Chat history
7. Admin dashboard (basic: users management + chat history)
8. Docker deployment ready

### **⏸️ Không có (để sau):**

1. Payment integration (Stripe/VNPay)
2. Slide editor
3. Template marketplace
4. Collaboration features
5. PPTX export
6. Advanced analytics

---

## 📝 **NEXT STEPS**

### **Week 0 (Chuẩn bị):**

- [ ] Kickoff meeting (align vision)
- [ ] Setup GitHub repo (monorepo structure)
- [ ] Create project board (Jira/Trello)
- [ ] Design mockups (Figma - high priority screens)
- [ ] Setup development environment
- [ ] Get API keys (Gemini, Speech-to-Text)

### **Day 1:**

- [ ] Sprint 1 planning
- [ ] Assign tasks
- [ ] Start coding!

---

## 🎨 **DESIGN PRIORITIES**

### **Must Design (Figma):**

1. Login/Register pages
2. Chat interface (desktop)
3. Sidebar + conversation list
4. Input panel (text/audio/image tabs)
5. Admin dashboard overview

### **Can Skip:**

- Mobile design (làm responsive sau)
- Dark mode (optional)
- Onboarding flow

---

## 💡 **TIPS ĐỂ THÀNH CÔNG**

1. **Daily Standups (15 min):**

   - What I did yesterday
   - What I'll do today
   - Any blockers

2. **Sprint Reviews (Cuối mỗi sprint):**

   - Demo working features
   - Retrospective (what went well/wrong)

3. **Code Reviews:**

   - Mỗi PR cần 1 reviewer approve
   - Use PR templates

4. **Testing:**

   - Write tests ngay từ đầu
   - Automated testing (CI)

5. **Communication:**

   - Slack/Discord channel
   - Document decisions (ADR - Architecture Decision Records)

6. **Focus:**
   - Không làm features ngoài scope
   - "Done is better than perfect"

---

## 🏁 **FINAL NOTES**

**2 tháng = 8 tuần = 4 sprints**

Nếu team làm việc hiệu quả:

- **MVP hoàn chỉnh** (chat + AI + auth + admin)
- **Ready to demo** cho stakeholders
- **Ready to deploy** lên production

**Không nên kỳ vọng:**

- Payment system hoàn chỉnh
- Advanced features (editor, marketplace)
- Perfect UI/UX polish

**Mindset:**

> "Ship fast, iterate later. Get MVP to users ASAP and collect feedback."

---

**Good luck team! 🚀**
