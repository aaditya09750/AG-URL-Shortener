import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('theme');
        return saved ? JSON.parse(saved) : false;
      } catch (error) {
        console.warn('Failed to read theme from localStorage:', error);
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    // Only run this effect in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('theme', JSON.stringify(isDark));
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};