import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ResetPassword.module.css';
import { authApi } from '../../api/auth';
import {
  AuthHeader,
  AuthFooter,
  ArrowBackIcon,
  CheckCircleIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  SubmitButton,
  SecurityIcon,
} from '../../components/auth';

// Password requirement check icon
const CheckIcon = ({ valid }: { valid: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="16" 
    viewBox="0 -960 960 960" 
    width="16" 
    fill={valid ? '#22c55e' : '#9ca3af'}
  >
    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
  </svg>
);

// Warning icon for expired token
const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48" fill="currentColor">
    <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/>
  </svg>
);

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
  
  // Token validation states
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  const token = searchParams.get('token');

  // Password validation rules
  const passwordValidation = useMemo(() => ({
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const isPasswordValid = useMemo(() => 
    Object.values(passwordValidation).every(Boolean),
    [passwordValidation]
  );

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Validate token when page loads
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        setTokenValid(false);
        setTokenError('No reset token provided. Please request a new password reset link.');
        return;
      }

      try {
        await authApi.validateResetToken(token);
        setTokenValid(true);
        setTokenError('');
      } catch (err) {
        setTokenValid(false);
        if (err instanceof Error) {
          setTokenError(err.message);
        } else {
          setTokenError('Invalid or expired reset link. Please request a new one.');
        }
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) return;

    if (!isPasswordValid) {
      setError('Password does not meet security requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset link');
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

  // Show loading while validating token
  if (validatingToken) {
    return (
      <div className={styles.pageContainer}>
        <AuthHeader />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.formCard}>
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Validating reset link...</p>
              </div>
            </div>
          </div>
        </main>
        <AuthFooter />
      </div>
    );
  }

  // Show error if token is invalid/expired
  if (!tokenValid) {
    return (
      <div className={styles.pageContainer}>
        <AuthHeader />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.headingSection}>
              <h1 className={styles.title}>Link Expired</h1>
            </div>
            <div className={styles.formCard}>
              <div className={styles.expiredContainer}>
                <div className={styles.expiredIcon}>
                  <WarningIcon />
                </div>
                <h3 className={styles.expiredTitle}>Reset Link Invalid or Expired</h3>
                <p className={styles.expiredText}>
                  {tokenError || 'This password reset link has expired or is invalid. For security reasons, reset links are only valid for 15 minutes.'}
                </p>
                <div className={styles.expiredActions}>
                  <Link className={styles.requestNewLink} to="/forgot-password">
                    Request New Reset Link
                  </Link>
                  <Link className={styles.backToLogin} to="/login">
                    <ArrowBackIcon />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <AuthFooter />
      </div>
    );
  }

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
              Enter your new password below. Make sure it's strong enough to protect your account.
            </p>
          </div>

          {/* Form Card */}
          <div className={styles.formCard}>
            {!success ? (
              <form onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className={styles.errorMessage}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                      <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* New Password Input */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>New Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      className={`${styles.input} ${password && !isPasswordValid ? styles.inputError : ''} ${password && isPasswordValid ? styles.inputSuccess : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || !token}
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className={styles.passwordRequirements}>
                    <p className={styles.requirementsTitle}>Password requirements:</p>
                    <ul className={styles.requirementsList}>
                      <li className={passwordValidation.minLength ? styles.valid : ''}>
                        <CheckIcon valid={passwordValidation.minLength} />
                        <span>At least 12 characters</span>
                      </li>
                      <li className={passwordValidation.hasUppercase ? styles.valid : ''}>
                        <CheckIcon valid={passwordValidation.hasUppercase} />
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </li>
                      <li className={passwordValidation.hasLowercase ? styles.valid : ''}>
                        <CheckIcon valid={passwordValidation.hasLowercase} />
                        <span>At least 1 lowercase letter (a-z)</span>
                      </li>
                      <li className={passwordValidation.hasNumber ? styles.valid : ''}>
                        <CheckIcon valid={passwordValidation.hasNumber} />
                        <span>At least 1 number (0-9)</span>
                      </li>
                      <li className={passwordValidation.hasSpecial ? styles.valid : ''}>
                        <CheckIcon valid={passwordValidation.hasSpecial} />
                        <span>At least 1 special character (!@#$%...)</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Confirm Password Input */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      className={`${styles.input} ${confirmPassword && !passwordsMatch ? styles.inputError : ''} ${passwordsMatch ? styles.inputSuccess : ''}`}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || !token}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <span className={styles.fieldError}>Passwords do not match</span>
                  )}
                  {passwordsMatch && (
                    <span className={styles.fieldSuccess}>Passwords match</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                  <SubmitButton 
                    loading={loading} 
                    disabled={!isPasswordValid || !passwordsMatch || !token}
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
                <div className={styles.successContent}>
                  <h3 className={styles.successTitle}>Password Reset Successful!</h3>
                  <p className={styles.successText}>
                    Your password has been changed. You will be redirected to the login page in a few seconds.
                  </p>
                </div>
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

          {/* Security Note */}
          <div className={styles.securityNote}>
            <div className={styles.securityIcon}>
              <SecurityIcon />
            </div>
            <p className={styles.securityText}>
              For account security, use a strong password and don't share it with anyone. 
              The reset link is only valid for 15 minutes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
