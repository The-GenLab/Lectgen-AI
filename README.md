# 📋 PHÂN CHIA CÔNG VIỆC DỰ ÁN LECTGEN-AI

**Timeline:** 2 tháng (8 tuần) | **Team:** 5 Developers | **Start:** 9/12/2024

---

## 👥 TEAM

| Dev | Vai trò | Module chính |
|-----|---------|--------------|
| **Bình** | Backend Lead | Auth, Database, Admin Backend |
| **An** | AI Lead | Gemini, Speech-to-Text, Vision, PDF |
| **Thiện** | Frontend Lead | Chat UI, Routing, VIP Features |
| **Dũng** | Fullstack | Auth UI, Upload Components, Admin Frontend |
| **Mai Anh** | DevOps | Docker, MinIO, Redis, BullMQ, Testing (KHÔNG LÀM AI) |

---

## 🗓️ SPRINT 1 (9/12-23/12): FOUNDATION & MVP

**Mục tiêu:** Register → Login → Chat text → Nhận PDF

---

### 🔹 BÌNH - Backend Lead

**Module:** Auth & Database

**Tasks Backend (70%):**

1. **Database Setup (9-11/12)**
   - Config Sequelize + PostgreSQL
   - Models: User, Conversation, Message
   - Migrations + seed data (2 users, 5 conversations)
   - ✅ DB connection OK, relationships work

2. **JWT Auth (12-14/12)**
   - Service: register(), login(), verifyToken()
   - Middleware: authenticate(), requireRole()
   - Bcrypt hash password, JWT token 7 days
   - ✅ Register/login work, token verify OK

3. **Auth Routes (15-16/12)**
   - POST /api/auth/register, /login, GET /me
   - Zod validation: email format, password 8+ chars
   - ✅ API endpoints tested

**Tasks Frontend (30%):**

4. **Auth Integration (16-17/12)**
   - Services: authApi.ts
   - Update Login.tsx, Register.tsx
   - Save token → localStorage, redirect /chat
   - ✅ Login flow work end-to-end

**Phụ thuộc:** Không

---

### 🔹 AN - AI Lead

**Module:** AI Services & PDF

**Tasks Backend (85%):**

1. **Gemini API (9-12/12)**
   - Service: generateSlideContent()
   - FREE: gemini-1.5-flash, VIP: gemini-2.0-flash-exp
   - Prompt template → JSON slides
   - ✅ Return valid JSON, retry 3x if rate limit

2. **Puppeteer PDF (13-16/12)**
   - Templates: basic.ejs (FREE), premium.ejs (VIP)
   - Service: renderPDF(slideData, template)
   - Puppeteer A4, printBackground: true
   - ✅ PDF < 30s cho 10 slides, no memory leaks

3. **Generate Endpoint (17-18/12)**
   - POST /api/generate (text only)
   - Middleware: authenticate()
   - Flow: Check conversation → Gemini → PDF → Save Message
   - ✅ Return messageId + pdfUrl

**Tasks Frontend (15%):**

4. **Message Display (19-20/12)**
   - Component: MessageItem.tsx
   - Show PDF icon + Download button
   - ✅ Download PDF work

**Phụ thuộc:** Task 3 cần Bình Task 2 (auth middleware)

---

### 🔹 THIỆN - Frontend Lead

**Module:** Chat UI & Routing

**Tasks Frontend (80%):**

1. **Project Setup (9/12)**
   - Verify dependencies: React, TailwindCSS, Zustand, Axios
   - Setup ESLint + Prettier
   - ✅ npm run dev OK, hot reload work

2. **Layout (10-12/12)**
   - MainLayout: Grid [280px sidebar, 1fr chat]
   - Sidebar: Logo, New Chat button, conversation list
   - ChatArea: Empty state + message list
   - InputPanel: 3 tabs (Text active, Audio/Image disabled)
   - ✅ Responsive layout

3. **Routing (13-14/12)**
   - React Router: /login, /register, /chat, /chat/:id
   - ProtectedRoute: Check token → redirect if not logged in
   - ✅ Protected routes work

4. **State Management (15-16/12)**
   - Stores: authStore.ts, chatStore.ts
   - Persist auth to localStorage
   - ✅ State persist after refresh

**Tasks Backend (20%):**

5. **Conversation API (17-18/12)**
   - GET /api/conversations (list)
   - POST /api/conversations (create)
   - GET /api/conversations/:id/messages
   - ✅ API work

**Phụ thuộc:** Task 3 cần Bình Task 2 (auth)

---

### 🔹 DŨNG - Fullstack

**Module:** Auth UI & Validation

**Tasks Frontend (60%):**

1. **Login Page (9-11/12)**
   - Card layout: Logo + Form (email, password)
   - React Hook Form validation
   - Submit → authApi.login() → redirect /chat
   - ✅ Form validation + loading state

2. **Register Page (12-14/12)**
   - Form: email, password, confirm password
   - Password strength indicator (weak/medium/strong)
   - TOS checkbox required
   - ✅ Register → auto login

**Tasks Backend (40%):**

3. **Validation Middleware (15-17/12)**
   - Zod schemas: registerSchema, loginSchema, generateSchema
   - Middleware: validateBody(schema)
   - ✅ Return 400 with clear errors

4. **Error Handling (18-19/12)**
   - Global error handler
   - Custom error classes: UnauthorizedError, NotFoundError, etc.
   - Winston logger
   - ✅ Errors logged, no stack trace in prod

**Phụ thuộc:** Task 1-2 cần Bình Task 3 (auth API)

---

### 🔹 MAI ANH - DevOps

**Module:** Infrastructure (KHÔNG LÀM AI)

**Tasks (100%):**

1. **Docker Setup (9-10/12)**
   - docker-compose.dev.yml: postgres, pgadmin, backend, frontend
   - Dockerfile.dev cho backend + frontend
   - Hot reload volumes
   - ✅ docker compose up work

2. **Environment (11-12/12)**
   - .env files: backend (DB_URL, JWT_SECRET, GEMINI_KEY), frontend (API_URL)
   - Validation script: check required vars
   - ✅ Env vars loaded

3. **Migrations (13-15/12)**
   - Sequelize migrations: users, conversations, messages
   - Seeders: 3 demo users (FREE, VIP, ADMIN), conversations, messages
   - Commands: db:migrate, db:seed, db:reset
   - ✅ Seed data OK

4. **Documentation (16-17/12)**
   - README.md: Quick start guide
   - CONTRIBUTING.md: Git workflow
   - TROUBLESHOOTING.md: Common issues
   - ✅ Setup < 10 mins

5. **API Testing (18-19/12)**
   - Postman collection: Auth, Conversations, Generate
   - Environment: baseUrl, token auto-set
   - Test assertions: status codes, schemas
   - ✅ All endpoints pass

**Phụ thuộc:** Task 3 cần Bình Task 1, Task 5 cần Bình + An APIs

---

## 📊 SPRINT 1 DELIVERABLES (23/12)

✅ Backend: Auth system, DB, /api/generate (text)
✅ Frontend: Login/Register, Chat UI, Protected routes
✅ DevOps: Docker, migrations, API tests
✅ Demo: Register → Login → Generate slides → Download PDF

---

## 🗓️ SPRINT 2 (24/12-6/1): MULTI-INPUT & STORAGE

**Mục tiêu:** Audio + Image + MinIO

---

### 🔹 BÌNH - MinIO & Upload

**Tasks Backend (100%):**

1. **MinIO Setup (24-26/12)**
   - docker-compose: minio service
   - 4 buckets: audio-recordings, template-images, generated-pdfs, user-avatars
   - ✅ MinIO accessible localhost:9001

2. **Storage Service (27-29/12)**
   - uploadFile(), generatePresignedUrl(), deleteFile()
   - Validate file size/type
   - ✅ Upload to MinIO OK

3. **Upload Endpoints (30/12-1/1)**
   - POST /api/upload/audio (max 10MB, webm/mp3/wav)
   - POST /api/upload/image (max 5MB, jpeg/png)
   - Multer memory storage
   - ✅ Return MinIO URLs

**Phụ thuộc:** Không

---

### 🔹 AN - Speech & Vision

**Tasks Backend (100%):**

1. **Speech-to-Text (24-27/12)**
   - Google Speech-to-Text API
   - Service: transcribeAudio(audioUrl)
   - Config: vi-VN, punctuation: true
   - ✅ Vietnamese audio → correct transcript

2. **Gemini Vision (28-30/12)**
   - Service: analyzeSlideStyle(imageUrl)
   - Extract: color scheme, layout, font, mood
   - ✅ Return JSON style analysis

3. **Audio/Template Endpoints (31/12-2/1)**
   - POST /api/generate/audio: Audio → transcript → slides
   - POST /api/generate/with-template: Image → style → styled slides
   - ✅ Both flows work

**Phụ thuộc:** Task 3 cần Bình Task 2 (storage)

---

### 🔹 THIỆN - Audio & Chat History

**Tasks Frontend (90%):**

1. **Audio Recorder (24-27/12)**
   - Component: AudioRecorder.tsx
   - Web Audio API: MediaRecorder
   - Waveform canvas visualization
   - Max 1 min, auto-stop
   - ✅ Record + preview + delete work

2. **Audio Upload Flow (28-30/12)**
   - Modal: TranscriptPreviewModal.tsx
   - Flow: Record → upload → transcribe → preview → edit → generate
   - Progress bar
   - ✅ End-to-end flow < 10s

3. **Chat History (31/12-2/1)**
   - Update Sidebar: Group conversations by date (Today, Yesterday, Last 7 days)
   - Search bar, infinite scroll
   - Click conversation → load messages
   - ✅ Conversations grouped correctly

**Tasks Backend (10%):**

4. **Conversation CRUD (2/1)**
   - PATCH /api/conversations/:id (rename)
   - DELETE /api/conversations/:id (soft delete)
   - ✅ Update/delete work

**Phụ thuộc:** Task 2 cần Bình Task 3 + An Task 1

---

### 🔹 DŨNG - Image Upload & Admin

**Tasks Frontend (80%):**

1. **Image Uploader (24-26/12)**
   - Component: ImageUploader.tsx
   - Drag & drop + file picker
   - Preview thumbnail 200x200px
   - Validate: jpeg/png, max 5MB
   - ✅ Drag & drop work

2. **Style Analysis UI (27-29/12)**
   - Modal: StyleAnalysisModal.tsx
   - Display: color swatches, layout preview, mood text
   - Confirm button → generate with style
   - ✅ Style display accurate

3. **Admin Setup (30/12-2/1)**
   - Next.js app in admin/ folder
   - Pages: Dashboard, Users Management
   - Login page với admin role check
   - ✅ Admin app runs

**Tasks Backend (20%):**

4. **Admin APIs (2/1)**
   - GET /api/admin/users (list)
   - GET /api/admin/stats (overview)
   - Middleware: requireRole(['ADMIN'])
   - ✅ Admin APIs protected

**Phụ thuộc:** Task 2 cần An Task 2 (vision)

---

### 🔹 MAI ANH - Redis & Queue

**Tasks (100%):**

1. **Redis Setup (24-25/12)**
   - docker-compose: redis service
   - Test connection
   - ✅ Redis accessible

2. **BullMQ Queue (26-28/12)**
   - Install bullmq
   - Queue: pdf-generation
   - Worker: Process PDF jobs
   - Max 10 concurrent
   - ✅ Queue work, no memory leaks

3. **Update PDF Flow (29/12-1/1)**
   - Generate endpoint → add job to queue
   - Worker → render PDF → upload MinIO → update Message
   - ✅ Async PDF generation work

4. **Monitoring (2/1)**
   - Bull Board UI (optional)
   - Log queue metrics
   - ✅ Monitor queue performance

**Phụ thuộc:** Task 3 cần An Task 3 (generate endpoints)

---

## 📊 SPRINT 2 DELIVERABLES (6/1)

✅ Audio: Record → transcribe → generate
✅ Image: Upload → analyze style → styled slides
✅ Storage: MinIO for all files
✅ Queue: BullMQ for PDF generation
✅ Demo: Full multi-input flow

---

## 🗓️ SPRINT 3 (7-20/1): VIP SYSTEM & RATE LIMITING

**Mục tiêu:** Quota system, VIP features, Premium templates

---

### 🔹 BÌNH - Quota System

**Tasks Backend (100%):**

1. **Quota Middleware (7-9/1)**
   - Update User model: slidesGenerated, maxSlidesPerMonth
   - Middleware: checkQuota()
   - Increment slidesGenerated after generate
   - ✅ FREE blocked at 5 slides

2. **Monthly Reset (10-11/1)**
   - Cron job: Reset slidesGenerated đầu tháng
   - Service: resetMonthlyQuotas()
   - ✅ Auto-reset work

3. **VIP Endpoints (12-13/1)**
   - PATCH /api/users/upgrade-to-vip (admin only)
   - GET /api/users/quota (current usage)
   - ✅ Quota APIs work

**Phụ thuộc:** Không

---

### 🔹 AN - Premium Features

**Tasks Backend (100%):**

1. **Premium Templates (7-10/1)**
   - Create premium-v2.ejs: Gradients, icons, charts
   - Update renderPDF(): VIP → premium-v2
   - ✅ Premium template better quality

2. **Better Prompts (11-13/1)**
   - VIP prompt: More detailed, structured
   - Add examples in prompt
   - ✅ VIP slides higher quality

3. **Priority Queue (14-16/1)**
   - BullMQ: VIP jobs priority 1, FREE priority 5
   - ✅ VIP generate faster

**Phụ thuộc:** Task 3 cần Mai Anh Sprint 2 Task 2 (BullMQ)

---

### 🔹 THIỆN - VIP UI

**Tasks Frontend (100%):**

1. **Usage Display (7-9/1)**
   - Sidebar: Show "3/5 slides used" (FREE), "∞ Unlimited" (VIP)
   - Badge: FREE (gray), VIP (gold)
   - ✅ Quota display accurate

2. **Upgrade Prompt (10-12/1)**
   - Modal: QuotaExceededModal.tsx
   - Show when FREE user hits limit
   - Button: "Upgrade to VIP"
   - ✅ Block UI when quota exceeded

3. **Pricing Page (13-16/1)**
   - Page: Pricing.tsx
   - Feature comparison table: FREE vs VIP
   - ✅ Responsive design

**Phụ thuộc:** Task 1 cần Bình Task 1 (quota)

---

### 🔹 DŨNG - Admin Dashboard

**Tasks Frontend (70%):**

1. **Dashboard Overview (7-10/1)**
   - Cards: Total users, Slides generated, Storage used
   - Charts: User growth (Recharts)
   - ✅ Dashboard stats accurate

2. **Users Management (11-14/1)**
   - Table: Email, Role, Slides used, Join date
   - Actions: View, Change role, Reset quota, Delete
   - ✅ CRUD users work

**Tasks Backend (30%):**

3. **Admin Analytics (15-16/1)**
   - GET /api/admin/stats: User count, slide count
   - GET /api/admin/chats: All conversations
   - ✅ Analytics APIs work

**Phụ thuộc:** Task 1-2 cần Bình Sprint 3 Task 3 (VIP endpoints)

---

### 🔹 MAI ANH - Caching & Performance

**Tasks (100%):**

1. **Redis Caching (7-9/1)**
   - Cache popular prompts
   - Cache user quota
   - TTL: 1 hour
   - ✅ Cache hit rate > 50%

2. **Performance Testing (10-13/1)**
   - k6 load test: 100 concurrent users
   - Monitor: Response time, memory
   - ✅ No crashes, < 500ms avg response

3. **Monitoring Setup (14-16/1)**
   - Log aggregation (optional: ELK stack)
   - Health check endpoint: /health
   - ✅ Monitoring dashboard

**Phụ thuộc:** Không

---

## 📊 SPRINT 3 DELIVERABLES (20/1)

✅ Quota: FREE 5 slides/month, VIP unlimited
✅ Premium: Better templates + prompts for VIP
✅ Admin: Dashboard + Users management
✅ Performance: Caching + load tested
✅ Demo: FREE blocked → VIP upgrade → unlimited

---

## 🗓️ SPRINT 4 (21/1-3/2): POLISH & DEPLOYMENT

**Mục tiêu:** Bug fixes, Testing, Deploy ready

---

### 🔹 BÌNH - Admin APIs & Bug Fixes

**Tasks (100%):**

1. **Complete Admin APIs (21-23/1)**
   - POST /api/admin/users/:id/change-role
   - POST /api/admin/users/:id/reset-quota
   - DELETE /api/admin/users/:id
   - ✅ All admin APIs done

2. **Bug Fixes (24-27/1)**
   - Fix reported bugs từ Sprint 1-3
   - Security audit: SQL injection, XSS
   - ✅ No critical bugs

3. **Performance Optimization (28-30/1)**
   - Optimize DB queries (add indexes)
   - Connection pooling tuning
   - ✅ Query time < 50ms

**Phụ thuộc:** Không

---

### 🔹 AN - AI Optimization & Testing

**Tasks (100%):**

1. **AI Error Handling (21-24/1)**
   - Better error messages
   - Retry logic for all AI services
   - Fallback templates if PDF fail
   - ✅ Robust error handling

2. **AI Testing (25-27/1)**
   - Unit tests: gemini.service, speech.service, vision.service
   - Mock API responses
   - ✅ Test coverage > 80%

3. **Documentation (28-30/1)**
   - AI_SERVICES.md: How to use each service
   - Prompt examples
   - ✅ Developer docs complete

**Phụ thuộc:** Không

---

### 🔹 THIỆN - UI Polish

**Tasks (100%):**

1. **Responsive Design (21-24/1)**
   - Mobile breakpoints: < 768px
   - Sidebar collapse on mobile
   - Touch-friendly buttons
   - ✅ Mobile usable

2. **Dark Mode (25-27/1)**
   - TailwindCSS dark: classes
   - Toggle button in settings
   - ✅ Dark mode work

3. **Accessibility (28-30/1)**
   - ARIA labels
   - Keyboard navigation
   - Screen reader tested
   - ✅ WCAG 2.1 AA compliant

**Phụ thuộc:** Không

---

### 🔹 DŨNG - Admin Polish & E2E Tests

**Tasks (100%):**

1. **Admin UI Polish (21-24/1)**
   - Loading states
   - Error boundaries
   - Toast notifications
   - ✅ Admin UX smooth

2. **E2E Tests (25-28/1)**
   - Playwright: Auth flow, Generate flow, Admin flow
   - ✅ All critical paths tested

3. **User Documentation (29-30/1)**
   - USER_GUIDE.md: How to use app
   - Screenshots + GIFs
   - ✅ User docs complete

**Phụ thuộc:** Không

---

### 🔹 MAI ANH - Deployment

**Tasks (100%):**

1. **Production Docker (21-23/1)**
   - docker-compose.prod.yml
   - Multi-stage builds
   - Nginx reverse proxy
   - ✅ Production containers ready

2. **CI/CD Pipeline (24-27/1)**
   - GitHub Actions: Build → Test → Deploy
   - Auto-deploy on push to main
   - ✅ CI/CD work

3. **Deployment Guide (28-30/1)**
   - DEPLOYMENT.md: Step-by-step
   - Environment setup
   - Backup strategy
   - ✅ Deployment documented

4. **Final Testing (31/1-3/2)**
   - Smoke tests on production
   - Security scan
   - ✅ Production ready

**Phụ thuộc:** Tất cả features done từ Sprint 1-3

---

## 📊 SPRINT 4 DELIVERABLES (3/2)

✅ Polish: Responsive, Dark mode, Accessibility
✅ Testing: Unit tests, E2E tests, Load tested
✅ Deployment: Docker, CI/CD, Production ready
✅ Documentation: User guide, Developer docs, Deployment guide
✅ Demo: Full product ready to deploy

---

## 🎯 FINAL CHECKLIST

- [ ] All features từ MVP done
- [ ] No critical bugs
- [ ] Test coverage > 70%
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Handover meeting done

---

## 💡 TIPS THÀNH CÔNG

1. **Daily Standup (15 min):** What I did, what I'll do, blockers
2. **Sprint Review:** Demo working features
3. **Code Review:** Every PR needs 1 approval
4. **Focus:** Không làm ngoài scope
5. **Communication:** Slack/Discord active

---

**Good luck team! 🚀 Ship fast, iterate later!**
