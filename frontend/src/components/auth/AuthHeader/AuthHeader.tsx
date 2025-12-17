import { LogoIcon } from '../icons';
import styles from './AuthHeader.module.css';

interface AuthHeaderProps {
  showLinks?: boolean;
}

export default function AuthHeader({ showLinks = false }: AuthHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLogo}>
        <div className={styles.logoIcon}>
          <LogoIcon />
        </div>
        <h2 className={styles.logoText}>LectGen</h2>
      </div>
      {showLinks && (
        <div className={styles.headerLinks}>
          <a className={styles.headerLink} href="#">Help</a>
          <a className={styles.headerLink} href="#">Contact</a>
        </div>
      )}
    </header>
  );
}
