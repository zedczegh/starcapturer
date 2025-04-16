
import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Default to system theme
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Try to get the theme from localStorage
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      return storedTheme || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    // Update localStorage when theme changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);

      // Apply theme to document
      const root = window.document.documentElement;
      
      // Remove previous theme classes
      root.classList.remove('light', 'dark');
      
      // Set the theme class
      if (theme === 'system') {
        // Check system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
