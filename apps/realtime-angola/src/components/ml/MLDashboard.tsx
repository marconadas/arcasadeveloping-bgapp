'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
  X,
  Settings,
  Map,
  Layers,
  GitBranch,
  Database
} from 'lucide-react';
import { useMLModelStore, selectActiveModels, selectFilteredPredictions } from '@/stores/mlModelStore';
import { motion, AnimatePresence } from 'framer-motion';

interface MLDashboardProps {
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

export default function MLDashboard({
  onClose,
  isModal = false,
  className = ''
}: MLDashboardProps) {
  const [selectedMetricPeriod, setSelectedMetricPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showModelComparison, setShowModelComparison] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);

  const {
    models,
    activeModels,
    predictions,
    filteredPredictions,
    minConfidence,
    metrics,
    alerts,
    isLoadingPredictions,
    predictionsError,
    fetchPredictions,
    invalidateCache,
    dismissAlert
  } = useMLModelStore();

  // Calculate advanced metrics
  const advancedMetrics = useMemo(() => {
    const now = Date.now();
    const periodMs = selectedMetricPeriod === '24h' ? 86400000
                   : selectedMetricPeriod === '7d' ? 604800000
                   : 2592000000;

    const recentPredictions = predictions.filter(
      p => new Date(p.timestamp).getTime() > now - periodMs
    );

    // Group by model
    const modelMetrics = models.map(model => {
      const modelPreds = recentPredictions.filter(p => p.modelId === model.id);
      const avgConfidence = modelPreds.length > 0
        ? modelPreds.reduce((acc, p) => acc + p.confidence, 0) / modelPreds.length
        : 0;

      const highConfidenceCount = modelPreds.filter(p => p.confidence >= 0.8).length;
      const mediumConfidenceCount = modelPreds.filter(p => p.confidence >= 0.5 && p.confidence < 0.8).length;
      const lowConfidenceCount = modelPreds.filter(p => p.confidence < 0.5).length;

      // Group by prediction type
      const typeDistribution = modelPreds.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        model,
        totalPredictions: modelPreds.length,
        avgConfidence,
        highConfidenceCount,
        mediumConfidenceCount,
        lowConfidenceCount,
        typeDistribution,
        isActive: activeModels.includes(model.id)
      };
    });

    // Geographic distribution
    const geoDistribution = recentPredictions.reduce((acc, p) => {
      const latBin = Math.floor(p.latitude / 0.5) * 0.5;
      const lonBin = Math.floor(p.longitude / 0.5) * 0.5;
      const key = `${latBin},${lonBin}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Temporal distribution (hourly for 24h, daily for 7d/30d)
    const temporalBinSize = selectedMetricPeriod === '24h' ? 3600000 : 86400000;
    const temporalDistribution = recentPredictions.reduce((acc, p) => {
      const timestamp = new Date(p.timestamp).getTime();
      const bin = Math.floor(timestamp / temporalBinSize) * temporalBinSize;
      acc[bin] = (acc[bin] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Performance over time
    const performanceTrend = Object.entries(temporalDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([timestamp, count]) => {
        const binPredictions = recentPredictions.filter(p => {
          const pTime = new Date(p.timestamp).getTime();
          return pTime >= Number(timestamp) && pTime < Number(timestamp) + temporalBinSize;
        });
        const avgConf = binPredictions.length > 0
          ? binPredictions.reduce((acc, p) => acc + p.confidence, 0) / binPredictions.length
          : 0;
        return {
          timestamp: Number(timestamp),
          count,
          avgConfidence: avgConf
        };
      });

    return {
      modelMetrics,
      geoDistribution,
      temporalDistribution,
      performanceTrend,
      totalRecentPredictions: recentPredictions.length,
      periodLabel: selectedMetricPeriod === '24h' ? 'últimas 24 horas'
                 : selectedMetricPeriod === '7d' ? 'últimos 7 dias'
                 : 'últimos 30 dias'
    };
  }, [predictions, models, activeModels, selectedMetricPeriod]);

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      period: selectedMetricPeriod,
      metrics: advancedMetrics,
      models: models.map(m => ({
        ...m,
        isActive: activeModels.includes(m.id)
      })),
      predictions: filteredPredictions.slice(0, 1000) // Limit for file size
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-dashboard-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    invalidateCache();
    await fetchPredictions();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceBarColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
    : className;

  const contentClasses = isModal
    ? 'bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col'
    : 'bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col ' + className;

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard de Machine Learning
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Análise detalhada das predições e modelos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoadingPredictions}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${
                isLoadingPredictions ? 'animate-spin' : ''
              }`} />
            </button>
            <button
              onClick={handleExportData}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Exportar dados"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Período de Análise:
              </span>
            </div>
            <div className="flex gap-2">
              {(['24h', '7d', '30d'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedMetricPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedMetricPeriod === period
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {period === '24h' ? '24 Horas' : period === '7d' ? '7 Dias' : '30 Dias'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">
                  {advancedMetrics.totalRecentPredictions}
                </span>
              </div>
              <p className="text-sm opacity-90">Predições Totais</p>
              <p className="text-xs opacity-70">{advancedMetrics.periodLabel}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">
                  {(metrics.averageConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm opacity-90">Confiança Média</p>
              <p className="text-xs opacity-70">Todos os modelos</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">
                  {activeModels.length}/{models.length}
                </span>
              </div>
              <p className="text-sm opacity-90">Modelos Ativos</p>
              <p className="text-xs opacity-70">Em execução</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 opacity-80" />
                <span className="text-2xl font-bold">
                  {metrics.highConfidenceCount}
                </span>
              </div>
              <p className="text-sm opacity-90">Alta Confiança</p>
              <p className="text-xs opacity-70">≥ 80% confiança</p>
            </motion.div>
          </div>

          {/* Model Performance Comparison */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Performance dos Modelos
              </h3>
              <button
                onClick={() => setShowModelComparison(!showModelComparison)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                {showModelComparison ? 'Ocultar' : 'Mostrar'} Comparação
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  showModelComparison ? 'rotate-90' : ''
                }`} />
              </button>
            </div>

            <div className="space-y-3">
              {advancedMetrics.modelMetrics.map(metric => (
                <div
                  key={metric.model.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    metric.isActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  } ${
                    selectedModel === metric.model.id
                      ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800'
                      : ''
                  }`}
                  onClick={() => setSelectedModel(
                    selectedModel === metric.model.id ? null : metric.model.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">{metric.model.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {metric.model.name}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            v{metric.model.version}
                          </span>
                          {metric.isActive && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                              Ativo
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Predições</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {metric.totalPredictions}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Confiança</p>
                            <p className={`text-lg font-semibold ${getConfidenceColor(metric.avgConfidence)}`}>
                              {(metric.avgConfidence * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Precisão</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {metric.model.accuracy}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Alta Conf.</p>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {metric.highConfidenceCount}
                            </p>
                          </div>
                        </div>

                        {/* Confidence Distribution Bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${(metric.highConfidenceCount / Math.max(metric.totalPredictions, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-yellow-500 transition-all"
                            style={{ width: `${(metric.mediumConfidenceCount / Math.max(metric.totalPredictions, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-red-500 transition-all"
                            style={{ width: `${(metric.lowConfidenceCount / Math.max(metric.totalPredictions, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedModel === metric.model.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t dark:border-gray-700"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Distribuição por Tipo
                            </h5>
                            <div className="space-y-1">
                              {Object.entries(metric.typeDistribution).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {type}
                                  </span>
                                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                                    {count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Informações do Modelo
                            </h5>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Última Atualização
                                </span>
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {new Date(metric.model.lastTrained).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Dataset de Treino
                                </span>
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {metric.model.trainingDataSize} amostras
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Trend Chart */}
          {showPerformanceDetails && advancedMetrics.performanceTrend.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Tendência de Performance
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                <div className="h-48 flex items-end gap-1">
                  {advancedMetrics.performanceTrend.map((point, index) => {
                    const maxCount = Math.max(...advancedMetrics.performanceTrend.map(p => p.count));
                    const height = (point.count / maxCount) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end"
                        title={`${new Date(point.timestamp).toLocaleString('pt-BR')}: ${point.count} predições, ${(point.avgConfidence * 100).toFixed(1)}% confiança`}
                      >
                        <div
                          className={`w-full ${getConfidenceBarColor(point.avgConfidence)} rounded-t transition-all hover:opacity-80`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {new Date(advancedMetrics.performanceTrend[0]?.timestamp || Date.now()).toLocaleDateString('pt-BR')}
                  </span>
                  <span>
                    {new Date(advancedMetrics.performanceTrend[advancedMetrics.performanceTrend.length - 1]?.timestamp || Date.now()).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Alertas Ativos
              </h3>
              <div className="space-y-2">
                {alerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border flex items-start justify-between ${
                      alert.type === 'error'
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                        : alert.type === 'warning'
                        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === 'error' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(alert.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geographic Distribution Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Distribuição Geográfica
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Células Ativas</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Object.keys(advancedMetrics.geoDistribution).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Área Coberta</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ~{(Object.keys(advancedMetrics.geoDistribution).length * 0.25).toFixed(1)} km²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Densidade Média</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round(advancedMetrics.totalRecentPredictions / Math.max(Object.keys(advancedMetrics.geoDistribution).length, 1))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hotspot Principal</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    Angola EEZ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              {showPerformanceDetails ? 'Ocultar' : 'Mostrar'} Detalhes Avançados
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}