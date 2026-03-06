'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Brain,
  Activity,
  Settings,
  MinusCircle,
  PlusCircle,
  Ship,
  Thermometer,
  Droplets,
  Waves,
  Lightbulb,
  Map as MapIcon,
  CloudRain,
  Wind
} from 'lucide-react';
import { MLControlPanel } from '../ml/MLControlPanel';
import MLDashboard from '../ml/MLDashboard';
import { useMLModelStore } from '@/stores/mlModelStore';

interface UnifiedControlPanelProps {
  // Layers Panel props
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;

  // Theme
  theme: 'light' | 'dark';
}

type PanelSection = 'layers' | 'ml' | 'stats' | 'settings';

const layers = [
  { id: 'vessels', label: 'Embarcações', icon: Ship },
  { id: 'temperature', label: 'Temperatura SST', icon: Thermometer },
  { id: 'chloropleth', label: 'Clorofila', icon: Droplets },
  { id: 'salinity', label: 'Salinidade', icon: Waves },
  { id: 'ml-predictions', label: 'Previsões ML', icon: Brain },
  { id: 'nasa-vessel-lights', label: 'Luzes (VIIRS)', icon: Lightbulb },
  { id: 'boundaries', label: 'Fronteiras EEZ', icon: MapIcon },
  { id: 'weather', label: 'Meteorologia', icon: CloudRain },
  { id: 'weather-wind', label: 'Vetores de Vento', icon: Wind }
];

export function UnifiedControlPanel({
  activeLayers,
  toggleLayer,
  theme
}: UnifiedControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSection, setActiveSection] = useState<PanelSection>('layers');
  const [showMLDashboard, setShowMLDashboard] = useState(false);

  // Get ML store data
  const { filteredPredictions } = useMLModelStore();

  const isDark = theme === 'dark';

  const styles = {
    panel: isDark
      ? 'bg-slate-900/95 backdrop-blur-xl border-slate-700/50'
      : 'bg-white/95 backdrop-blur-xl border-gray-200/50',
    header: isDark
      ? 'bg-slate-800/80 border-b border-slate-700/50'
      : 'bg-gray-50/80 border-b border-gray-200/50',
    tab: isDark
      ? 'hover:bg-slate-800/80 text-slate-400'
      : 'hover:bg-gray-100/80 text-gray-600',
    activeTab: isDark
      ? 'bg-blue-900/40 text-blue-300 border-blue-500'
      : 'bg-blue-50 text-blue-700 border-blue-400',
    text: isDark ? 'text-white' : 'text-gray-900',
    secondaryText: isDark ? 'text-slate-400' : 'text-gray-600',
    mutedText: isDark ? 'text-slate-500' : 'text-gray-500',
    hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100',
  };

  if (isMinimized) {
    return (
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-[500]">
        <button
          onClick={() => setIsMinimized(false)}
          className={`p-3 rounded-xl ${styles.panel} border shadow-lg hover:shadow-xl transition-all ${styles.text}`}
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
      <div className={`h-full ${styles.panel} border rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`${styles.header} px-4 py-3 flex items-center justify-between`}>
          {isExpanded ? (
            <>
              <h2 className={`font-semibold ${styles.text}`}>Controles</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className={`p-1.5 rounded-lg ${styles.hover} transition-colors ${styles.secondaryText}`}
                  title="Minimizar"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className={`p-1.5 rounded-lg ${styles.hover} transition-colors ${styles.secondaryText}`}
                  title="Recolher"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className={`w-full flex justify-center py-1 ${styles.text}`}
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
            <div className={`flex border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200/50'}`}>
              <button
                onClick={() => setActiveSection('layers')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'layers' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Camadas"
              >
                <Layers className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('ml')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'ml' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Modelos IA"
              >
                <Brain className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('stats')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeSection === 'stats' ? styles.activeTab : styles.tab + ' border-transparent'
                }`}
                title="Estatísticas"
              >
                <Activity className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
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
                  <MLControlPanel
                    className="bg-transparent shadow-none"
                    onToggleDashboard={() => setShowMLDashboard(true)}
                    isMobile={false}
                  />
                  <div className={`mt-3 text-xs ${styles.secondaryText}`}>
                    {filteredPredictions.length} previsões ativas
                  </div>
                </div>
              )}

              {activeSection === 'stats' && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-semibold ${styles.text} mb-3`}>Estatísticas</h3>
                  {filteredPredictions.length > 0 ? (
                    <StatsContent mlData={filteredPredictions} theme={theme} />
                  ) : (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'} text-center`}>
                      <p className={`text-sm ${styles.secondaryText}`}>Sem dados disponíveis</p>
                      <p className={`text-xs ${styles.mutedText} mt-1`}>Ative previsões ML para ver estatísticas</p>
                    </div>
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

      {/* ML Dashboard Modal */}
      {showMLDashboard && (
        <MLDashboard
          onClose={() => setShowMLDashboard(false)}
          isModal={true}
          className="fixed inset-0 z-[600]"
        />
      )}
    </div>
  );
}

// Extracted content components for cleaner code
function LayersContent({ activeLayers, toggleLayer, theme }: { activeLayers: string[], toggleLayer: (id: string) => void, theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      {layers.map(layer => {
        const Icon = layer.icon;
        const isActive = activeLayers.includes(layer.id);

        return (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
              isActive
                ? isDark
                  ? 'bg-blue-900/30 border border-blue-700/50'
                  : 'bg-blue-50 border border-blue-200'
                : isDark
                  ? 'hover:bg-slate-800/50 border border-transparent'
                  : 'hover:bg-gray-100 border border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-md ${
              isActive
                ? isDark ? 'bg-blue-800/50' : 'bg-blue-100'
                : isDark ? 'bg-slate-800' : 'bg-gray-100'
            }`}>
              <Icon className={`w-4 h-4 ${
                isActive
                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                  : isDark ? 'text-slate-400' : 'text-gray-500'
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              isActive
                ? isDark ? 'text-blue-300' : 'text-blue-700'
                : isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              {layer.label}
            </span>
            <div className="ml-auto">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                isActive
                  ? isDark
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-blue-500 border-blue-500'
                  : isDark
                    ? 'border-slate-600'
                    : 'border-gray-300'
              }`}>
                {isActive && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatsContent({ mlData, theme }: { mlData: any[], theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  
  const stats = {
    total: mlData.length,
    avgConfidence: mlData.reduce((acc, d) => acc + (d.confidence || 0), 0) / mlData.length || 0,
    highConfidence: mlData.filter((d: any) => (d.confidence || 0) > 0.8).length
  };

  const cardClass = isDark 
    ? 'bg-slate-800/50 border-slate-700/50' 
    : 'bg-gray-50 border-gray-100';

  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-xl border ${cardClass}`}>
        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-1`}>Total de Previsões</div>
        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</div>
      </div>
      <div className={`p-4 rounded-xl border ${cardClass}`}>
        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-1`}>Confiança Média</div>
        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {(stats.avgConfidence * 100).toFixed(1)}%
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${stats.avgConfidence * 100}%` }}
          />
        </div>
      </div>
      <div className={`p-4 rounded-xl border ${cardClass}`}>
        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-1`}>Alta Confiança {'(>'}80%)</div>
        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stats.highConfidence}
        </div>
        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'} mt-1`}>
          {stats.total > 0 ? ((stats.highConfidence / stats.total) * 100).toFixed(1) : 0}% do total
        </div>
      </div>
    </div>
  );
}

function SettingsContent({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  
  const cardClass = isDark 
    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50' 
    : 'bg-gray-50 hover:bg-gray-100 border-gray-100';

  const textClass = isDark ? 'text-slate-300' : 'text-gray-700';

  return (
    <div className="space-y-3">
      <label className={`flex items-center justify-between p-4 rounded-xl border ${cardClass} cursor-pointer transition-colors`}>
        <span className={`text-sm font-medium ${textClass}`}>
          Auto-refresh
        </span>
        <div className="relative">
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
        </div>
      </label>
      
      <label className={`flex items-center justify-between p-4 rounded-xl border ${cardClass} cursor-pointer transition-colors`}>
        <span className={`text-sm font-medium ${textClass}`}>
          Animações
        </span>
        <div className="relative">
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
        </div>
      </label>
      
      <label className={`flex items-center justify-between p-4 rounded-xl border ${cardClass} cursor-pointer transition-colors`}>
        <span className={`text-sm font-medium ${textClass}`}>
          Notificações
        </span>
        <div className="relative">
          <input type="checkbox" className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
        </div>
      </label>

      <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
        <h4 className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'} mb-2`}>Sobre</h4>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Neptune Angola Real-Time v0.1.0<br />
          Parte do projeto MAREDATUM
        </p>
      </div>
    </div>
  );
}
