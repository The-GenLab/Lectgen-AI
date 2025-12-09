/**
 * Shared Enums & Constants
 * Centralized enums to avoid duplication across the codebase
 */

// ==================== USER ROLES ====================
export enum UserRole {
  FREE = 'FREE',
  VIP = 'VIP',
  ADMIN = 'ADMIN',
}

export type UserRoleType = UserRole.FREE | UserRole.VIP | UserRole.ADMIN;

// Array for validation/iteration
export const USER_ROLES = Object.values(UserRole);

// Helper functions
export const isVipOrAdmin = (role: UserRoleType): boolean => {
  return role === UserRole.VIP || role === UserRole.ADMIN;
};

export const isFreeUser = (role: UserRoleType): boolean => {
  return role === UserRole.FREE;
};

export const isAdmin = (role: UserRoleType): boolean => {
  return role === UserRole.ADMIN;
};

// ==================== MESSAGE ROLES ====================
export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export type MessageRoleType = MessageRole.USER | MessageRole.ASSISTANT;

export const MESSAGE_ROLES = Object.values(MessageRole);

// ==================== MESSAGE TYPES ====================
export enum MessageType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
}

export type MessageTypeType = MessageType.TEXT | MessageType.AUDIO | MessageType.IMAGE;

export const MESSAGE_TYPES = Object.values(MessageType);

// ==================== QUOTA CONSTANTS ====================
export const QUOTA = {
  FREE_USER_MAX_SLIDES: 5,
  VIP_USER_MAX_SLIDES: -1, // -1 means unlimited
  DEFAULT_MAX_SLIDES: 5,
} as const;

// ==================== JWT CONSTANTS ====================
export const JWT = {
  DEFAULT_SECRET: 'your-secret-key-change-in-production',
  DEFAULT_EXPIRES_IN: '7d',
  SALT_ROUNDS: 10,
} as const;

// ==================== PAGINATION CONSTANTS ====================
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// ==================== MINIO BUCKET NAMES ====================
export const BUCKETS = {
  AUDIO_RECORDINGS: 'audio-recordings',
  TEMPLATE_IMAGES: 'template-images',
  GENERATED_PDFS: 'generated-pdfs',
  USER_AVATARS: 'user-avatars',
} as const;

// ==================== FILE UPLOAD LIMITS ====================
export const FILE_LIMITS = {
  AUDIO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PDF_MAX_SIZE: 20 * 1024 * 1024, // 20MB
} as const;

// ==================== PRESIGNED URL EXPIRY ====================
export const PRESIGNED_URL_EXPIRY = {
  DEFAULT: 24 * 60 * 60, // 24 hours in seconds
  SHORT: 60 * 60, // 1 hour
  LONG: 7 * 24 * 60 * 60, // 7 days
} as const;

// ==================== HTTP STATUS CODES ====================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ==================== SUBSCRIPTION DURATION ====================
export const SUBSCRIPTION_DURATION = {
  ONE_MONTH: 1,
  THREE_MONTHS: 3,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
} as const;
