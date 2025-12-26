import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Success.module.css';
import { AuthHeader, CheckIcon } from '../../components/auth';
import { useAuth } from '../../context/AuthContext';

export default function Success() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  useEffect(() => {
    // If no user/token, redirect back to login
    // This handles the case where someone directly navigates to /login-success
    if (!user && !accessToken) {
      navigate('/login', { replace: true });
      return;
    }

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Redirect based on user role after loading complete
          setTimeout(() => {
            if (user?.role === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [navigate, user, accessToken]);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className={styles.pageContainer}>
      {/* Top Navigation */}
      <AuthHeader />

      {/* Main Layout Container */}
      <div className={styles.mainLayout}>
        <div className={styles.contentContainer}>
          {/* Success Card */}
          <div className={styles.successCard}>
            {/* Visual Illustration */}
            <div className={styles.illustrationWrapper}>
              {/* Background glow effect */}
              <div className={styles.glowEffect}></div>
              {/* Main Image/Icon container */}
              <div className={styles.mainImage}></div>
              {/* Floating status icon badge */}
              <div className={styles.statusBadge}>
                <CheckIcon />
              </div>
            </div>

            {/* Text Content */}
            <div className={styles.textContent}>
              <h1 className={styles.title}>Login Successful</h1>
              <p className={styles.description}>
                Welcome back! We are preparing your personalized AI workspace. You can start creating slides in just a moment.
              </p>
            </div>

            {/* Progress Bar Section */}
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span>Loading workspace</span>
                <span>{displayProgress}%</span>
              </div>
              <div className={styles.progressBarWrapper}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${displayProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Manual Redirect Link */}
            <div className={styles.redirectLink}>
              <Link to="/">
                If you are not redirected automatically, click here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>Powered by LectGen Engine v2.0</p>
      </footer>
    </div>
  );
}
