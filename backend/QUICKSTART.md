# Quick Start Guide

## 🚀 Setup trong 5 phút

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Tạo file .env

```bash
cp .env.example .env
```

Thêm Google API key vào `.env`:

```env
GOOGLE_API_KEY=your-gemini-api-key-here
```

### 3. Start với Docker (Recommended)

```bash
cd ..
docker compose -f docker-compose.dev.yml up --watch
```

✅ Backend: http://localhost:5000
✅ pgAdmin: http://localhost:5050
✅ MinIO Console: http://localhost:9001

### 4. Test API

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## 📂 Cấu trúc thư mục

```
backend/
├── src/
│   ├── modules/          ← CÁC TÍNH NĂNG (auth, user, conversation, storage)
│   ├── shared/           ← CODE DÙNG CHUNG (middleware, utils, validators)
│   ├── core/             ← HẠ TẦNG (config, models, repositories)
│   └── index.ts          ← ENTRY POINT
```

### Mỗi module chứa:

- `*.service.ts` - Business logic
- `*.controller.ts` - Xử lý HTTP request/response
- `*.routes.ts` - Định nghĩa routes
- `index.ts` - Export module

## 🔍 Tìm code dễ dàng

### Cần tìm Authentication?

```
src/modules/auth/
├── auth.service.ts       ← JWT, password hashing
├── auth.controller.ts    ← /register, /login endpoints
└── auth.routes.ts        ← Route definitions
```

### Cần tìm User management?

```
src/modules/user/
├── user.service.ts       ← User CRUD logic
├── user.controller.ts    ← Admin user management
└── user.routes.ts        ← /api/users routes
```

### Cần tìm Middleware?

```
src/shared/middleware/
├── auth.middleware.ts    ← authenticate, authorize
├── quota.middleware.ts   ← checkQuota
└── error.middleware.ts   ← Global error handler
```

### Cần tìm Database models?

```
src/core/models/
├── User.ts              ← User model + helper methods
├── Conversation.ts      ← Conversation model
├── Message.ts           ← Message model
└── index.ts             ← syncDatabase()
```

## 🛠️ Thêm tính năng mới

### Ví dụ: Thêm Lecture Generation module

```bash
# 1. Tạo folder
mkdir src/modules/lecture

# 2. Tạo các file
touch src/modules/lecture/lecture.service.ts
touch src/modules/lecture/lecture.controller.ts
touch src/modules/lecture/lecture.routes.ts
touch src/modules/lecture/index.ts
```

**lecture.service.ts**:

```typescript
import { storageService } from "../storage";

class LectureService {
  async generateSlides(userId: string, topic: string) {
    // Business logic here
  }
}

export default new LectureService();
```

**lecture.controller.ts**:

```typescript
import lectureService from "./lecture.service";
import { successResponse } from "../../shared/utils";

class LectureController {
  async generate(req, res) {
    const result = await lectureService.generateSlides(
      req.user.id,
      req.body.topic
    );
    return successResponse(res, result);
  }
}

export default new LectureController();
```

**lecture.routes.ts**:

```typescript
import { Router } from "express";
import lectureController from "./lecture.controller";
import { authenticate, checkQuota } from "../../shared/middleware";

const router = Router();

router.post("/generate", authenticate, checkQuota, lectureController.generate);

export default router;
```

**index.ts**:

```typescript
export { default as lectureService } from "./lecture.service";
export { default as lectureController } from "./lecture.controller";
export { default as lectureRoutes } from "./lecture.routes";
```

**Register trong `src/index.ts`**:

```typescript
import lectureRoutes from "./modules/lecture/lecture.routes";

app.use("/api/lectures", lectureRoutes);
```

## 📝 API Endpoints hiện tại

### Auth (`/api/auth`)

- `POST /register` - Đăng ký
- `POST /login` - Đăng nhập
- `GET /me` - Lấy thông tin user (protected)
- `POST /refresh` - Refresh token
- `POST /logout` - Đăng xuất

### Conversations (`/api/conversations`)

- `POST /` - Tạo conversation mới
- `GET /` - List conversations (có pagination)
- `GET /:id` - Get conversation với messages
- `PATCH /:id` - Update title
- `DELETE /:id` - Xóa conversation

### Users (`/api/users`) - Admin only

- `GET /` - List all users
- `GET /search?email=...` - Tìm user
- `GET /statistics` - Thống kê
- `GET /:id` - Get user by ID
- `PATCH /:id` - Update user
- `DELETE /:id` - Delete user

## 🧪 Testing

```bash
# Test compilation
npm run build

# Development mode
npm run dev

# Production mode
npm start
```

## 🐛 Debug

### Check logs

```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

### Access PostgreSQL

```bash
# Via pgAdmin: http://localhost:5050
# Email: admin@lectgen.com
# Password: admin

# Or via CLI:
docker exec -it lectgen-postgres psql -U lectgen -d lectgen_db
```

### Check MinIO files

```bash
# MinIO Console: http://localhost:9001
# Username: minioadmin
# Password: minioadmin123
```

## 💡 Tips

### Import từ cùng module

```typescript
import authService from "./auth.service";
```

### Import từ module khác

```typescript
import { userService } from "../user";
```

### Import từ shared

```typescript
import { authenticate } from "../../shared/middleware";
import { successResponse } from "../../shared/utils";
import { registerSchema } from "../../shared/validators";
```

### Import từ core

```typescript
import { userRepository } from "../../core/repositories";
import User from "../../core/models/User";
import sequelize from "../../core/config/database";
```

## 🔐 Authentication Flow

```typescript
// 1. Client gửi email + password
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "123456"
}

// 2. Server trả về token
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}

// 3. Client gửi token trong header
GET /api/conversations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 4. Middleware authenticate() verify token và attach user vào req
// 5. Controller xử lý request với req.user
```

## 📚 Docs

- [README.md](./README.md) - Tổng quan
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Chi tiết kiến trúc với diagrams
- [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) - Kế hoạch dự án 2 tháng

## 🆘 Common Issues

### Port đã được sử dụng

```bash
# Kill process on port 5000
npx kill-port 5000
```

### Database connection error

```bash
# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres
```

### Build error

```bash
# Clean và rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Hot reload không hoạt động

```bash
# Dùng --watch flag
docker compose -f docker-compose.dev.yml up --watch
```
