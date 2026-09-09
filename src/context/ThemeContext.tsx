import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('spsd-theme');
    return (saved as Theme) || 'auto';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Sleduj systémové preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Vypočítej efektivní téma
  const effectiveTheme: 'light' | 'dark' = theme === 'auto' ? systemTheme : theme;

  // Aplikuj téma na document
  useEffect(() => {
    const root = document.documentElement;

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }

    // Aktualizuj meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1f2937' : '#1e40af');
    }
  }, [effectiveTheme]);

  const handleSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('spsd-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      handleSetTheme('dark');
    } else if (theme === 'dark') {
      handleSetTheme('auto');
    } else {
      handleSetTheme('light');
    }
  }, [theme, handleSetTheme]);

  const value = {
    theme,
    effectiveTheme,
    setTheme: handleSetTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};