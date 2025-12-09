/**
 * Shared Helper Functions
 * Common utility functions used across the application
 */

import { UserRole, MessageRole, MessageType } from './enums';

// ==================== STRING HELPERS ====================

/**
 * Truncate text to specified length with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate a slug from text (lowercase, hyphenated)
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter of each word
 */
export const capitalize = (text: string): string => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==================== DATE HELPERS ====================

/**
 * Add months to a date
 */
export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date | null): boolean => {
  if (!date) return false;
  return new Date(date) > new Date();
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: Date | null): boolean => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Format date to ISO string without milliseconds
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('.')[0] + 'Z';
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate password strength (min 6 chars, contains letter and number)
 */
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

// ==================== ENUM HELPERS ====================

/**
 * Check if value is valid UserRole
 */
export const isValidUserRole = (value: any): value is UserRole => {
  return Object.values(UserRole).includes(value);
};

/**
 * Check if value is valid MessageRole
 */
export const isValidMessageRole = (value: any): value is MessageRole => {
  return Object.values(MessageRole).includes(value);
};

/**
 * Check if value is valid MessageType
 */
export const isValidMessageType = (value: any): value is MessageType => {
  return Object.values(MessageType).includes(value);
};

// ==================== ARRAY HELPERS ====================

/**
 * Remove duplicates from array
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Get random item from array
 */
export const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// ==================== OBJECT HELPERS ====================

/**
 * Pick specific keys from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

/**
 * Deep clone object (simple version)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// ==================== NUMBER HELPERS ====================

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Clamp number between min and max
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

// ==================== PROMISE HELPERS ====================

/**
 * Sleep/delay execution
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry async function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError;
};

// ==================== FILE HELPERS ====================

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Generate unique filename with timestamp
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const ext = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  const slug = slugify(nameWithoutExt);
  return `${slug}-${timestamp}.${ext}`;
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
};

// ==================== SANITIZATION HELPERS ====================

/**
 * Remove sensitive fields from object
 */
export const sanitizeUser = (user: any) => {
  return omit(user, ['passwordHash'] as any);
};

/**
 * Mask email for privacy
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
};
