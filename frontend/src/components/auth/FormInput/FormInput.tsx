import type { ReactNode, InputHTMLAttributes } from 'react';
import styles from './FormInput.module.css';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
  error?: boolean;
  rightElement?: ReactNode;
  labelRight?: ReactNode;
}

export default function FormInput({
  label,
  icon,
  hint,
  error,
  rightElement,
  labelRight,
  className,
  ...inputProps
}: FormInputProps) {
  return (
    <label className={styles.inputGroup}>
      <div className={styles.labelRow}>
        <span className={styles.inputLabel}>{label}</span>
        {labelRight}
      </div>
      <div className={styles.inputWrapper}>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
          {...inputProps}
        />
        {icon && <div className={styles.inputIcon}>{icon}</div>}
        {rightElement}
      </div>
      {hint && <p className={styles.inputHint}>{hint}</p>}
    </label>
  );
}
