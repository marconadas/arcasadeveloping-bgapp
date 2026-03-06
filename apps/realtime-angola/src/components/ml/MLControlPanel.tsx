'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  ChevronRight,
  Settings,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useMLModelStore, selectActiveModels } from '@/stores/mlModelStore';
import { motion, AnimatePresence } from 'framer-motion';

interface MLControlPanelProps {
  className?: string;
  onToggleDashboard?: () => void;
  isMobile?: boolean;
}

export function MLControlPanel({
  className = '',
  onToggleDashboard,
  isMobile = false
}: MLControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const {
    models,
    activeModels,
    minConfidence,
    metrics,
    alerts,
    unreadAlertCount,
    isLoadingPredictions,
    predictionsError,
    initializeModels,
    toggleModel,
    setMinConfidence,
    fetchPredictions,
    invalidateCache
  } = useMLModelStore();

  const activeModelsList = selectActiveModels(useMLModelStore.getState());

  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache();
    await fetchPredictions();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 95) return 'bg-green-100 text-green-700';
    if (accuracy >= 90) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b dark:border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Controles de IA
            </h3>
            {!isExpanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeModels.length} modelos ativos
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadAlertCount > 0 && (
            <div className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
              {unreadAlertCount} alertas
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Status Bar */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isLoadingPredictions ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Carregando predições...
                        </span>
                      </>
                    ) : predictionsError ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          Erro ao carregar
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {metrics.totalPredictions} predições ativas
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoadingPredictions}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar predições"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Confiança Média</p>
                  <p className={`text-lg font-semibold ${getConfidenceColor(metrics.averageConfidence)}`}>
                    {(metrics.averageConfidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alta Confiança</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {metrics.highConfidenceCount}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Modelos Ativos</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {activeModels.length}/{models.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filtro de Confiança Mínima
                </label>
                <span className={`text-sm font-semibold ${getConfidenceColor(minConfidence)}`}>
                  {(minConfidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minConfidence * 100}
                  onChange={(e) => setMinConfidence(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div
                  className="absolute h-2 bg-purple-500 rounded-lg pointer-events-none"
                  style={{ width: `${minConfidence * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Model List */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {models.map((model) => {
                const isActive = activeModels.includes(model.id);
                return (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => toggleModel(model.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-1">{model.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${
                              isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {model.name}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              v{model.version}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {model.description}
                          </p>
                          {showDetails && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getAccuracyBadgeColor(model.accuracy)}`}>
                                {model.accuracy}% precisão
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Treinado: {new Date(model.lastTrained).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isActive
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isActive && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <Info className="w-4 h-4" />
                {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
              </button>
              {onToggleDashboard && (
                <button
                  onClick={onToggleDashboard}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard ML
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #9333ea;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
          z-index: 10;
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #9333ea;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}