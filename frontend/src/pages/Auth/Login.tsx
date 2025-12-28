import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
import { authApi } from '../../api/auth';
import { getMaintenanceMode } from '../../api/settings';
import {
  AuthHeader,
  AuthFooter,
  SocialButtons,
  PasswordInput,
  ErrorAlert,
  Divider,
  SubmitButton,
} from '../../components/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const navigate = useNavigate();

  // Check maintenance mode on mount (non-blocking)
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const maintenanceMode = await getMaintenanceMode();
        if (maintenanceMode) {
          setIsMaintenance(true);
        }
      } catch (error) {
        // Silently fail - maintenance check is not critical for login page
        // Backend will handle maintenance mode during actual login
        console.warn('Failed to check maintenance mode (non-critical):', error);
      }
    };
    checkMaintenance();
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return;

    setLoading(true);
    setError('');
    setShowError(false);

    try {
      console.log('Attempting login...');
      const result = await authApi.login({ email, password });
      console.log('Login successful:', result);

      const basicUserInfo = {
        id: result.data.user.id,
        email: result.data.user.email,
        role: result.data.user.role,
      };
      sessionStorage.setItem('user', JSON.stringify(basicUserInfo));

      // If login successful, backend already checked maintenance mode
      // ADMIN users are allowed to login even during maintenance
      // FREE/VIP users would have been blocked by backend (503 error)
      navigate('/login-success');
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        // Check if error is due to maintenance mode
        if ((err as any).maintenance || err.message.includes('maintenance') || err.message.includes('Maintenance')) {
          navigate('/maintenance');
          return;
        }
        // Check if it's a network/server connection error
        if (err.message.includes('Cannot connect to server') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Cannot connect to server. Please check if the backend is running.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Navigation */}
      <AuthHeader showLinks />

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Main Auth Card */}
        <div className={styles.authCard}>
          {/* Headline */}
          <div className={styles.headline}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Enter your credentials to access your workspace.</p>
          </div>

          {/* Error Action Panel */}
          {showError && error && (
            <ErrorAlert 
              title="Login Failed" 
              message={error} 
              onClose={handleCloseError} 
            />
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Email Field */}
            <label className={styles.inputGroup}>
              <p className={styles.inputLabel}>Email Address</p>
              <input
                className={styles.input}
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </label>

            {/* Password Field */}
            <PasswordInput
              label="Password"
              showPassword={showPassword}
              onToggleVisibility={() => setShowPassword(!showPassword)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              error={showError}
              showErrorIcon={showError}
              labelRight={
                <Link className={styles.forgotLink} to="/forgot-password">Forgot?</Link>
              }
            />

            {/* Submit Button */}
            <SubmitButton 
              loading={loading} 
              disabled={!email || !password}
              loadingText="Signing in..."
            >
              Sign In
            </SubmitButton>

            {/* Divider */}
            <Divider text="Or continue with" />

            {/* Social Login */}
            <SocialButtons variant="login" disabled={loading} onGoogleClick={handleGoogleLogin} />
          </form>

          {/* Card Footer */}
          <div className={styles.cardFooter}>
            <p className={styles.cardFooterText}>
              Don't have an account?
              <Link className={styles.signupLink} to="/register">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <AuthFooter showLinks />
      </div>
    </div>
  );
}