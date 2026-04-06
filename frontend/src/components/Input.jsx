import styles from './Input.module.css';

export default function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error = false,
  helperText = '',
  label = '',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={`${styles.input} ${styles[size]} ${error ? styles.error : ''}`}
        {...props}
      />
      {helperText && <span className={`${styles.helper} ${error ? styles.errorText : ''}`}>{helperText}</span>}
    </div>
  );
}
