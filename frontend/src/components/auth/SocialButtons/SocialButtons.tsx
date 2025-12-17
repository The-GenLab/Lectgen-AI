import { GoogleIcon } from '../icons';
import styles from './SocialButtons.module.css';

interface SocialButtonsProps {
  onGoogleClick?: () => void;
  variant?: 'login' | 'register';
  disabled?: boolean;
}

export default function SocialButtons({ 
  onGoogleClick, 
  variant = 'login',
  disabled = false 
}: SocialButtonsProps) {
  const buttonText = variant === 'register' ? 'Sign up with Google' : 'Sign in with Google';

  return (
    <button 
      className={styles.googleButton} 
      type="button" 
      onClick={onGoogleClick}
      disabled={disabled}
    >
      <GoogleIcon />
      <span className={styles.googleButtonText}>{buttonText}</span>
    </button>
  );
}
