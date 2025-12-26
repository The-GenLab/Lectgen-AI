// NOTE: Authentication state is now fully managed by AuthContext
// This file contains minimal utility functions for auth-related operations

// Get CSRF token from cookie for CSRF-protected requests
export const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? match[1] : null;
};

// Get CSRF headers for CSRF-protected requests
export const getCsrfHeaders = (): HeadersInit => {
  const csrfToken = getCsrfToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};

