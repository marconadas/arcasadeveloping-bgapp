'use client';

import { useTheme } from '@/providers/ThemeProvider';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text = 'Carregando...'
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]}
          border-blue-500/30
          border-t-blue-500
          rounded-full
          animate-spin
        `}
      />
      {text && (
        <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {text}
        </span>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({ isLoading, children, text }: LoadingOverlayProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className={`
        absolute inset-0 
        ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} 
        backdrop-blur-sm
        flex items-center justify-center
        z-50
        rounded-lg
      `}>
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            animate-pulse
            ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
            rounded
            ${className}
          `}
        />
      ))}
    </>
  );
}
