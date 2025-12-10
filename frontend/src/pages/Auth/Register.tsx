import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Login.module.css';

export default function Register() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const isPasswordValid = password.length >= 12;
  const showError = touched && !isPasswordValid;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isPasswordValid) return;
    
    // TODO: Call API to register
    console.log('Register:', { email, password });
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
          <h2 className={styles.title}>Tạo tài khoản của bạn</h2>
          <p className={styles.subtitle}>
            Đặt mật khẩu cho OpenAI để tiếp tục
          </p>

          {/* Email Display (Read-only) */}
          <div className={styles.emailDisplay}>
            <label className={styles.label}>Địa chỉ email</label>
            <div className={styles.emailReadonly}>
              {email}
              <a href="/log-in-or-create-account" className={styles.editLink}>
                Chỉnh sửa
              </a>
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.passwordField}>
            <label className={styles.label}>Mật khẩu</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${styles.emailInput} ${showError ? styles.inputError : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password validation message */}
            {showError && (
              <div className={styles.validationBox}>
                <p className={styles.validationTitle}>Mật khẩu của bạn phải chứa:</p>
                <ul className={styles.validationList}>
                  <li className={password.length >= 12 ? styles.valid : styles.invalid}>
                    Ít nhất 12 ký tự
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button 
            className={styles.submitButton} 
            onClick={handleSubmit}
            disabled={!isPasswordValid}
          >
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
