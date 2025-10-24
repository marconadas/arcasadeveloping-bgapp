'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  Thermometer,
  Droplets,
  Brain,
  Waves,
  Palette,
  Lightbulb,
  X,
  Menu,
  CloudRain,
  Wind
} from 'lucide-react';

interface MobileLayersPanelProps {
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;
  theme: 'light' | 'dark';
}

const layers = [
  { id: 'temperature', label: 'Temp SST', icon: Thermometer },
  { id: 'chloropleth', label: 'Clorofila', icon: Droplets },
  { id: 'salinity', label: 'Salinidade', icon: Waves },
  { id: 'ml-predictions', label: 'ML', icon: Brain },
  // NASA Earth Data Layers (shortened labels for mobile)
  { id: 'nasa-ocean-color', label: 'NASA Cor', icon: Palette },
  { id: 'nasa-sst', label: 'NASA SST', icon: Thermometer },
  { id: 'nasa-vessel-lights', label: 'NASA Luzes', icon: Lightbulb },
  // Weather Layers (Open-Meteo)
  { id: 'weather', label: 'Meteorologia', icon: CloudRain },
  { id: 'weather-wind', label: 'Vetores Vento', icon: Wind }
];

export function MobileLayersPanel({ activeLayers, toggleLayer, theme }: MobileLayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const bgClass = theme === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-slate-900 border-slate-700';

  const textClass = theme === 'light'
    ? 'text-gray-900'
    : 'text-white';

  const secondaryTextClass = theme === 'light'
    ? 'text-gray-600'
    : 'text-gray-300';

  const activeLayerCount = activeLayers.length;

  return (
    <>
      {/* Floating Action Button - Always Visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 left-4 z-[502] ${bgClass} rounded-full p-3 shadow-lg
          border backdrop-blur-sm transition-all duration-200 ${
          isOpen ? 'scale-110' : 'scale-100'
        }`}
        aria-label="Toggle Layers"
      >
        <div className="relative">
          {isOpen ? (
            <X className={`w-6 h-6 ${textClass}`} />
          ) : (
            <Layers className={`w-6 h-6 ${textClass}`} />
          )}
          {!isOpen && activeLayerCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeLayerCount}
            </span>
          )}
        </div>
      </button>

      {/* Slide-up Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[501] transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className={`${bgClass} backdrop-blur-sm border-t rounded-t-2xl shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <Layers className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
              <h3 className={`font-semibold ${textClass}`}>Camadas do Mapa</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-lg ${
                theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-800'
              }`}
            >
              <X className={`w-5 h-5 ${secondaryTextClass}`} />
            </button>
          </div>

          {/* Scrollable Layer List */}
          <div className="max-h-[50vh] overflow-y-auto">
            <div className="px-4 py-2 space-y-1">
              {/* Quick Toggle All */}
              <div className={`flex justify-between items-center py-2 mb-2 border-b ${
                theme === 'light' ? 'border-gray-100' : 'border-slate-800'
              }`}>
                <span className={`text-xs ${secondaryTextClass}`}>
                  {activeLayerCount} de {layers.length} ativos
                </span>
                <button
                  onClick={() => {
                    if (activeLayerCount === layers.length) {
                      // Clear all
                      layers.forEach(layer => {
                        if (activeLayers.includes(layer.id)) {
                          toggleLayer(layer.id);
                        }
                      });
                    } else {
                      // Select all
                      layers.forEach(layer => {
                        if (!activeLayers.includes(layer.id)) {
                          toggleLayer(layer.id);
                        }
                      });
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    theme === 'light'
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                  }`}
                >
                  {activeLayerCount === layers.length ? 'Limpar' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Layer Items - Optimized for Touch */}
              {layers.map(layer => {
                const Icon = layer.icon;
                const isActive = activeLayers.includes(layer.id);

                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      isActive
                        ? theme === 'light'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-blue-900/30 border-blue-700'
                        : theme === 'light'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-slate-800/50 border-slate-700'
                    } border`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        isActive
                          ? theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                          : secondaryTextClass
                      }`} />
                      <span className={`font-medium text-sm ${
                        isActive
                          ? theme === 'light' ? 'text-blue-700' : 'text-blue-300'
                          : textClass
                      }`}>
                        {layer.label}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive
                        ? theme === 'light'
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-blue-400 border-blue-400'
                        : theme === 'light'
                          ? 'bg-white border-gray-300'
                          : 'bg-slate-700 border-slate-600'
                    }`}>
                      {isActive && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Safe Area for iOS */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </>
  );
}