'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface DataLoadingStateProps {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataLoadingState({
  isLoading,
  error,
  lastUpdate,
  onRetry,
  children
}: DataLoadingStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Show loading state
  if (isLoading && !lastUpdate) {
    return (
      <div className={`
        w-full h-full min-h-[200px]
        flex flex-col items-center justify-center
        ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'}
        backdrop-blur-sm
        rounded-lg
        p-8
      `}>
        <LoadingSpinner size="lg" text="Carregando dados..." />
        <p className={`mt-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Conectando aos serviços de dados
        </p>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !lastUpdate) {
    return (
      <div className={`
        w-full h-full min-h-[200px]
        flex flex-col items-center justify-center
        ${isDark ? 'bg-red-900/20' : 'bg-red-50'}
        border ${isDark ? 'border-red-800' : 'border-red-200'}
        rounded-lg
        p-8
      `}>
        <div className={`
          w-16 h-16 rounded-full
          flex items-center justify-center
          ${isDark ? 'bg-red-900/50' : 'bg-red-100'}
          mb-4
        `}>
          <WifiOff className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
        </div>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-red-300' : 'text-red-800'} mb-2`}>
          Erro de Conexão
        </h3>
        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} mb-4 text-center max-w-xs`}>
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              px-4 py-2 rounded-lg
              ${isDark 
                ? 'bg-red-800/50 hover:bg-red-700/50 text-red-200' 
                : 'bg-red-100 hover:bg-red-200 text-red-700'}
              transition-colors
              font-medium
              text-sm
            `}
          >
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  // Show children with optional loading overlay
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={`
          absolute inset-0
          ${isDark ? 'bg-slate-900/60' : 'bg-white/60'}
          backdrop-blur-[2px]
          flex items-center justify-center
          rounded-lg
          z-10
        `}>
          <LoadingSpinner size="md" text="Atualizando..." />
        </div>
      )}
    </div>
  );
}

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function ConnectionStatusBadge({ isConnected, lastUpdate }: ConnectionStatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`
      inline-flex items-center gap-2
      px-3 py-1.5 rounded-full
      ${isConnected
        ? isDark 
          ? 'bg-green-900/30 border border-green-800 text-green-400' 
          : 'bg-green-100 border border-green-200 text-green-700'
        : isDark
          ? 'bg-red-900/30 border border-red-800 text-red-400'
          : 'bg-red-100 border border-red-200 text-red-700'
      }
    `}>
      {isConnected ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Desconectado</span>
        </>
      )}
    </div>
  );
}

interface ApiErrorToastProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ApiErrorToast({ error, onDismiss }: ApiErrorToastProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!error) return null;

  return (
    <div className={`
      fixed top-20 left-1/2 transform -translate-x-1/2
      z-50
      animate-in fade-in slide-in-from-top-2
    `}>
      <div className={`
        flex items-center gap-3
        px-4 py-3 rounded-xl
        shadow-lg
        ${isDark 
          ? 'bg-red-900/90 border border-red-700 text-red-100' 
          : 'bg-red-50 border border-red-200 text-red-800'}
        backdrop-blur-xl
      `}>
        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
        <p className="text-sm font-medium">{error}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              ml-2 px-2 py-1 rounded
              text-xs font-medium
              ${isDark 
                ? 'hover:bg-red-800 text-red-300' 
                : 'hover:bg-red-100 text-red-600'}
              transition-colors
            `}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
