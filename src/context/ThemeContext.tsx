import React, { createContext, useContext, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'karne_theme_preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always lock to pure light mode
  const theme: ThemeMode = 'light';
  const isDark = false;

  useEffect(() => {
    // Ensure dark class is completely removed from document and body
    const root = document.documentElement;
    root.classList.remove('dark');
    document.body.classList.remove('dark');
    root.style.colorScheme = 'light';

    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    } catch {}
  }, []);

  const setTheme = () => {
    // No-op, always light
  };

  const toggleTheme = () => {
    // No-op, always light
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
