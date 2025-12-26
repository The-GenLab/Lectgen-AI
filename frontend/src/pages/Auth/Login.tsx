import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, refreshAuth } = useAuth();

  // Handle Google OAuth callback
  useEffect(() => {
    const googleAuthSuccess = searchParams.get('success');
    const googleAuthError = searchParams.get('error');

    if (googleAuthSuccess === 'true') {
      // Google login successful, refresh to get tokens from cookies
      const handleGoogleAuth = async () => {
        try {
          const success = await refreshAuth();
          if (success) {
            navigate('/login-success');
          } else {
            setError('Failed to complete Google authentication');
            setShowError(true);
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('Failed to complete Google authentication');
          }
          setShowError(true);
        }
      };
      handleGoogleAuth();
    } else if (googleAuthError === 'google_auth_failed') {
      setError('Google authentication failed. Please try again.');
      setShowError(true);
    }
  }, [searchParams, navigate, refreshAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) return;

    setLoading(true);
    setError('');
    setShowError(false);

    try {
      const { accessToken, user } = await authApi.login({ email, password });

      // Store access token in memory via context (not localStorage)
      setAuth(accessToken, user);

      // Redirect to success page (shows loading animation then redirects to dashboard)
      navigate('/login-success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Incorrect email or password. Please try again.');
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
            <SocialButtons variant="login" disabled={loading} />
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