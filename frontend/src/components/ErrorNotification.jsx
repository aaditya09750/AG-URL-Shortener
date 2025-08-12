import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import styles from './ErrorNotification.module.css';

const ErrorNotification = () => {
  const { connectionError, clearConnectionError } = useApp();

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        clearConnectionError();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [connectionError, clearConnectionError]);

  if (!connectionError) return null;

  return (
    <div className={styles.notification}>
      <div className={styles.icon}>
        <AlertTriangle size={20} />
      </div>
      <div className={styles.message}>{connectionError}</div>
      <button 
        className={styles.closeButton} 
        onClick={clearConnectionError}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ErrorNotification;