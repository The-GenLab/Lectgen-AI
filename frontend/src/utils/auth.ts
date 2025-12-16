import { authApi } from '../api/auth';

// Get auth headers for API requests (credentials will be sent via cookies)
export const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

// Get auth headers for file upload (without Content-Type)
export const getAuthHeadersForUpload = (): HeadersInit => {
  return {};
};

// Check if user is authenticated (sync check using localStorage)
export const isAuthenticated = (): boolean => {
  // Quick check: if user data exists in localStorage, assume authenticated
  // The actual token is stored in HTTP-only cookie (not accessible via JS)
  return !!localStorage.getItem('user');
};

// Verify authentication with backend (async)
export const verifyAuth = async (): Promise<boolean> => {
  try {
    await authApi.me();
    return true;
  } catch {
    // Clear local user data if token is invalid
    localStorage.removeItem('user');
    return false;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Clear local storage even if API call fails
    localStorage.removeItem('user');
  }
  window.location.href = '/login';
};

// Get user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
