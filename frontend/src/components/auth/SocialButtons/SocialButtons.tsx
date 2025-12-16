import { GoogleIcon, MicrosoftIcon } from '../icons';
import styles from './SocialButtons.module.css';

interface SocialButtonsProps {
  onGoogleClick?: () => void;
  onMicrosoftClick?: () => void;
  variant?: 'login' | 'register';
  disabled?: boolean;
}

export default function SocialButtons({ 
  onGoogleClick, 
  onMicrosoftClick, 
  variant = 'login',
  disabled = false 
}: SocialButtonsProps) {
  if (variant === 'register') {
    return (
      <button 
        className={styles.googleAuthButton} 
        type="button" 
        onClick={onGoogleClick}
        disabled={disabled}
      >
        <GoogleIcon />
        <span className={styles.googleAuthButtonText}>Sign up with Google</span>
      </button>
    );
  }

  return (
    <div className={styles.socialButtons}>
      <button 
        className={styles.socialButton} 
        type="button" 
        onClick={onGoogleClick}
        disabled={disabled}
      >
        <GoogleIcon />
        <span className={styles.socialButtonText}>Google</span>
      </button>
      <button 
        className={styles.socialButton} 
        type="button" 
        onClick={onMicrosoftClick}
        disabled={disabled}
      >
        <MicrosoftIcon />
        <span className={styles.socialButtonText}>Microsoft</span>
      </button>
    </div>
  );
}
