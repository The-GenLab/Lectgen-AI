const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Google OAuth URL
export const getGoogleAuthUrl = () => `${API_URL}/auth/google`;

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  avatarUrl?: string;
  slidesGenerated: number;
  maxSlidesPerMonth: number;
  subscriptionExpiresAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
  csrfToken: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
  csrfToken: string;
}

export interface MeResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? match[1] : null;
};

const createHeaders = (accessToken?: string | null, includeContentType: boolean = true): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
};

const createCsrfHeaders = (includeContentType: boolean = true): HeadersInit => {
  const headers: HeadersInit = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};

export const authApi = {
  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const response = await fetch(`${API_URL}/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Check email failed');
    }

    return result.data;
  },

  async register(data: RegisterRequest): Promise<{ accessToken: string; user: User }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(null, true),
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for refresh token
    });

    const result: AuthResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    return {
      accessToken: result.data.accessToken,
      user: result.data.user,
    };
  },

  async login(data: RegisterRequest): Promise<{ accessToken: string; user: User }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(null, true),
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies for refresh token
    });

    const result: AuthResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return {
      accessToken: result.data.accessToken,
      user: result.data.user,
    };
  },

  async me(accessToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: createHeaders(accessToken, true),
      credentials: 'include',
    });

    const result: MeResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get user');
    }

    return result.data.user;
  },

  // Refresh with token rotation
  async refresh(): Promise<{ accessToken: string; user: User }> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: createCsrfHeaders(true),
      credentials: 'include', // Include cookies for refresh token
    });

    const result: RefreshResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Token refresh failed');
    }

    // Get user info with new access token
    const user = await this.me(result.data.accessToken);

    return {
      accessToken: result.data.accessToken,
      user,
    };
  },

  // Logout - requires CSRF
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: createCsrfHeaders(true),
      credentials: 'include',
    });

    const result = await response.json();

    // Clear local storage
    localStorage.removeItem('userHint');

    if (!response.ok) {
      throw new Error(result.message || 'Logout failed');
    }

    return result;
  },

  // Helper: Get stored user hint from localStorage (for quick non-auth checks)
  // DO NOT use for authentication - only for UI hints
  getStoredUserHint(): { email: string; role: string } | null {
    const userStr = localStorage.getItem('userHint');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Forgot password - request reset link
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send reset link');
    }

    return result;
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPassword }),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to reset password');
    }

    return result;
  },

  // Validate reset token
  async validateResetToken(token: string): Promise<{ success: boolean; message: string; data?: { valid: boolean; email: string } }> {
    const response = await fetch(`${API_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Invalid or expired token');
    }

    return result;
  },
};
