import { configDotenv } from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { syncDatabase } from "./core/models";
import { initializeBuckets } from "./core/config/minio";
import authRoutes from "./modules/auth/auth.routes";
import conversationRoutes from "./modules/conversation/conversation.routes";
import userRoutes from "./modules/user/user.routes";
import fileRoutes from "./modules/file/file.routes";
import { errorHandler, notFoundHandler } from "./shared/middleware/error.middleware";

configDotenv();

const app = express();
const PORT = process.env.PORT || 5000;

// Using middleware cors to connect Back - Front
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

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

// Increase body size limit to 10MB for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);

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
    // Sync database
    await syncDatabase(false); // Set to true to drop all tables

    // Initialize MinIO buckets
    await initializeBuckets();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

