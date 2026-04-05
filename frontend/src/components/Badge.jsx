import styles from './Badge.module.css';

export default function Badge({ children, variant = 'primary', size = 'md', className = '' }) {
  return <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>{children}</span>;
}
