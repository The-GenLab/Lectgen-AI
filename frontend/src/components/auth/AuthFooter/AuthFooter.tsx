import styles from './AuthFooter.module.css';

interface AuthFooterProps {
  showLinks?: boolean;
}

export default function AuthFooter({ showLinks = false }: AuthFooterProps) {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerText}>© 2025 LectGen-AI. All rights reserved.</p>
      {showLinks && (
        <div className={styles.footerLinks}>
          <a className={styles.footerLink} href="#">Privacy Policy</a>
          <a className={styles.footerLink} href="#">Terms of Service</a>
        </div>
      )}
    </footer>
  );
}
