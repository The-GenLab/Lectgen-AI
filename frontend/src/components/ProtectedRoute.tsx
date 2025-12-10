import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Check authentication mỗi lần component render
  if (!isAuthenticated()) {
    return <Navigate to="/log-in-or-create-account" replace />;
  }

  return <>{children}</>;
}
