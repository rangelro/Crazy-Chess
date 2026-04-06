import { useEffect } from 'react';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, children, title = '', size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.modal} ${styles[size]}`}>
        {title && <div className={styles.header}>{title}</div>}
        <div className={styles.body}>{children}</div>
      </div>
    </>
  );
}
