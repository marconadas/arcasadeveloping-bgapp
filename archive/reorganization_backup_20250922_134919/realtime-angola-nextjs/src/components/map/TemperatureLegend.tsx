'use client';

import { useState, useRef, useEffect } from 'react';
import { Thermometer, ChevronDown, ChevronUp, Move } from 'lucide-react';

interface TemperatureLegendProps {
  visible: boolean;
  minTemp?: number;
  maxTemp?: number;
  currentTemp?: number;
  onToggle?: () => void;
}

export function TemperatureLegend({
  visible,
  minTemp = 18,
  maxTemp = 30,
  currentTemp,
  onToggle
}: TemperatureLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize position to bottom-right on mount
    const updateInitialPosition = () => {
      if (typeof window !== 'undefined') {
        setPosition({
          x: window.innerWidth - 350,
          y: window.innerHeight - 400
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
        const newX = Math.max(0, Math.min(window.innerWidth - (panelRef.current?.offsetWidth || 300), prev.x + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - (panelRef.current?.offsetHeight || 200), prev.y + deltaY));
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

  if (!visible || !isInitialized) return null;

  const temperatureStops = [
    { temp: 18, color: '#0000FF', label: 'Very Cold' },
    { temp: 20, color: '#00FFFF', label: 'Cold' },
    { temp: 22, color: '#00FF00', label: 'Cool' },
    { temp: 24, color: '#FFFF00', label: 'Moderate' },
    { temp: 26, color: '#FFA500', label: 'Warm' },
    { temp: 28, color: '#FF6600', label: 'Hot' },
    { temp: 30, color: '#FF0000', label: 'Very Hot' }
  ];

  return (
    <div
      ref={panelRef}
      className={`fixed bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 z-[998] ${
        isDragging ? 'cursor-grabbing shadow-2xl scale-105' : ''
      } transition-shadow transition-transform`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      {/* Header - Draggable Area */}
      <div
        className={`flex items-center gap-3 p-3 border-b border-gray-200/50 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } select-none bg-gradient-to-r from-blue-50 to-white rounded-t-lg`}
        onMouseDown={handleMouseDown}
      >
        <Move className="w-4 h-4 text-gray-400" />
        <Thermometer className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">Sea Surface Temperature</h3>
          {currentTemp && (
            <p className="text-xs text-gray-600">Current: {currentTemp.toFixed(1)}°C</p>
          )}
        </div>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Legend Content */}
      {!collapsed && (
        <div className="p-3">
          {/* Color Scale */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <span className="text-xs font-medium text-gray-700">Temperature Scale (°C)</span>
            </div>

            {/* Gradient Bar */}
            <div className="relative">
              <div
                className="h-6 rounded border border-gray-300"
                style={{
                  background: `linear-gradient(to right,
                    #0000FF 0%,   /* 18°C - Very Cold */
                    #00FFFF 16%,  /* 20°C - Cold */
                    #00FF00 33%,  /* 22°C - Cool */
                    #FFFF00 50%,  /* 24°C - Moderate */
                    #FFA500 66%,  /* 26°C - Warm */
                    #FF6600 83%,  /* 28°C - Hot */
                    #FF0000 100%  /* 30°C - Very Hot */
                  )`
                }}
              />

              {/* Temperature markers */}
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">{minTemp}°</span>
                <span className="text-xs text-gray-600">24°</span>
                <span className="text-xs text-gray-600">{maxTemp}°</span>
              </div>
            </div>
          </div>

          {/* Temperature Ranges */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Temperature Ranges</h4>
            {temperatureStops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded border border-gray-300"
                  style={{ backgroundColor: stop.color }}
                />
                <span className="text-xs text-gray-600">
                  {stop.temp}°C - {stop.label}
                </span>
              </div>
            ))}
          </div>

          {/* Current Range Display */}
          {minTemp !== undefined && maxTemp !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Current Range:</span>
                <span className="text-xs font-medium text-gray-900">
                  {minTemp.toFixed(1)}° - {maxTemp.toFixed(1)}°C
                </span>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          {onToggle && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <button
                onClick={onToggle}
                className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Toggle Temperature Layer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}