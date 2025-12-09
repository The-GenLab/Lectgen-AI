/**
 * Shared Type Definitions
 * Centralized type definitions to avoid duplication
 */

import { UserRole, MessageRole, MessageType } from './enums';

// ==================== AUTH TYPES ====================
export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}

// ==================== USER TYPES ====================
export interface UserUpdateData {
  email?: string;
  role?: UserRole;
  maxSlidesPerMonth?: number;
}

export interface UserStatistics {
  total: number;
  free: number;
  vip: number;
  admin: number;
  activeThisMonth: number;
}

// ==================== CONVERSATION TYPES ====================
export interface CreateConversationData {
  userId: string;
  title?: string;
}

export interface UpdateConversationData {
  title: string;
}

// ==================== MESSAGE TYPES ====================
export interface CreateMessageData {
  conversationId: string;
  role: MessageRole;
  messageType: MessageType;
  contentText?: string;
  audioUrl?: string;
  imageUrl?: string;
  transcript?: string;
  styleAnalysis?: object;
  pdfUrl?: string;
  slideCount?: number;
}

export interface UpdateMessageData {
  contentText?: string;
  transcript?: string;
  styleAnalysis?: object;
  pdfUrl?: string;
  slideCount?: number;
}

// ==================== STORAGE TYPES ====================
export interface UploadFileData {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
}

// ==================== LECTURE GENERATION TYPES ====================
export interface GenerateLectureData {
  topic: string;
  slides?: number;
  style?: 'professional' | 'casual' | 'academic';
  templateImageUrl?: string;
}

export interface LectureGenerationResult {
  pdfUrl: string;
  slideCount: number;
  processingTime: number;
}
