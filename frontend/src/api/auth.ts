const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
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
  };
}

export interface MeResponse {
  success: boolean;
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

export const authApi = {
  // Check if email already exists
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

  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    return result;
  },

  // Login user
  async login(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
  },

  // Get current user info (protected route)
  async me(): Promise<MeResponse> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get user');
    }

    return result;
  },

  // Refresh token
  async refreshToken(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Token refresh failed');
    }

    return result;
  },

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    const result = await response.json();

    // Clear local storage
    localStorage.removeItem('user');

    if (!response.ok) {
      throw new Error(result.message || 'Logout failed');
    }

    return result;
  },

  // Helper: Check if user is authenticated (by calling /me endpoint)
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  // Helper: Get stored user from localStorage (for quick access without API call)
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
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
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to reset password');
    }

    return result;
  },
};
