import { ErrorIcon, CloseIcon } from '../icons';
import styles from './ErrorAlert.module.css';

interface ErrorAlertProps {
  title: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
}

export default function ErrorAlert({ title, message, onClose, closable = true }: ErrorAlertProps) {
  return (
    <div className={styles.errorPanel}>
      <div className={styles.errorBox}>
        <div className={styles.errorContent}>
          <span className={styles.errorIcon}>
            <ErrorIcon />
          </span>
          <div className={styles.errorText}>
            <p className={styles.errorTitle}>{title}</p>
            <p className={styles.errorMessage}>{message}</p>
          </div>
          {closable && onClose && (
            <button className={styles.errorClose} onClick={onClose}>
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
