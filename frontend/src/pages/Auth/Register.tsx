import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Register.module.css';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import {
  LogoIcon,
  AutoAwesomeIcon,
  MailIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  VerifiedUserIcon,
  SocialButtons,
  Divider,
  SubmitButton,
  ErrorAlert,
} from '../../components/auth';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { setAuth, refreshAuth } = useAuth();

  // Handle Google OAuth callback (in case user is redirected here)
  useEffect(() => {
    const googleAuthSuccess = searchParams.get('success');
    const googleAuthError = searchParams.get('error');

    if (googleAuthSuccess === 'true') {
      // Google signup successful, refresh to get tokens from cookies
      const handleGoogleAuth = async () => {
        try {
          const success = await refreshAuth();
          if (success) {
            navigate('/login-success');
          } else {
            setError('Failed to complete Google authentication');
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('Failed to complete Google authentication');
          }
        }
      };
      handleGoogleAuth();
    } else if (googleAuthError === 'google_auth_failed') {
      setError('Google authentication failed. Please try again.');
    }
  }, [searchParams, navigate, refreshAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if email already exists
      const { exists } = await authApi.checkEmail(email);
      if (exists) {
        setError('Email already registered. Please login instead.');
        setLoading(false);
        return;
      }

      const { accessToken, user } = await authApi.register({ email, password });
      
      // Store access token in memory via context (not localStorage)
      setAuth(accessToken, user);
      
      // Redirect to success page
      navigate('/login-success');
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      {/* Left Side: Feature / Value Proposition */}
      <div className={styles.leftFeatureSection}>
        {/* Background decoration */}
        <div className={styles.featureBackground}></div>
        
        <div className={styles.featureContent}>
          <div className={styles.featureHeading}>
            <h1 className={styles.featureTitle}>
              Get started with LectGen
            </h1>
            <p className={styles.featureDescription}>
              Create professional slides in seconds. No design skills required.
            </p>
          </div>

          {/* Feature Card Preview */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardImage}>
              <div 
                className={styles.featureCardImageBg}
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD2z7XoLggAuSF2_eYnQO8bTAtJ442jliVXAongsTmRcB18Y4te0c6xCP4q40OjoDLpubgFT0oetyMWmIvUp-gSVYtPRHQUfyEeF9N9JxknAk15dGYalPVDICgsVADLWVptzIm9BhmBxNegDGNoiAgIj8LEw10gw1XUPCi7kGdV2b6YVAVbNLK7LsmBbOPHkFIRFS11ekS17Ebt8NoFuFEPttKneXcmPjVEG7r5h7wx_0uZFLsUvdsI4lKR0sWgt30k-Sl3gFIgI5E")'
                }}
              ></div>
              {/* UI Overlay Simulation */}
              <div className={styles.featureCardOverlay}>
                <span className={styles.featureCardIcon}>
                  <AutoAwesomeIcon />
                </span>
                <div className={styles.featureCardOverlayText}>
                  <span className={styles.featureCardOverlayTitle}>Generating Slides...</span>
                  <span className={styles.featureCardOverlaySubtitle}>Processing natural language prompt</span>
                </div>
                <div className={styles.featureCardPulse}>
                  <span className={styles.featureCardPulseDot}></span>
                </div>
              </div>
            </div>
            <div>
              <p className={styles.featureCardTitle}>AI Powered Design</p>
              <p className={styles.featureCardSubtitle}>From prompt to presentation in under 30 seconds.</p>
            </div>
          </div>

          <div className={styles.trustBadge}>
            <VerifiedUserIcon />
            <span>Trusted by 10,000+ presenters</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sign Up Form */}
      <div className={styles.rightFormSection}>
        <div className={styles.registerFormWrapper}>
          {/* Header/Logo */}
          <div className={styles.registerHeader}>
            <div className={styles.registerLogoSection}>
              <div className={styles.registerLogoIcon}>
                <LogoIcon />
              </div>
              <h2 className={styles.registerLogoText}>LectGen</h2>
            </div>
            <div className={styles.registerTitleSection}>
              <h1 className={styles.registerTitle}>Create your account</h1>
              <p className={styles.registerSubtitle}>Start creating AI presentations for free</p>
            </div>
          </div>

          {/* Social Auth */}
          <SocialButtons variant="register" disabled={loading} />

          {/* Divider */}
          <Divider text="Or continue with email" />

          {/* Error Message */}
          {error && (
            <ErrorAlert 
              title="Registration Failed" 
              message={error} 
              closable={false}
            />
          )}

          {/* Form */}
          <form className={styles.registerForm} onSubmit={handleSubmit}>
            {/* Email Field */}
            <label className={styles.registerInputGroup}>
              <span className={styles.registerInputLabel}>Email address</span>
              <div className={styles.registerInputWrapper}>
                <input
                  className={styles.registerInput}
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                />
                <div className={styles.registerInputIcon}>
                  <MailIcon />
                </div>
              </div>
            </label>

            {/* Password Field */}
            <label className={styles.registerInputGroup}>
              <span className={styles.registerInputLabel}>Password</span>
              <div className={styles.registerInputWrapper}>
                <input
                  className={styles.registerInput}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                />
                <div 
                  className={`${styles.registerInputIcon} ${styles.registerInputIconClickable}`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </div>
              </div>
              <p className={styles.registerInputHint}>Must be at least 12 characters</p>
            </label>

            {/* Submit Button */}
            <SubmitButton 
              loading={loading} 
              disabled={!email || !password}
              loadingText="Creating Account..."
            >
              Create Account
            </SubmitButton>
          </form>

          {/* Footer Links */}
          <div className={styles.registerFooter}>
            <p className={styles.registerFooterText}>
              Already have an account? <Link className={styles.registerFooterLink} to="/login">Log in</Link>
            </p>
            <p className={styles.registerTermsText}>
              By signing up, you agree to our{' '}
              <a className={styles.registerTermsLink} href="#">Terms of Service</a> and{' '}
              <a className={styles.registerTermsLink} href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
