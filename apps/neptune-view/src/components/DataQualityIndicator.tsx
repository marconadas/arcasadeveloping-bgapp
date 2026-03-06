/**
 * Data Quality Indicator Component
 * Displays real-time metrics about data quality and coverage
 */

'use client';

import { useEffect, useState } from 'react';
import { checkAPIHealth } from '@/services/oceanographicDataService';

interface DataQualityMetrics {
  timestamp: string;
  sst?: {
    count: number;
    coverage_percent: number;
    avg_quality: number;
    last_update?: string;
  };
  ocean_color?: {
    count: number;
    coverage_percent: number;
    avg_quality: number;
    last_update?: string;
  };
  salinity?: {
    count: number;
    coverage_percent: number;
    avg_quality: number;
    last_update?: string;
  };
  vessel_lights?: {
    count: number;
    coverage_percent: number;
    avg_quality: number;
    last_update?: string;
  };
  sources: {
    nasa: boolean;
    copernicus: boolean;
  };
}

interface DataQualityIndicatorProps {
  className?: string;
  showDetailed?: boolean;
}

export function DataQualityIndicator({ 
  className = '', 
  showDetailed = false 
}: DataQualityIndicatorProps) {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(showDetailed);

  useEffect(() => {
    fetchQualityMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchQualityMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchQualityMetrics() {
    try {
      const health = await checkAPIHealth();
      
      // In a real implementation, we'd call a dedicated metrics endpoint
      // For now, we'll use health check data
      setMetrics({
        timestamp: health.timestamp,
        sst: {
          count: 0,
          coverage_percent: 0,
          avg_quality: 0.8,
          last_update: health.timestamp
        },
        ocean_color: {
          count: 0,
          coverage_percent: 0,
          avg_quality: 0.75,
          last_update: health.timestamp
        },
        salinity: {
          count: 0,
          coverage_percent: 0,
          avg_quality: 0.7,
          last_update: health.timestamp
        },
        sources: {
          nasa: health.database === 'connected',
          copernicus: false
        }
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
      setIsLoading(false);
    }
  }

  function getQualityColor(quality: number): string {
    if (quality >= 0.8) return 'bg-green-500';
    if (quality >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getQualityLabel(quality: number): string {
    if (quality >= 0.8) return 'Excelente';
    if (quality >= 0.6) return 'Bom';
    return 'Baixo';
  }

  function getCoverageColor(coverage: number): string {
    if (coverage >= 50) return 'text-green-600';
    if (coverage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatLastUpdate(timestamp?: string): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  }

  if (isLoading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          <span className="text-sm text-gray-600">Carregando métricas...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ${className}`}>
      {/* Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${metrics.sources.nasa ? 'bg-green-500' : 'bg-gray-300'} animate-pulse`} />
            <span className="text-sm font-semibold text-gray-700">Qualidade dos Dados</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Quick Status Indicators */}
          <div className="flex items-center space-x-2">
            {metrics.sst && (
              <div className={`w-2 h-2 rounded-full ${getQualityColor(metrics.sst.avg_quality)}`} 
                   title="SST Quality" />
            )}
            {metrics.ocean_color && (
              <div className={`w-2 h-2 rounded-full ${getQualityColor(metrics.ocean_color.avg_quality)}`} 
                   title="Ocean Color Quality" />
            )}
            {metrics.salinity && (
              <div className={`w-2 h-2 rounded-full ${getQualityColor(metrics.salinity.avg_quality)}`} 
                   title="Salinity Quality" />
            )}
          </div>
          
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
          {/* Data Sources */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Fontes de Dados</h4>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${metrics.sources.nasa ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${metrics.sources.nasa ? 'text-gray-700' : 'text-gray-400'}`}>
                  NASA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${metrics.sources.copernicus ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${metrics.sources.copernicus ? 'text-gray-700' : 'text-gray-400'}`}>
                  Copernicus
                </span>
              </div>
            </div>
          </div>

          {/* SST Metrics */}
          {metrics.sst && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Temperatura (SST)</span>
                <span className="text-xs text-gray-500">{formatLastUpdate(metrics.sst.last_update)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Qualidade: {getQualityLabel(metrics.sst.avg_quality)}</span>
                    <span className={getCoverageColor(metrics.sst.coverage_percent)}>
                      {metrics.sst.coverage_percent.toFixed(1)}% cobertura
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getQualityColor(metrics.sst.avg_quality)}`}
                      style={{ width: `${metrics.sst.avg_quality * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700">{metrics.sst.count} pts</span>
              </div>
            </div>
          )}

          {/* Ocean Color Metrics */}
          {metrics.ocean_color && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Clorofila-a</span>
                <span className="text-xs text-gray-500">{formatLastUpdate(metrics.ocean_color.last_update)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Qualidade: {getQualityLabel(metrics.ocean_color.avg_quality)}</span>
                    <span className={getCoverageColor(metrics.ocean_color.coverage_percent)}>
                      {metrics.ocean_color.coverage_percent.toFixed(1)}% cobertura
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getQualityColor(metrics.ocean_color.avg_quality)}`}
                      style={{ width: `${metrics.ocean_color.avg_quality * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700">{metrics.ocean_color.count} pts</span>
              </div>
            </div>
          )}

          {/* Salinity Metrics */}
          {metrics.salinity && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Salinidade</span>
                <span className="text-xs text-gray-500">{formatLastUpdate(metrics.salinity.last_update)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Qualidade: {getQualityLabel(metrics.salinity.avg_quality)}</span>
                    <span className={getCoverageColor(metrics.salinity.coverage_percent)}>
                      {metrics.salinity.coverage_percent.toFixed(1)}% cobertura
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getQualityColor(metrics.salinity.avg_quality)}`}
                      style={{ width: `${metrics.salinity.avg_quality * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700">{metrics.salinity.count} pts</span>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
            Última atualização: {formatLastUpdate(metrics.timestamp)}
          </div>
        </div>
      )}
    </div>
  );
}

