import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, verifyAuth, getCurrentUser } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Quick check first
      if (!isAuthenticated()) {
        setIsValid(false);
        setIsVerifying(false);
        return;
      }

      // Verify with backend
      const valid = await verifyAuth();
      if (!valid) {
        setIsValid(false);
        setIsVerifying(false);
        return;
      }

      // If admin route is required, check user role
      if (requireAdmin) {
        const user = getCurrentUser();
        if (!user || user.role?.toUpperCase() !== 'ADMIN') {
          setIsValid(false);
          setIsVerifying(false);
          return;
        }
      }

      setIsValid(true);
      setIsVerifying(false);
    };

    checkAuth();
  }, [requireAdmin]);

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f6f7f8',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#136dec',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isValid) {
    if (requireAdmin) {
      // Redirect to dashboard if not admin
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
