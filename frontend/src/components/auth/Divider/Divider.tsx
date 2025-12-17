import styles from './Divider.module.css';

interface DividerProps {
  text: string;
}

export default function Divider({ text }: DividerProps) {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerLine}></div>
      <span className={styles.dividerText}>{text}</span>
      <div className={styles.dividerLine}></div>
    </div>
  );
}
