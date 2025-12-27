import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Success from './pages/Auth/Success';
import GoogleCallback from './pages/Auth/GoogleCallback';
import Dashboard from './pages/Dashboard/Dashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/Profile/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsageQuota from './pages/Admin/AdminUsageQuota';
import AdminSystemLogs from './pages/Admin/AdminSystemLogs';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/log-in-or-create-account" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login-success" element={<Success />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Admin route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute> <AdminDashboard /> </ProtectedRoute>} />
        <Route path="/admin/usage" element={<ProtectedRoute> <AdminUsageQuota /> </ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute> <AdminSystemLogs /> </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
