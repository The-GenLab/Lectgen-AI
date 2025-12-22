import { GoogleIcon } from '../icons';
import styles from './SocialButtons.module.css';
import { getGoogleAuthUrl } from '../../../api/auth';

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

  const handleGoogleClick = () => {
    if (onGoogleClick) {
      onGoogleClick();
    } else {
      // Redirect to backend Google OAuth endpoint
      window.location.href = getGoogleAuthUrl();
    }
  };

  return (
    <button 
      className={styles.googleButton} 
      type="button" 
      onClick={handleGoogleClick}
      disabled={disabled}
    >
      <GoogleIcon />
      <span className={styles.googleButtonText}>{buttonText}</span>
    </button>
  );
}
