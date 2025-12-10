const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Convert relative avatar path to full API URL
 * @param avatarPath - Path from DB (e.g., "/user-avatars/avatars/xxx.jpg")
 * @returns Full URL to fetch avatar (e.g., "http://localhost:5000/api/files/user-avatars/avatars/xxx.jpg")
 */
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;
  
  // Remove leading slash if exists: /user-avatars/... -> user-avatars/...
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  
  return `${API_URL}/files/${cleanPath}`;
};
