# 🐳 Docker Development Setup - LectGen-AI

## 📋 Yêu cầu

- Docker Desktop
- Google API Key (Gemini)

---

## 🚀 Chạy dự án

### 1. Cấu hình môi trường

```bash
# Copy file môi trường
cp .env.example .env

# Thêm Google API Key vào file .env
# GOOGLE_API_KEY=your_key_here
```

### 2. Khởi động tất cả services

```bash
# Build và chạy (với --watch hot reload)
docker compose -f docker-compose.dev.yml up --build --watch

# Hoặc chạy background
docker compose -f docker-compose.dev.yml up -d --build --watch
```

### 3. Truy cập ứng dụng

- **Frontend**: Chạy local `cd frontend && npm run dev` → http://localhost:5173
- **Backend API**: http://localhost:5000 (Docker container với hot reload)
- **pgAdmin4**: http://localhost:5050 (email: admin@lectgen.ai, pass: admin123)
- **MinIO Console**: http://localhost:9001 (user: minioadmin, pass: minioadmin123)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 🔥 Hot Reload

**Backend (`./backend/src`):**

- Sửa code trong `./backend/src` → Docker tự động sync và restart server
- Dùng `tsx watch` để auto-reload
- Có debugger port 9229 nếu cần debug

**Frontend (Chạy local):**

- Không dùng Docker, chạy trực tiếp trên host machine
- `cd frontend && npm install && npm run dev`
- Vite HMR tự động reload browser
- Kết nối với Backend qua `http://localhost:5000`

**Cơ chế:** Backend dùng Docker Compose `watch` mode phát hiện thay đổi và sync file vào container.

---

## 🛠️ Lệnh thường dùng

### Xem logs

```bash
# Tất cả services
docker compose -f docker-compose.dev.yml logs -f

# Service cụ thể
docker compose -f docker-compose.dev.yml logs -f backend
```

### Dừng services

```bash
docker compose -f docker-compose.dev.yml down
```

### Dừng và xóa data

```bash
docker compose -f docker-compose.dev.yml down -v
```

### Restart service

```bash
docker compose -f docker-compose.dev.yml restart backend
```

### Vào container

```bash
# Backend
docker exec -it lectgen-backend sh

# PostgreSQL
docker exec -it lectgen-postgres psql -U lectgen -d lectgen_db
```

### Cài package mới

```bash
# Backend (trong container)
cd backend && npm install <package-name>
docker compose -f docker-compose.dev.yml restart backend

# Frontend (local)
cd frontend && npm install <package-name>
# Vite tự động reload
```

docker compose -f docker-compose.dev.yml restart frontend

````

---

## 📦 Services

| Service    | Port       | Mô tả                                     |
| ---------- | ---------- | ----------------------------------------- |
| PostgreSQL | 5432       | Database                                  |
| pgAdmin4   | 5050       | Database UI (kết nối với PostgreSQL)      |
| MinIO      | 9000, 9001 | Object storage (audio, hình ảnh, PDF)     |
| Redis      | 6379       | Queue & cache                             |
| Backend    | 5000, 9229 | API với hot reload (9229 = debug port)    |
| Frontend   | 5173       | Chạy local với Vite (không dùng Docker)   |

---

## 🐛 Xử lý lỗi

### Port đã được sử dụng

Thay đổi port trong `docker-compose.dev.yml`:

```yaml
ports:
  - "5001:5000" # Dùng port 5001 thay vì 5000
````

### Hot reload không hoạt động (Windows)

Thêm vào `vite.config.ts`:

```typescript
server: {
  watch: {
    usePolling: true;
  }
}
```

### Lỗi kết nối database

```bash
# Kiểm tra health
docker compose -f docker-compose.dev.yml ps

# Xem logs
docker compose -f docker-compose.dev.yml logs postgres
```

---

## 🎯 Next Steps

1. **Setup Prisma:**

   ```bash
   docker exec -it lectgen-backend npx prisma init
   docker exec -it lectgen-backend npx prisma migrate dev
   ```

2. **Kết nối pgAdmin4 với PostgreSQL:**

   - Truy cập http://localhost:5050
   - Login: admin@lectgen.ai / admin123
   - Add Server:
     - Name: `LectGen DB`
     - Host: `postgres` (tên container, cùng network)
     - Port: `5432`
     - Database: `lectgen_db`
     - Username: `lectgen`
     - Password: `lectgen123`

3. **Tạo MinIO Buckets:**

   - Truy cập http://localhost:9001
   - Login: minioadmin / minioadmin123
   - Tạo buckets: `audio-recordings`, `template-images`, `generated-pdfs`

4. **Bắt đầu code!**

   **Backend:**

   - Sửa `backend/src/index.ts` → Server tự động restart trong Docker
   - Debug: Attach debugger vào port 9229

   **Frontend:**

   - Terminal mới: `cd frontend && npm run dev`
   - Sửa `frontend/src/App.tsx` → Browser tự động reload
   - API endpoint: `http://localhost:5000`

---

## ✅ Checklist

- [ ] PostgreSQL healthy
- [ ] pgAdmin4 mở được: http://localhost:5050
- [ ] pgAdmin4 kết nối được với PostgreSQL (host: `postgres`)
- [ ] MinIO console mở được
- [ ] Redis chạy: `docker exec -it lectgen-redis redis-cli ping` trả về "PONG"
- [ ] Backend trả về response: http://localhost:5000
- [ ] Frontend chạy local: `cd frontend && npm run dev` → http://localhost:5173
- [ ] Hot reload hoạt động: sửa `backend/src` → container restart
- [ ] Frontend kết nối được Backend qua http://localhost:5000

---

**Chúc code vui! 🚀**
