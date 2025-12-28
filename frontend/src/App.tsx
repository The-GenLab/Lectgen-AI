import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Success from './pages/Auth/Success';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import ChangeAvatar from './pages/Settings/ChangeAvatar';
import UpgradeToVIP from './pages/Settings/UpgradeToVIP';
import Checkout from './pages/Payment/Checkout';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsageQuota from './pages/Admin/AdminUsageQuota';
import AdminSystemLogs from './pages/Admin/AdminSystemLogs';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserDetail from './pages/Admin/AdminUserDetail';
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
        <Route path="/" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute> <ChangeAvatar /> </ProtectedRoute>} />
        <Route path="/settings/upgrade" element={<ProtectedRoute> <UpgradeToVIP /> </ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute> <Checkout /> </ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute> <PaymentSuccess /> </ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin> <AdminDashboard /> </ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin> <AdminUsers /> </ProtectedRoute>} />
        <Route path="/admin/users/:id" element={<ProtectedRoute requireAdmin> <AdminUserDetail /> </ProtectedRoute>} />
        <Route path="/admin/usage" element={<ProtectedRoute requireAdmin> <AdminUsageQuota /> </ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute requireAdmin> <AdminSystemLogs /> </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
