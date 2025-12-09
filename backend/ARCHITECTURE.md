# LectGen-AI Backend Architecture

## Modular Structure Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         src/index.ts                            │
│                     (Application Entry)                         │
│  - Initialize Express                                           │
│  - Setup CORS & Middleware                                      │
│  - Register Module Routes                                       │
│  - Global Error Handler                                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│   MODULES    │    │   SHARED         │
│              │    │  (Utilities)     │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       │            ┌────────┴─────────┐
       │            │                  │
       │            ▼                  ▼
       │    ┌──────────────┐  ┌──────────────┐
       │    │  Middleware  │  │    Utils     │
       │    │              │  │              │
       │    │ • Auth       │  │ • Errors     │
       │    │ • Quota      │  │ • Response   │
       │    │ • Error      │  │ • Validators │
       │    └──────────────┘  └──────────────┘
       │
       ├────────┬────────┬────────┐
       │        │        │        │
       ▼        ▼        ▼        ▼
  ┌────────┐ ┌──────┐ ┌──────┐ ┌─────────┐
  │  AUTH  │ │ USER │ │ CONV │ │ STORAGE │
  └───┬────┘ └──┬───┘ └──┬───┘ └────┬────┘
      │         │        │           │
      │    Each Module Contains:     │
      │    ┌─────────────────┐      │
      │    │  • Service      │      │
      │    │  • Controller   │      │
      │    │  • Routes       │      │
      │    │  • index.ts     │      │
      │    └─────────────────┘      │
      │                              │
      └──────────────┬───────────────┘
                     │
                     ▼
          ┌─────────────────┐
          │      CORE        │
          │ (Infrastructure) │
          └────────┬─────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
  ┌─────────┐ ┌──────┐ ┌──────────────┐
  │ Config  │ │Models│ │ Repositories │
  │         │ │      │ │              │
  │• DB     │ │• User│ │• User Repo   │
  │• MinIO  │ │• Conv│ │• Conv Repo   │
  └─────────┘ │• Msg │ │• Msg Repo    │
              └──────┘ └──────────────┘
```

## Request Flow Example

```
Client Request
      │
      ▼
┌─────────────────┐
│ Express Router  │  /api/auth/register
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Routes     │  POST /register
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validation      │  Zod Schema (optional)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Auth Controller  │  authController.register()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Service    │  authService.register()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│User Repository  │  userRepository.create()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sequelize Model │  User.create()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  INSERT INTO users
└────────┬────────┘
         │
         ▼
   Response to Client
```

## Protected Route Flow

```
Client Request with Bearer Token
      │
      ▼
┌─────────────────┐
│ Auth Middleware │  authenticate()
│                 │  • Extract token
│                 │  • Verify JWT
│                 │  • Load user
│                 │  • Attach to req.user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quota Middleware│  checkQuota()
│                 │  • Check role (FREE/VIP)
│                 │  • Verify quota
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  Process request with req.user
└─────────────────┘
```

## Database Schema

```
┌─────────────┐
│    Users    │
│─────────────│
│ id (UUID)   │◄─────┐
│ email       │      │
│ passwordHash│      │
│ role        │      │
│ slidesGen   │      │
│ maxSlides   │      │
└─────────────┘      │
                     │
                     │ belongsTo
                     │
┌─────────────────┐  │
│ Conversations   │  │
│─────────────────│  │
│ id (UUID)       │  │
│ userId          │──┘
│ title           │
└────────┬────────┘
         │
         │ hasMany
         │
         ▼
┌─────────────────┐
│   Messages      │
│─────────────────│
│ id (UUID)       │
│ conversationId  │
│ role            │
│ messageType     │
│ contentText     │
│ audioUrl        │
│ imageUrl        │
│ transcript      │
│ styleAnalysis   │
│ pdfUrl          │
│ slideCount      │
└─────────────────┘
```

## MinIO Buckets

```
┌────────────────────┐
│   MinIO Storage    │
├────────────────────┤
│                    │
│ ┌────────────────┐ │
│ │audio-recordings│ │  ← Voice inputs
│ └────────────────┘ │
│                    │
│ ┌────────────────┐ │
│ │template-images │ │  ← Style reference images
│ └────────────────┘ │
│                    │
│ ┌────────────────┐ │
│ │generated-pdfs  │ │  ← Final slide PDFs
│ └────────────────┘ │
│                    │
│ ┌────────────────┐ │
│ │ user-avatars   │ │  ← Profile pictures
│ └────────────────┘ │
│                    │
└────────────────────┘
```

## Module Dependencies

```
AUTH Module
  ├── Depends on:
  │   ├── core/repositories/user.repository
  │   ├── core/models/User
  │   └── shared/utils (errors, response)
  └── Used by:
      └── shared/middleware/auth.middleware

CONVERSATION Module
  ├── Depends on:
  │   ├── core/repositories (conversation, message, user)
  │   ├── core/models (Conversation, Message)
  │   └── shared/utils
  └── Protected by:
      └── shared/middleware/auth

USER Module
  ├── Depends on:
  │   ├── core/repositories/user.repository
  │   ├── core/models/User
  │   └── shared/utils
  └── Protected by:
      ├── shared/middleware/auth
      └── shared/middleware/admin (adminOnly)

STORAGE Module
  ├── Depends on:
  │   └── core/config/minio
  └── Used by:
      └── Future message/lecture modules
```

## Tech Stack Layer

```
┌───────────────────────────────────┐
│        Application Layer          │
│  Express 5 + TypeScript + Zod     │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│         Business Layer            │
│  Services + Controllers + Routes  │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│        Data Access Layer          │
│     Repositories + Models         │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│      Infrastructure Layer         │
│  Sequelize ORM + PostgreSQL       │
│  MinIO Client + Redis             │
└───────────────────────────────────┘
```

## Development vs Production

### Development (Docker Compose)

```
┌──────────────┐
│   Backend    │ ← Watch mode (tsx)
│  (TypeScript)│ ← Hot reload on save
└──────┬───────┘
       │
       ├──────► PostgreSQL 16
       ├──────► MinIO
       ├──────► Redis 7
       └──────► pgAdmin4 (DB UI)
```

### Production

```
┌──────────────┐
│   Backend    │ ← Compiled JavaScript
│   (Node.js)  │ ← PM2 or similar
└──────┬───────┘
       │
       ├──────► AWS RDS PostgreSQL
       ├──────► AWS S3 (or MinIO)
       └──────► ElastiCache Redis
```

## Key Design Patterns

1. **Repository Pattern**: Abstracts data access
2. **Dependency Injection**: Services injected into controllers
3. **Middleware Chain**: Authentication → Authorization → Business Logic
4. **Error Handling**: Custom error classes + global error handler
5. **Response Format**: Standardized success/error responses
