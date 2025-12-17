import styles from './SubmitButton.module.css';

interface SubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function SubmitButton({ 
  loading = false, 
  disabled = false, 
  loadingText = 'Loading...',
  children 
}: SubmitButtonProps) {
  return (
    <button
      className={styles.submitButton}
      type="submit"
      disabled={loading || disabled}
    >
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
