import type { InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon, ErrorIcon } from '../icons';
import styles from './PasswordInput.module.css';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: boolean;
  showErrorIcon?: boolean;
  labelRight?: React.ReactNode;
}

export default function PasswordInput({
  label,
  showPassword,
  onToggleVisibility,
  error,
  showErrorIcon,
  labelRight,
  className,
  ...inputProps
}: PasswordInputProps) {
  return (
    <label className={styles.inputGroup}>
      <div className={styles.labelRow}>
        <span className={styles.inputLabel}>{label}</span>
        {labelRight}
      </div>
      <div className={styles.passwordWrapper}>
        <input
          className={`${styles.input} ${styles.passwordInput} ${error ? styles.inputError : ''} ${className || ''}`}
          type={showPassword ? 'text' : 'password'}
          {...inputProps}
        />
        {showErrorIcon && error ? (
          <span className={styles.passwordErrorIcon}>
            <ErrorIcon />
          </span>
        ) : (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={onToggleVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </label>
  );
}
