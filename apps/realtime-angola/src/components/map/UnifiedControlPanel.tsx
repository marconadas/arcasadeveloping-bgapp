'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Brain,
  Activity,
  Settings,
  X,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import { LayersPanel } from './LayersPanel';
import { MLModelSelector } from './MLModelSelector';
import { MLStatisticsPanel } from './MLStatisticsPanel';

interface UnifiedControlPanelProps {
  // Layers Panel props
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;

  // ML Model Selector props
  onModelToggle: (modelType: string) => void;
  onConfidenceFilter: (value: number) => void;

  // ML Statistics Panel props
  mlData: any[];
  showMLStats?: boolean;

  // Theme
  theme: 'light' | 'dark';
}

type PanelSection = 'layers' | 'ml' | 'stats' | 'settings';

export function UnifiedControlPanel({
  activeLayers,
  toggleLayer,
  onModelToggle,
  onConfidenceFilter,
  mlData,
  showMLStats = true,
  theme
}: UnifiedControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSection, setActiveSection] = useState<PanelSection>('layers');

  const styles = {
    panel: theme === 'light'
      ? 'bg-white/95 backdrop-blur-xl border-gray-200'
      : 'bg-gray-900/95 backdrop-blur-xl border-gray-700',
    header: theme === 'light'
      ? 'bg-gray-50 border-b border-gray-200'
      : 'bg-gray-800 border-b border-gray-700',
    tab: theme === 'light'
      ? 'hover:bg-gray-100 text-gray-700'
      : 'hover:bg-gray-800 text-gray-300',
    activeTab: theme === 'light'
      ? 'bg-blue-100 text-blue-700 border-blue-400'
      : 'bg-blue-900/50 text-blue-300 border-blue-500',
    text: theme === 'light' ? 'text-gray-900' : 'text-white',
    secondaryText: theme === 'light' ? 'text-gray-600' : 'text-gray-400',
  };

  if (isMinimized) {
    return (
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-[500]">
        <button
          onClick={() => setIsMinimized(false)}
          className={`p-3 rounded-lg ${styles.panel} border shadow-lg hover:shadow-xl transition-all`}
          title="Expandir Painel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute left-4 top-20 bottom-20 z-[500] transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-16'
    }`}>
      <div className={`h-full ${styles.panel} border rounded-xl shadow-2xl flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`${styles.header} px-4 py-3 flex items-center justify-between`}>
          {isExpanded ? (
            <>
              <h2 className={`font-semibold ${styles.text}`}>Controles</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                  title="Minimizar"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                  title="Recolher"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full flex justify-center py-1"
              title="Expandir"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <>
            {/* Section Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveSection('layers')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'layers' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Camadas"
              >
                <Layers className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('ml')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'ml' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Modelos IA"
              >
                <Brain className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('stats')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'stats' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Estatísticas"
              >
                <Activity className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'settings' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Configurações"
              >
                <Settings className="w-4 h-4 mx-auto" />
              </button>
            </div>

            {/* Section Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeSection === 'layers' && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-3`}>Camadas do Mapa</h3>
                  <LayersContent
                    activeLayers={activeLayers}
                    toggleLayer={toggleLayer}
                    theme={theme}
                  />
                </div>
              )}

              {activeSection === 'ml' && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-3`}>Modelos de IA</h3>
                  <MLContent
                    onModelToggle={onModelToggle}
                    onConfidenceFilter={onConfidenceFilter}
                    theme={theme}
                  />
                </div>
              )}

              {activeSection === 'stats' && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-3`}>Estatísticas</h3>
                  {mlData.length > 0 ? (
                    <StatsContent mlData={mlData} theme={theme} />
                  ) : (
                    <p className={`text-sm ${styles.secondaryText}`}>Sem dados disponíveis</p>
                  )}
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-3`}>Configurações</h3>
                  <SettingsContent theme={theme} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Extracted content components for cleaner code
function LayersContent({ activeLayers, toggleLayer, theme }: any) {
  const layers = [
    { id: 'vessels', label: 'Embarcações', icon: '🚢' },
    { id: 'temperature', label: 'Temperatura', icon: '🌡️' },
    { id: 'chloropleth', label: 'Clorofila', icon: '🌿' },
    { id: 'salinity', label: 'Salinidade', icon: '💧' },
    { id: 'ml-predictions', label: 'Previsões ML', icon: '🤖' },
    { id: 'nasa-vessel-lights', label: 'Luzes (VIIRS)', icon: '💡' },
    { id: 'boundaries', label: 'Fronteiras EEZ', icon: '🗺️' },
    { id: 'weather', label: 'Meteorologia', icon: '🌧️' },
    { id: 'weather-wind', label: 'Vetores de Vento', icon: '💨' }
  ];

  return (
    <div className="space-y-2">
      {layers.map(layer => (
        <label key={layer.id} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={activeLayers.includes(layer.id)}
            onChange={() => toggleLayer(layer.id)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-lg">{layer.icon}</span>
          <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} group-hover:text-blue-500`}>
            {layer.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function MLContent({ onModelToggle, onConfidenceFilter, theme }: any) {
  const [confidence, setConfidence] = useState(70);
  const models = [
    { id: 'biodiversityHotspots', label: 'Hotspots de Biodiversidade' },
    { id: 'speciesPresence', label: 'Presença de Espécies' },
    { id: 'habitatSuitability', label: 'Adequação de Habitat' },
    { id: 'conservationPriority', label: 'Prioridade de Conservação' },
    { id: 'fishingZones', label: 'Zonas de Pesca' },
    { id: 'monitoringPoints', label: 'Pontos de Monitoramento' },
    { id: 'riskAssessment', label: 'Avaliação de Risco' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} block mb-2`}>
          Confiança Mínima: {confidence}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setConfidence(value);
            onConfidenceFilter(value / 100);
          }}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        {models.map(model => (
          <label key={model.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              onChange={() => onModelToggle(model.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className={`text-xs ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {model.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function StatsContent({ mlData, theme }: any) {
  const stats = {
    total: mlData.length,
    avgConfidence: mlData.reduce((acc, d) => acc + (d.confidence || 0), 0) / mlData.length || 0,
    highConfidence: mlData.filter((d: any) => (d.confidence || 0) > 0.8).length
  };

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Total de Previsões</div>
        <div className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stats.total}</div>
      </div>
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Confiança Média</div>
        <div className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          {(stats.avgConfidence * 100).toFixed(1)}%
        </div>
      </div>
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Alta Confiança</div>
        <div className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          {stats.highConfidence}
        </div>
      </div>
    </div>
  );
}

function SettingsContent({ theme }: any) {
  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            Auto-refresh
          </span>
          <input type="checkbox" defaultChecked className="w-4 h-4" />
        </label>
      </div>
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            Animações
          </span>
          <input type="checkbox" defaultChecked className="w-4 h-4" />
        </label>
      </div>
      <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            Notificações
          </span>
          <input type="checkbox" className="w-4 h-4" />
        </label>
      </div>
    </div>
  );
}