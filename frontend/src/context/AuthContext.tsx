import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../api/auth';

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  refreshAuth: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuth = useCallback((token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    // Lưu hint không nhạy cảm vào localStorage để hiển thị UI
    localStorage.setItem('userHint', JSON.stringify({
      email: userData.email,
      role: userData.role,
    }));
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('userHint');
  }, []);

  // Làm mới token sử dụng cookie
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken: newToken, user: userData } = await authApi.refresh();
      setAuth(newToken, userData);
      return true;
    } catch (error: any) {
      // Thất bại thì dọn dẹp auth (bình thường khi chưa đăng nhập)
      clearAuth();
      return false;
    }
  }, [setAuth, clearAuth]);

  // Khởi tạo auth khi mount component
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Kiểm tra nhanh: nếu không có refreshToken cookie thì bỏ qua gọi API
        const hasRefreshToken = document.cookie.includes('refreshToken=');
        
        if (!hasRefreshToken) {
          clearAuth();
          setIsLoading(false);
          return;
        }

        // Thêm timeout để tránh treo nếu backend down
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const refreshPromise = refreshAuth();
        
        const success = await Promise.race([refreshPromise, timeoutPromise]) as boolean;
        if (!success) {
          clearAuth();
        }
      } catch (error: any) {
        // Dọn dẹp auth nếu thất bại (bình thường khi lần đầu truy cập)
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshAuth, clearAuth]);

  const value = {
    accessToken,
    user,
    setAuth,
    clearAuth,
    refreshAuth,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
