'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class STACErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('STAC Error Boundary caught an error:', error, errorInfo)
    
    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-4">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-lg font-semibold">
                Erro na Interface STAC
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>Ocorreu um erro inesperado ao carregar a interface STAC.</p>
                {this.state.error && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 rounded-md">
                    <p className="text-sm font-mono text-red-800 dark:text-red-200">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
                
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-red-600 hover:underline">
                      Detalhes do erro (desenvolvimento)
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="default"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Voltar ao Início
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Se o problema persistir, entre em contato com o suporte:</p>
              <a 
                href="mailto:info@maredatum.pt" 
                className="text-blue-600 hover:underline"
              >
                info@maredatum.pt
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar com componentes funcionais
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}
