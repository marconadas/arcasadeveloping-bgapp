/**
 * Performance Monitor Component
 *
 * Displays real-time performance metrics for map rendering
 * and data layer optimization in development mode.
 */

'use client';

import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapPerformance, getPerformanceRecommendations, type PerformanceMetrics } from '@/utils/mapPerformance';
import { Activity, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface PerformanceMonitorProps {
  dataPointCounts: {
    temperature?: number;
    chlorophyll?: number;
    salinity?: number;
    vessels?: number;
    mlPredictions?: number;
    total: number;
    viewport: number;
  };
  visible?: boolean;
}

export function PerformanceMonitor({ dataPointCounts, visible = true }: PerformanceMonitorProps) {
  const map = useMap();
  const { fps, renderTime } = useMapPerformance({ current: map });
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Calculate cache hit rate from localStorage stats (if implemented)
  useEffect(() => {
    const cacheStats = localStorage.getItem('mapCacheStats');
    if (cacheStats) {
      const stats = JSON.parse(cacheStats);
      const rate = stats.hits / (stats.hits + stats.misses) || 0;
      setCacheHitRate(rate);
    }
  }, []);

  // Generate performance recommendations
  useEffect(() => {
    const metrics: PerformanceMetrics = {
      fps,
      renderTime,
      dataPoints: dataPointCounts.total,
      viewportDataPoints: dataPointCounts.viewport,
      cacheHitRate
    };

    const newRecommendations = getPerformanceRecommendations(metrics);
    setRecommendations(newRecommendations);
  }, [fps, renderTime, dataPointCounts, cacheHitRate]);

  if (!visible || process.env.NODE_ENV !== 'development') return null;

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (fps >= 50 && renderTime < 100) return { color: 'text-green-400', icon: CheckCircle, label: 'Excellent' };
    if (fps >= 30 && renderTime < 300) return { color: 'text-yellow-400', icon: Activity, label: 'Good' };
    return { color: 'text-red-400', icon: AlertTriangle, label: 'Poor' };
  };

  const status = getPerformanceStatus();

  if (isMinimized) {
    return (
      <div
        className="fixed top-20 right-4 z-[1002] bg-black/90 text-white p-2 rounded-lg cursor-pointer shadow-lg backdrop-blur-sm"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <status.icon className={`w-4 h-4 ${status.color}`} />
          <span className="text-xs font-mono">{fps} FPS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-[1002] bg-black/90 text-white rounded-lg shadow-lg backdrop-blur-sm max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Performance Monitor</h3>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics */}
      <div className="p-3 space-y-3">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Status</span>
          <div className="flex items-center gap-2">
            <status.icon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* FPS and Render Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Frame Rate</div>
            <div className={`text-lg font-mono ${fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              {fps} FPS
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Render Time</div>
            <div className={`text-lg font-mono ${renderTime > 500 ? 'text-red-400' : renderTime > 200 ? 'text-yellow-400' : 'text-green-400'}`}>
              {renderTime}ms
            </div>
          </div>
        </div>

        {/* Data Points */}
        <div>
          <div className="text-xs text-gray-400 mb-2">Data Points</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Total Loaded:</span>
              <span className="font-mono">{dataPointCounts.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>In Viewport:</span>
              <span className="font-mono text-blue-400">{dataPointCounts.viewport.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Reduction:</span>
              <span className="font-mono text-green-400">
                {dataPointCounts.total > 0
                  ? `${Math.round((1 - dataPointCounts.viewport / dataPointCounts.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Layer Breakdown */}
        {(dataPointCounts.temperature || dataPointCounts.chlorophyll || dataPointCounts.salinity) && (
          <div>
            <div className="text-xs text-gray-400 mb-2">Layer Breakdown</div>
            <div className="space-y-1">
              {dataPointCounts.temperature !== undefined && (
                <div className="flex justify-between text-xs">
                  <span>Temperature:</span>
                  <span className="font-mono">{dataPointCounts.temperature}</span>
                </div>
              )}
              {dataPointCounts.chlorophyll !== undefined && (
                <div className="flex justify-between text-xs">
                  <span>Chlorophyll:</span>
                  <span className="font-mono">{dataPointCounts.chlorophyll}</span>
                </div>
              )}
              {dataPointCounts.salinity !== undefined && (
                <div className="flex justify-between text-xs">
                  <span>Salinity:</span>
                  <span className="font-mono">{dataPointCounts.salinity}</span>
                </div>
              )}
              {dataPointCounts.vessels !== undefined && (
                <div className="flex justify-between text-xs">
                  <span>Vessels:</span>
                  <span className="font-mono">{dataPointCounts.vessels}</span>
                </div>
              )}
              {dataPointCounts.mlPredictions !== undefined && (
                <div className="flex justify-between text-xs">
                  <span>ML Predictions:</span>
                  <span className="font-mono">{dataPointCounts.mlPredictions}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cache Performance */}
        {cacheHitRate > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-1">Cache Hit Rate</div>
            <div className="w-full bg-gray-700 rounded h-2">
              <div
                className={`h-2 rounded transition-all ${
                  cacheHitRate > 0.7 ? 'bg-green-500' : cacheHitRate > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${cacheHitRate * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">{Math.round(cacheHitRate * 100)}% hits</div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <div className="text-xs text-gray-400 mb-2">Optimization Tips</div>
            <div className="space-y-1">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}