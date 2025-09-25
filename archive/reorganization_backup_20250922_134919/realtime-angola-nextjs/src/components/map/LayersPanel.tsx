'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Ship,
  Thermometer,
  Droplets,
  Wind,
  Waves,
  Activity,
  Move,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LayersPanelProps {
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;
  theme: 'light' | 'dark';
}

const layers = [
  { id: 'vessels', label: 'Embarcações', icon: Ship },
  { id: 'temperature', label: 'Temperatura', icon: Thermometer },
  { id: 'chloropleth', label: 'Clorofila', icon: Droplets },
  { id: 'sst', label: 'SST', icon: Thermometer },
  { id: 'currents', label: 'Correntes', icon: Wind },
  { id: 'waves', label: 'Ondas', icon: Waves },
  { id: 'salinity', label: 'Salinidade', icon: Activity }
];

export function LayersPanel({ activeLayers, toggleLayer, theme }: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize position to top-right on mount
    const updateInitialPosition = () => {
      if (typeof window !== 'undefined') {
        setPosition({
          x: window.innerWidth - 280, // Panel width approximately 280px
          y: 80 // Below header
        });
        setIsInitialized(true);
      }
    };

    updateInitialPosition();

    window.addEventListener('resize', updateInitialPosition);
    return () => window.removeEventListener('resize', updateInitialPosition);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition(prev => {
        const panelWidth = panelRef.current?.offsetWidth || 280;
        const panelHeight = panelRef.current?.offsetHeight || 400;
        const newX = Math.max(0, Math.min(window.innerWidth - panelWidth, prev.x + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - panelHeight, prev.y + deltaY));
        return { x: newX, y: newY };
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header
    if (e.currentTarget === e.target || e.currentTarget.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  if (!isInitialized) return null;

  const bgClass = theme === 'light'
    ? 'bg-white/95 border-gray-200/50'
    : 'bg-slate-900/95 border-slate-700/50';

  const textClass = theme === 'light'
    ? 'text-gray-900'
    : 'text-white';

  const secondaryTextClass = theme === 'light'
    ? 'text-gray-600'
    : 'text-gray-300';

  return (
    <div
      ref={panelRef}
      className={`fixed ${bgClass} backdrop-blur-sm rounded-lg shadow-lg border z-[1001] ${
        isDragging ? 'cursor-grabbing shadow-2xl scale-105' : ''
      } transition-shadow transition-transform`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '240px',
        maxWidth: '280px'
      }}
    >
      {/* Header - Draggable Area */}
      <div
        className={`flex items-center gap-2 p-3 border-b ${
          theme === 'light' ? 'border-gray-200/50' : 'border-slate-700/50'
        } ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } select-none bg-gradient-to-r ${
          theme === 'light' ? 'from-blue-50 to-white' : 'from-slate-800 to-slate-900'
        } rounded-t-lg`}
        onMouseDown={handleMouseDown}
      >
        <Move className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
        <Layers className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
        <h3 className={`font-semibold ${textClass} text-sm flex-1`}>Camadas</h3>
        <button
          className={`p-1 rounded ${
            theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-slate-800'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <ChevronDown className={`w-4 h-4 ${secondaryTextClass}`} />
          ) : (
            <ChevronUp className={`w-4 h-4 ${secondaryTextClass}`} />
          )}
        </button>
      </div>

      {/* Layers List */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {layers.map(layer => (
            <label
              key={layer.id}
              className={`flex items-center gap-3 cursor-pointer group p-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-gray-50'
                  : 'hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={activeLayers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
                className={`rounded ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white'
                    : 'border-slate-600 bg-slate-700'
                } text-blue-500 focus:ring-blue-500 focus:ring-offset-0 w-4 h-4`}
              />
              <layer.icon className={`w-4 h-4 ${
                theme === 'light'
                  ? 'text-gray-500 group-hover:text-gray-700'
                  : 'text-gray-400 group-hover:text-gray-200'
              }`} />
              <span className={`text-sm font-medium ${
                theme === 'light'
                  ? 'text-gray-700 group-hover:text-gray-900'
                  : 'text-gray-200 group-hover:text-white'
              }`}>
                {layer.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}