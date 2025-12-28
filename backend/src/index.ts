import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { syncDatabase } from "./core/models";
import { initializeBuckets } from "./core/config/minio";
import { configureGoogleAuth } from "./core/config/passport";
import { verifyEmailConfig } from "./core/config/email";
import authRoutes from "./modules/auth/auth.routes";
import conversationRoutes from "./modules/conversation/conversation.routes";
import userRoutes from "./modules/user/user.routes";
import fileRoutes from "./modules/file/file.routes";
import templateRoutes from "./modules/template/template.routes";
import speechRoutes from "./modules/speech/speech.routes";
import adminRoutes from "./modules/admin/admin.routes";
import chatRoutes from "./modules/chat/chat.routes";
import publicSettingsRoutes from "./modules/admin/public-settings.routes";
import adminSettingsService from "./modules/admin/admin-settings.service";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/error.middleware";

// AI routes
import aiRoutes from "./modules/ai/ai.routes";

configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;

// Using middleware cors to connect Back - Front
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log('[Backend] CORS configured for origin:', frontendUrl);
app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Initialize Passport
app.use(passport.initialize());

// Parse cookies
app.use(cookieParser());

// Health check endpoint (for Docker HEALTHCHECK)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// File upload routes MUST come before express.json() to avoid parsing FormData as JSON
app.use("/api/files", fileRoutes);
app.use("/api/template", templateRoutes);

// Increase body size limit to 10MB for other routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes); // Chat route - combines conversation + AI
app.use("/api/settings", publicSettingsRoutes); // Public settings routes (no auth required)
app.use("/api/admin", adminRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "LectGen-AI API",
    version: "1.0.0",
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Configure Google OAuth
    configureGoogleAuth();

    // Verify email configuration (optional - sẽ không dừng server nếu fail)
    await verifyEmailConfig();

    // Sync database
    await syncDatabase(false); // Set to true to drop all tables

    // Initialize MinIO buckets
    await initializeBuckets();

    // Initialize default system settings
    await adminSettingsService.initializeDefaults();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
      console.log(`🔗 CORS origin: ${frontendUrl}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
