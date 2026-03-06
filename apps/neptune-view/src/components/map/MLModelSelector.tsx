'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain, Info } from 'lucide-react';
import { useMLModelStore, selectActiveModels } from '@/stores/mlModelStore';

interface MLModelSelectorProps {
  onModelToggle?: (modelType: string, active: boolean) => void;
  onConfidenceFilter?: (minConfidence: number) => void;
}

export function MLModelSelector({
  onModelToggle,
  onConfidenceFilter
}: MLModelSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  // Get data from Zustand store
  const {
    models,
    activeModels,
    minConfidence,
    initializeModels,
    toggleModel,
    setMinConfidence: storeSetMinConfidence
  } = useMLModelStore();

  const activeModelsList = selectActiveModels(useMLModelStore.getState());

  // Initialize models on mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  const handleModelToggle = (modelId: string) => {
    // Toggle in store
    toggleModel(modelId);

    // Call legacy callback if provided
    if (onModelToggle) {
      const model = models.find(m => m.id === modelId);
      if (model) {
        const isNowActive = activeModels.includes(modelId) ? false : true;
        onModelToggle(model.type, isNowActive);
      }
    }
  };

  const handleConfidenceChange = (value: number) => {
    // Update store
    storeSetMinConfidence(value);

    // Call legacy callback if provided
    if (onConfidenceFilter) {
      onConfidenceFilter(value);
    }
  };

  const activeModelsCount = activeModels.length;

  return (
    <div className="bg-gray-800 bg-opacity-95 rounded-lg shadow-xl p-4 w-96">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Modelos de IA</h3>
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {activeModelsCount}/{models.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Confidence Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Confiança Mínima</label>
              <span className="text-sm text-blue-400 font-mono">
                {(minConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence * 100}
              onChange={(e) => handleConfidenceChange(Number(e.target.value) / 100)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${minConfidence * 100}%, #4b5563 ${minConfidence * 100}%, #4b5563 100%)`
              }}
            />
          </div>

          {/* Models List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {models.map(model => {
              const isActive = activeModels.includes(model.id);
              return (
                <div
                  key={model.id}
                  className={`border rounded-lg p-3 transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleModelToggle(model.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-2xl mt-0.5">{model.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{model.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {model.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  model.accuracy >= 90 ? 'bg-green-500' :
                                  model.accuracy >= 80 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${model.accuracy}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {model.accuracy}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            v{model.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="flex items-start gap-2 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
            <Info className="w-4 h-4 text-gray-400 mt-0.5" />
            <p className="text-xs text-gray-400">
              Os modelos de IA analisam dados oceanográficos em tempo real para fornecer
              insights sobre biodiversidade marinha, zonas de pesca e áreas de conservação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}