'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { getThemeStyles } from '@/lib/theme-utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const styles = getThemeStyles(theme);

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${styles.cardBackground}
        ${styles.cardBorder}
        ${styles.primaryText}
        ${styles.buttonHover}
        transition-all duration-200
        rounded-lg
        flex items-center justify-center
        ${className}
      `}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon className={`${iconSizes[size]} transition-transform duration-200 hover:scale-110`} />
      ) : (
        <Sun className={`${iconSizes[size]} transition-transform duration-200 hover:scale-110`} />
      )}
    </button>
  );
}