import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ForgotPassword.module.css';
import { authApi } from '../../api/auth';
import {
  AuthHeader,
  AuthFooter,
  MailIcon,
  ArrowBackIcon,
  SecurityIcon,
  CheckCircleIcon,
  SubmitButton,
} from '../../components/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Still show success message for security (don't reveal if email exists)
      setSubmitted(true);
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
            <h1 className={styles.title}>Forgot Password?</h1>
            <p className={styles.subtitle}>
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form Card */}
          <div className={styles.formCard}>
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <label className={styles.inputGroup}>
                  <span className={styles.inputLabel}>Email Address</span>
                  <div className={styles.inputWrapper}>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      disabled={loading}
                    />
                    <div className={styles.inputIcon}>
                      <MailIcon />
                    </div>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className={styles.actionButtons} style={{ marginTop: '24px' }}>
                  <SubmitButton 
                    loading={loading} 
                    disabled={!email}
                    loadingText="Sending..."
                  >
                    Send Reset Link
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
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
            )}

            {submitted && (
              <div className={styles.actionButtons}>
                <Link className={styles.backToLogin} to="/login">
                  <ArrowBackIcon />
                  <span>Back to Login</span>
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
              If you don't see the email in your inbox within a few minutes, please check your spam folder or ensure the email address you entered is correct.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
