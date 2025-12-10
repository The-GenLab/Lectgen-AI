import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!email) return;

    try {
      // TODO: Call API to check if email exists
      // const response = await fetch(`/api/auth/check-email?email=${email}`);
      // const data = await response.json();
      
      // Giả sử email chưa tồn tại → Navigate to register
      const emailExists = false; // TODO: Replace with API call
      
      if (emailExists) {
        // TODO: Navigate to login with password page
        console.log('Email exists, show password input');
      } else {
        // Navigate to register page
        navigate('/register', { state: { email } });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left side - Logo */}
      <div className={styles.leftSection}>
        <h1 className={styles.logo}>ChatGPT</h1>
      </div>

      {/* Right side - Form */}
      <div className={styles.rightSection}>
        <div className={styles.formWrapper}>
          <h2 className={styles.title}>Đăng nhập hoặc đăng ký</h2>
          <p className={styles.subtitle}>
            Bạn sẽ nhận được phản hồi thông minh hơn và có thể tải lên tệp, hình ảnh, v.v.
          </p>

          <div className={styles.oauthButtons}>
            {/* Nút Google */}
            <button className={styles.oauthButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            {/* Nút Apple */}
            <button className={styles.oauthButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000000"/>
              </svg>
              <span>Tiếp tục với Apple</span>
            </button>

            {/* Nút Microsoft */}
            <button className={styles.oauthButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11.4 11.4H2V2h9.4v9.4z" fill="#F25022"/>
                <path d="M22 11.4h-9.4V2H22v9.4z" fill="#7FBA00"/>
                <path d="M11.4 22H2v-9.4h9.4V22z" fill="#00A4EF"/>
                <path d="M22 22h-9.4v-9.4H22V22z" fill="#FFB900"/>
              </svg>
              <span>Tiếp tục với Microsoft</span>
            </button>

            {/* Nút Phone */}
            <button className={styles.oauthButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#2D333A"/>
              </svg>
              <span>Tiếp tục với điện thoại</span>
            </button>
          </div>

          <div className={styles.divider}>
            <span>HOẶC</span>
          </div>

          {/* Email input */}
          <input
            type="email"
            placeholder="Địa chỉ email"
            className={styles.emailInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Submit button */}
          <button className={styles.submitButton} onClick={handleContinue}>
            Tiếp tục
          </button>

          {/* Footer Links */}
          <div className={styles.footer}>
            <a href="#" className={styles.footerLink}>Điều khoản sử dụng</a>
            <span className={styles.separator}>|</span>
            <a href="#" className={styles.footerLink}>Chính sách riêng tư</a>
          </div>
        </div>
      </div>
    </div>
  );
}