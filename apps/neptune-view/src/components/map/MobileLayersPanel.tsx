'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Thermometer,
  Droplets,
  Brain,
  Waves,
  Palette,
  Lightbulb,
  X,
  Ship,
  CloudRain,
  Wind,
  Map as MapIcon
} from 'lucide-react';

interface MobileLayersPanelProps {
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;
  theme: 'light' | 'dark';
}

const layers = [
  { id: 'vessels', label: 'Embarcações', icon: Ship, description: 'Rastreamento AIS' },
  { id: 'temperature', label: 'Temp SST', icon: Thermometer, description: 'Temperatura superficial' },
  { id: 'chloropleth', label: 'Clorofila', icon: Droplets, description: 'Concentração de clorofila-a' },
  { id: 'salinity', label: 'Salinidade', icon: Waves, description: 'Salinidade da água' },
  { id: 'ml-predictions', label: 'Previsões IA', icon: Brain, description: 'ML Hotspots de pesca' },
  // NASA Earth Data Layers
  { id: 'nasa-ocean-color', label: 'NASA Cor', icon: Palette, description: 'Cor do oceano NASA' },
  { id: 'nasa-sst', label: 'NASA SST', icon: Thermometer, description: 'Temperatura NASA' },
  { id: 'nasa-vessel-lights', label: 'NASA Luzes', icon: Lightbulb, description: 'Detecção de luzes VIIRS' },
  // Weather Layers
  { id: 'weather', label: 'Meteorologia', icon: CloudRain, description: 'Condições meteorológicas' },
  { id: 'weather-wind', label: 'Vetores Vento', icon: Wind, description: 'Direção e velocidade do vento' },
  // Boundaries
  { id: 'boundaries', label: 'Fronteiras ZEE', icon: MapIcon, description: 'Limites da ZEE de Angola' }
];

export function MobileLayersPanel({ activeLayers, toggleLayer, theme }: MobileLayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle swipe to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      setTranslateY(diff);
    }
  }, [isDragging, startY]);

  const handleTouchEnd = useCallback(() => {
    if (translateY > 100) {
      setIsOpen(false);
    }
    setIsDragging(false);
    setTranslateY(0);
  }, [translateY]);

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

  const panelTransform = isOpen 
    ? `translateY(${translateY}px)` 
    : 'translateY(100%)';

  return (
    <>
      {/* Floating Action Button - Always Visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 left-4 z-[502] ${bgClass} rounded-full p-3.5 shadow-lg
          border backdrop-blur-md transition-all duration-200 active:scale-95 touch-manipulation
          ${isOpen ? 'scale-110 shadow-xl' : 'scale-100'}
        `}
        aria-label="Toggle Layers"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <div className="relative">
          {isOpen ? (
            <X className={`w-6 h-6 ${textClass}`} />
          ) : (
            <Layers className={`w-6 h-6 ${textClass}`} />
          )}
          {!isOpen && activeLayerCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
              {activeLayerCount}
            </span>
          )}
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[500] transition-opacity"
          onClick={() => setIsOpen(false)}
          style={{ opacity: 1 - (translateY / 300) }}
        />
      )}

      {/* Slide-up Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[501] transition-transform duration-300 ease-out`}
        style={{ transform: panelTransform }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`${bgClass} backdrop-blur-lg border-t rounded-t-3xl shadow-2xl`}>
          {/* Drag Handle */}
          <div className="w-full pt-3 pb-1 flex justify-center">
            <div className={`w-12 h-1.5 rounded-full ${theme === 'light' ? 'bg-gray-300' : 'bg-slate-600'}`} />
          </div>

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
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-800'
              }`}
              aria-label="Close"
            >
              <X className={`w-5 h-5 ${secondaryTextClass}`} />
            </button>
          </div>

          {/* Scrollable Layer List */}
          <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
            <div className="px-4 py-3 space-y-1">
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
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                  }`}
                >
                  {activeLayerCount === layers.length ? 'Limpar' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Layer Items - Optimized for Touch */}
              <div className="space-y-2">
                {layers.map(layer => {
                  const Icon = layer.icon;
                  const isActive = activeLayers.includes(layer.id);

                  return (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                        isActive
                          ? theme === 'light'
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-blue-900/30 border-blue-700'
                          : theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-slate-800/50 border-slate-700'
                      } border touch-manipulation`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isActive
                            ? theme === 'light' 
                              ? 'bg-blue-100' 
                              : 'bg-blue-800/50'
                            : theme === 'light'
                              ? 'bg-gray-100'
                              : 'bg-slate-700/50'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isActive
                              ? theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                              : secondaryTextClass
                          }`} />
                        </div>
                        <div className="text-left">
                          <span className={`block font-medium text-sm ${
                            isActive
                              ? theme === 'light' ? 'text-blue-700' : 'text-blue-300'
                              : textClass
                          }`}>
                            {layer.label}
                          </span>
                          <span className={`text-xs ${secondaryTextClass}`}>
                            {layer.description}
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isActive
                          ? theme === 'light'
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-blue-400 border-blue-400'
                          : theme === 'light'
                            ? 'bg-white border-gray-300'
                            : 'bg-slate-700 border-slate-600'
                      }`}>
                        {isActive && (
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Safe Area for iOS */}
          <div className="h-6 sm:h-8" />
        </div>
      </div>
    </>
  );
}
