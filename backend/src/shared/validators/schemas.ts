import { z } from 'zod';
import { USER_ROLES, MESSAGE_TYPES, PAGINATION } from '../constants';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Generate lecture validation
export const generateLectureSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
});

// Conversation validation
export const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
});

// Message validation
export const createMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  messageType: z.enum(MESSAGE_TYPES as [string, ...string[]]),
  contentText: z.string().optional(),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(PAGINATION.MAX_LIMIT).optional().default(PAGINATION.DEFAULT_LIMIT),
  offset: z.number().int().min(0).optional().default(PAGINATION.DEFAULT_OFFSET),
});

// User update validation
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(USER_ROLES as [string, ...string[]]).optional(),
  maxSlidesPerMonth: z.number().int().min(0).optional(),
});
