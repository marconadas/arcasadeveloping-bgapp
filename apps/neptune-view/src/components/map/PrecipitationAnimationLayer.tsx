'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WeatherFrame } from '@/hooks/useWeatherAnimation';

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface PrecipitationAnimationLayerProps {
  currentFrame: WeatherFrame | null;
  visible: boolean;
  intensity?: number; // 0-1, overrides currentFrame precipitation
  dropCount?: number;
  opacity?: number;
  showAccumulation?: boolean;
}

/**
 * PrecipitationAnimationLayer - Animated rain/precipitation visualization
 * 
 * Creates a realistic rain animation overlay on the map
 * Rain intensity is driven by weather data precipitation values
 * 
 * Features:
 * - Realistic falling rain drops with varying speeds
 * - Intensity-based rain density (more drops = more rain)
 * - Optional precipitation accumulation visualization
 * - Smooth performance with canvas rendering
 * - Responsive to map changes
 */
export function PrecipitationAnimationLayer({
  currentFrame,
  visible = true,
  intensity,
  dropCount = 200,
  opacity = 0.7,
  showAccumulation = false
}: PrecipitationAnimationLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const accumulationRef = useRef<number>(0);

  useEffect(() => {
    if (!map || !visible) {
      // Clean up
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      return;
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    // Get map container size
    const container = map.getContainer();
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get precipitation intensity from weather data or prop
    const precipIntensity = intensity !== undefined 
      ? intensity 
      : getPrecipitationIntensity(currentFrame);

    // Initialize raindrops based on intensity
    const adjustedDropCount = Math.floor(dropCount * precipIntensity);
    initializeRaindrops(canvas.width, canvas.height, adjustedDropCount);

    // Create image overlay
    const bounds = map.getBounds();
    const imageUrl = canvas.toDataURL();
    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 1,
      interactive: false,
      zIndex: 500 // Above other layers
    }).addTo(map);

    // Animation loop
    const animate = () => {
      if (!canvasRef.current || !ctx) return;

      // Clear canvas with slight fade for accumulation effect
      if (showAccumulation && precipIntensity > 0.1) {
        ctx.fillStyle = 'rgba(100, 120, 150, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        accumulationRef.current += precipIntensity * 0.1;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        accumulationRef.current = 0;
      }

      // Update and draw raindrops
      if (precipIntensity > 0) {
        updateRaindrops(canvas.height, precipIntensity);
        drawRaindrops(ctx);
      }

      // Draw accumulation indicator if enabled
      if (showAccumulation && accumulationRef.current > 0) {
        drawAccumulationIndicator(ctx, canvas.width, canvas.height);
      }

      // Update overlay
      if (overlayRef.current) {
        const newImageUrl = canvas.toDataURL();
        overlayRef.current.setUrl(newImageUrl);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle map resize
    const handleResize = () => {
      if (canvasRef.current && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        const newPrecipIntensity = intensity !== undefined 
          ? intensity 
          : getPrecipitationIntensity(currentFrame);
        const newDropCount = Math.floor(dropCount * newPrecipIntensity);
        initializeRaindrops(canvas.width, canvas.height, newDropCount);
      }
    };

    map.on('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (overlayRef.current) {
        overlayRef.current.remove();
      }
      map.off('resize', handleResize);
    };
  }, [map, visible, currentFrame, intensity, dropCount, opacity, showAccumulation]);

  /**
   * Get precipitation intensity from weather data
   * Returns 0-1 value
   */
  function getPrecipitationIntensity(frame: WeatherFrame | null): number {
    if (!frame || !frame.precipitation) return 0;
    
    // Scale precipitation (0-20mm/h) to intensity (0-1)
    const maxPrecip = 20; // mm/h
    return Math.min(frame.precipitation / maxPrecip, 1);
  }

  /**
   * Initialize raindrops
   */
  function initializeRaindrops(width: number, height: number, count: number) {
    raindropsRef.current = [];
    for (let i = 0; i < count; i++) {
      raindropsRef.current.push(createRaindrop(width, height));
    }
  }

  /**
   * Create a new raindrop
   */
  function createRaindrop(width: number, height: number): Raindrop {
    return {
      x: Math.random() * width,
      y: Math.random() * height - height, // Start above viewport
      length: 10 + Math.random() * 20,
      speed: 8 + Math.random() * 12,
      opacity: 0.3 + Math.random() * 0.4
    };
  }

  /**
   * Update raindrop positions
   */
  function updateRaindrops(height: number, intensity: number) {
    for (let i = 0; i < raindropsRef.current.length; i++) {
      const drop = raindropsRef.current[i];
      
      // Update position
      drop.y += drop.speed * (0.5 + intensity * 0.5);

      // Reset raindrop if it falls below viewport
      if (drop.y > height) {
        drop.y = -drop.length;
        drop.x = Math.random() * (canvasRef.current?.width || 800);
      }
    }
  }

  /**
   * Draw raindrops on canvas
   */
  function drawRaindrops(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = `rgba(174, 194, 224, ${opacity})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (const drop of raindropsRef.current) {
      ctx.globalAlpha = drop.opacity * opacity;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.length);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw precipitation accumulation indicator
   */
  function drawAccumulationIndicator(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const accumulation = Math.min(accumulationRef.current, 10); // Cap at 10mm display
    
    // Draw background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(10, height - 60, 150, 50);

    // Draw border
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, height - 60, 150, 50);

    // Draw text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Acumulação:', 20, height - 42);
    
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${accumulation.toFixed(1)} mm`, 20, height - 22);
  }

  return null; // This is a purely effect-based component
}

/**
 * PrecipitationLegend - Shows precipitation intensity scale
 */
export function PrecipitationLegend({
  visible = true,
  currentPrecipitation
}: {
  visible?: boolean;
  currentPrecipitation?: number;
}) {
  if (!visible) return null;

  // Classify precipitation intensity
  const getIntensityLabel = (precip: number) => {
    if (precip === 0) return 'Sem chuva';
    if (precip < 2) return 'Fraca';
    if (precip < 10) return 'Moderada';
    if (precip < 50) return 'Forte';
    return 'Muito Forte';
  };

  const getIntensityColor = (precip: number) => {
    if (precip === 0) return 'text-gray-400';
    if (precip < 2) return 'text-blue-400';
    if (precip < 10) return 'text-blue-500';
    if (precip < 50) return 'text-blue-600';
    return 'text-blue-800';
  };

  return (
    <div className="absolute bottom-44 left-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[220px]">
      <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
        Precipitação
      </div>
      <div className="space-y-2 text-xs">
        {/* Precipitation scale */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Fraca</span>
            <span className="text-gray-600 dark:text-gray-400">&lt; 2 mm/h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Moderada</span>
            <span className="text-gray-600 dark:text-gray-400">2-10 mm/h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Forte</span>
            <span className="text-gray-600 dark:text-gray-400">10-50 mm/h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Muito Forte</span>
            <span className="text-gray-600 dark:text-gray-400">&gt; 50 mm/h</span>
          </div>
        </div>

        {/* Current precipitation */}
        {currentPrecipitation !== undefined && (
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">Atual:</span>
              <div className="text-right">
                <div className={`font-bold ${getIntensityColor(currentPrecipitation)}`}>
                  {getIntensityLabel(currentPrecipitation)}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-[10px]">
                  {currentPrecipitation.toFixed(1)} mm/h
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

