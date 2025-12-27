import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ForgotPassword.module.css'; // Reuse same styles
import { authApi } from '../../api/auth';
import {
  AuthHeader,
  AuthFooter,
  ArrowBackIcon,
  CheckCircleIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  SubmitButton,
} from '../../components/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header / Nav */}
      <AuthHeader />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Heading Section */}
          <div className={styles.headingSection}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              Enter your new password below. Password must be at least 8 characters.
            </p>
          </div>

          {/* Form Card */}
          <div className={styles.formCard}>
            {!success ? (
              <form onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                  }}>
                    {error}
                  </div>
                )}

                {/* New Password Input */}
                <label className={styles.inputGroup}>
                  <span className={styles.inputLabel}>New Password</span>
                  <div className={styles.inputWrapper}>
                    <input
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || !token}
                      minLength={12}
                    />
                    <button
                      type="button"
                      className={styles.inputIcon}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: 'pointer', pointerEvents: 'auto', background: 'none', border: 'none' }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </label>

                {/* Confirm Password Input */}
                <label className={styles.inputGroup} style={{ marginTop: '16px' }}>
                  <span className={styles.inputLabel}>Confirm Password</span>
                  <div className={styles.inputWrapper}>
                    <input
                      className={styles.input}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || !token}
                      minLength={12}
                    />
                    <button
                      type="button"
                      className={styles.inputIcon}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ cursor: 'pointer', pointerEvents: 'auto', background: 'none', border: 'none' }}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className={styles.actionButtons} style={{ marginTop: '24px' }}>
                  <SubmitButton 
                    loading={loading} 
                    disabled={!password || !confirmPassword || !token}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </SubmitButton>
                  <Link className={styles.backToLogin} to="/login">
                    <ArrowBackIcon />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </form>
            ) : (
              /* Success Message */
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>
                  <CheckCircleIcon />
                </div>
                <p className={styles.successText}>
                  Your password has been reset successfully! You will be redirected to the login page in a few seconds.
                </p>
              </div>
            )}

            {success && (
              <div className={styles.actionButtons}>
                <Link className={styles.backToLogin} to="/login">
                  <ArrowBackIcon />
                  <span>Go to Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
