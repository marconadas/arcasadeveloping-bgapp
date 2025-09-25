'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ENV } from '@/config/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 🛡️ Error Boundary Silicon Valley Style
 * Captura todos os erros client-side e oferece fallbacks inteligentes
 */
export class ErrorBoundarySiliconValley extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Silicon Valley Error Boundary caught error:', error);
    console.error('📊 Error Info:', errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // Log para analytics (se disponível)
    if (ENV.isProduction && typeof window !== 'undefined') {
      // Enviar erro para analytics Cloudflare
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {}); // Falhar silenciosamente
      } catch {}
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão Silicon Valley
      return (
        <Card className="m-4 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              🚨 Erro de Aplicação Detectado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">
              Ocorreu um erro client-side. O sistema está a funcionar no modo de recuperação.
            </p>
            
            <div className="bg-white p-4 rounded border">
              <p className="font-medium text-gray-800">Possíveis causas:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                <li>Migração Docker → Cloudflare em progresso</li>
                <li>URLs localhost ainda não convertidas</li>
                <li>APIs não disponíveis no ambiente atual</li>
                <li>Problemas de hydration SSR/CSR</li>
              </ul>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="bg-gray-100 p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium">Detalhes Técnicos</summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                🔄 Tentar Novamente
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default"
              >
                🔄 Recarregar Página
              </Button>
              {ENV.isProduction && (
                <Button 
                  onClick={() => window.open('https://bgapp-admin.pages.dev', '_blank')} 
                  variant="secondary"
                >
                  🌐 Abrir Nova Instância
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500 border-t pt-3">
              <p>🌐 Ambiente: {ENV.isProduction ? 'Cloudflare (Produção)' : 'Local (Desenvolvimento)'}</p>
              <p>🕐 Timestamp: {new Date().toLocaleString()}</p>
              <p>🔧 Sistema: BGAPP v2.0.0 Silicon Valley Edition</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 🎯 HOC para envolver componentes automaticamente
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundarySiliconValley fallback={fallback}>
        <Component {...props} />
      </ErrorBoundarySiliconValley>
    );
  };
}
