import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Success.module.css';
import { AuthHeader, CheckIcon } from '../../components/auth';
import { authApi } from '../../api/auth';

export default function Success() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data from backend after Google OAuth
    const fetchUserData = async () => {
      try {
        const response = await authApi.me();
        if (response.success && response.data?.user) {
          // Save only basic user info to sessionStorage (auto-cleared on tab close)
          const basicUserInfo = {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
          };
          sessionStorage.setItem('user', JSON.stringify(basicUserInfo));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If failed, redirect to login
        navigate('/login');
        return;
      }
    };

    fetchUserData();

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Redirect to dashboard after loading complete
          setTimeout(() => {
            // Check if user is admin and redirect accordingly
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              if (user.role === 'ADMIN') {
                navigate('/admin');
                return;
              }
            }
            navigate('/');
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [navigate]);

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
