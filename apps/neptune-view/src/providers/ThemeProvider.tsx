'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  forcedTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  forcedTheme
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(forcedTheme || defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (forcedTheme) {
      setThemeState(forcedTheme);
      setMounted(true);
      return;
    }

    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('bgapp-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(systemPrefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, [forcedTheme]);

  useEffect(() => {
    if (mounted) {
      if (!forcedTheme) {
        localStorage.setItem('bgapp-theme', theme);
      }
      // Apply theme to document
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted, forcedTheme]);

  const toggleTheme = () => {
    if (forcedTheme) return; // Cannot toggle if theme is forced
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    if (forcedTheme) return; // Cannot set if theme is forced
    setThemeState(newTheme);
  };

  // Avoid hydration mismatch for non-forced theme
  // If forced, we can render immediately if we're sure about the theme
  if (!mounted && !forcedTheme) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values during SSR or when provider is not available
    return {
      theme: 'dark' as Theme, // Default to dark for Neptune
      toggleTheme: () => { },
      setTheme: () => { }
    };
  }
  return context;
}