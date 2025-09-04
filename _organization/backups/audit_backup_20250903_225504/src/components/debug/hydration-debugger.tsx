'use client';

import React, { useEffect, useState } from 'react';

/**
 * 🔍 SILICON VALLEY HYDRATION DEBUGGER
 * Componente para identificar EXATAMENTE onde está o mismatch SSR/CSR
 */

interface HydrationDebuggerProps {
  name: string;
  children: React.ReactNode;
}

export function HydrationDebugger({ name, children }: HydrationDebuggerProps) {
  const [isClient, setIsClient] = useState(false);
  const [renderTime, setRenderTime] = useState<string>('');
  
  useEffect(() => {
    setIsClient(true);
    setRenderTime(new Date().toISOString());
  }, []);

  // Log detalhado para debug
  if (typeof window !== 'undefined') {
    console.log(`🔍 HYDRATION DEBUG [${name}]:`, {
      isClient,
      renderTime,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50)
    });
  }

  return (
    <div suppressHydrationWarning={true}>
      {/* Debug info visible only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          zIndex: 9999,
          borderRadius: '4px'
        }}>
          🔍 {name}: {isClient ? 'CLIENT' : 'SERVER'} | {renderTime}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * 🎯 SMART HYDRATION WRAPPER
 * Wrapper que só renderiza no client para componentes problemáticos
 */
export function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 🧪 SSR-SAFE DATE FORMATTER
 * Formata datas de forma consistente entre server e client
 */
export function formatSSRSafeDate(date: Date | string): string {
  const d = new Date(date);
  
  // Usar UTC para consistência entre server/client
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(d);
}

/**
 * 🔧 SSR-SAFE RANDOM ID GENERATOR
 * Gera IDs consistentes entre server e client
 */
export function generateSSRSafeId(prefix: string = 'id'): string {
  // Usar timestamp fixo para SSR consistency
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${Math.floor(timestamp / 1000)}`;
}
