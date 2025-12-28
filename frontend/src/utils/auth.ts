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

// Check if user is authenticated (sync check using sessionStorage)
export const isAuthenticated = (): boolean => {
  // Quick check: if user data exists in sessionStorage, assume authenticated
  // The actual token is stored in HTTP-only cookie (not accessible via JS)
  return !!sessionStorage.getItem('user');
};

// Verify authentication with backend (async)
export const verifyAuth = async (): Promise<boolean> => {
  try {
    const response = await authApi.me();
    // Save only basic user info to sessionStorage (auto-cleared on tab close)
    if (response.success && response.data?.user) {
      const basicUserInfo = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
      };
      sessionStorage.setItem('user', JSON.stringify(basicUserInfo));
    }
    return true;
  } catch {
    // Clear session storage if token is invalid
    sessionStorage.removeItem('user');
    return false;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Clear session storage even if API call fails
    sessionStorage.removeItem('user');
  }
  window.location.href = '/login';
};

// Get user from sessionStorage (only basic info)
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
