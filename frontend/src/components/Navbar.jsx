import { useState } from 'react';
import { Moon, Sun, Shield, Menu, X, Link as LinkIcon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useApp } from '../contexts/AppContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { showAdmin, setShowAdmin } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <LinkIcon className={styles.brandIcon} />
          <span className={styles.brandText}>URL SHORTENER</span>
        </div>

        <div className={`${styles.navItems} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
          <button
            className={styles.adminBtn}
            onClick={() => setShowAdmin(!showAdmin)}
            aria-label="Toggle admin panel"
          >
            <Shield size={18} />
            <span>Admin</span>
          </button>
          
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <button
          className={styles.mobileToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;