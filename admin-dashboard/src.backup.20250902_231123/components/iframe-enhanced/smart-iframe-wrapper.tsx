'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

/**
 * 🚀 SMART IFRAME WRAPPER - Silicon Valley Grade A+
 * IFrame inteligente com prevenção de loops e otimizações
 */

interface SmartIFrameWrapperProps {
  title: string;
  description: string;
  src: string;
  icon?: React.ComponentType<any>;
  height?: string;
  allowFullscreen?: boolean;
  preventLoop?: boolean;
  showControls?: boolean;
}

export default function SmartIFrameWrapper({
  title,
  description,
  src,
  icon: Icon,
  height = "600px",
  allowFullscreen = true,
  preventLoop = true,
  showControls = true
}: SmartIFrameWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Prevenção de loops circulares
  const isCircularNavigation = preventLoop && (
    window.location.href.includes(src) ||
    src.includes(window.location.hostname + ':3000')
  );

  useEffect(() => {
    if (isCircularNavigation) {
      console.warn(`🔄 Navegação circular detectada para: ${src}`);
      setHasError(true);
    }
  }, [src, isCircularNavigation]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setLastRefresh(new Date());
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenExternal = () => {
    window.open(src, '_blank');
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Se detectar loop circular, mostrar aviso
  if (isCircularNavigation) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <ExclamationTriangleIcon className="h-6 w-6" />
              Navegação Circular Detectada
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Esta interface criaria um loop de navegação. Use o botão abaixo para abrir em nova aba.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2">{title}</h4>
                <p className="text-sm text-gray-600 mb-3">{description}</p>
                <Button onClick={handleOpenExternal} className="w-full">
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
              
              <div className="text-xs text-yellow-600">
                <strong>URL:</strong> {src}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className="h-full">
        <CardHeader className={`${isFullscreen ? 'pb-2' : 'pb-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-6 w-6 text-blue-600" />}
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </div>
            </div>
            
            {showControls && (
              <div className="flex items-center gap-2">
                {lastRefresh && (
                  <Badge variant="outline" className="text-xs">
                    Atualizado: {lastRefresh.toLocaleTimeString()}
                  </Badge>
                )}
                
                <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
                
                <Button size="sm" variant="outline" onClick={handleOpenExternal}>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Button>
                
                {allowFullscreen && (
                  <Button size="sm" variant="outline" onClick={handleToggleFullscreen}>
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={`${isFullscreen ? 'h-full pb-2' : 'pb-4'}`}>
          <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}>
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Carregando {title}...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm text-red-700 mb-3">Erro ao carregar interface</p>
                  <Button size="sm" onClick={handleRefresh}>
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

            {/* IFrame */}
            {!isCircularNavigation && (
              <iframe
                ref={iframeRef}
                src={src}
                className="w-full h-full border-0 rounded-lg"
                onLoad={handleLoad}
                onError={handleError}
                title={title}
                allowFullScreen={allowFullscreen}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            )}

            {/* Status Indicator */}
            {!isLoading && !hasError && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-600 text-white">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
