'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WeatherFrame } from '@/hooks/useWeatherAnimation';

interface TemperatureAnimationLayerProps {
  currentFrame: WeatherFrame | null;
  visible: boolean;
  opacity?: number;
  showGradient?: boolean;
  colorScale?: 'turbo' | 'viridis' | 'plasma';
  interpolation?: 'linear' | 'smooth';
}

/**
 * TemperatureAnimationLayer - Animated temperature visualization
 * 
 * Displays temperature data as an animated heatmap that changes over time
 * Supports smooth interpolation between frames for fluid animation
 * 
 * Features:
 * - Smooth color transitions between temperature values
 * - Multiple color scales (turbo, viridis, plasma)
 * - Optional gradient smoothing with interpolation
 * - Responsive to map zoom and pan
 * - Performance optimized with canvas rendering
 */
export function TemperatureAnimationLayer({
  currentFrame,
  visible = true,
  opacity = 0.6,
  showGradient = true,
  colorScale = 'turbo',
  interpolation = 'smooth'
}: TemperatureAnimationLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const previousFrameRef = useRef<WeatherFrame | null>(null);
  const interpolationProgressRef = useRef(0);

  /**
   * Get temperature color based on color scale
   */
  const getTemperatureColor = useMemo(() => {
    return (temperature: number): [number, number, number] => {
      // Temperature range for Angola: 20-35°C
      const minTemp = 20;
      const maxTemp = 35;
      const normalizedTemp = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));

      switch (colorScale) {
        case 'viridis':
          // Purple → Blue → Green → Yellow
          if (normalizedTemp < 0.25) {
            const t = normalizedTemp * 4;
            return [
              68 + (58 - 68) * t,
              1 + (82 - 1) * t,
              84 + (139 - 84) * t
            ];
          } else if (normalizedTemp < 0.5) {
            const t = (normalizedTemp - 0.25) * 4;
            return [
              58 + (33 - 58) * t,
              82 + (145 - 82) * t,
              139 + (140 - 139) * t
            ];
          } else if (normalizedTemp < 0.75) {
            const t = (normalizedTemp - 0.5) * 4;
            return [
              33 + (94 - 33) * t,
              145 + (201 - 145) * t,
              140 + (98 - 140) * t
            ];
          } else {
            const t = (normalizedTemp - 0.75) * 4;
            return [
              94 + (253 - 94) * t,
              201 + (231 - 201) * t,
              98 + (37 - 98) * t
            ];
          }

        case 'plasma':
          // Purple → Red → Orange → Yellow
          if (normalizedTemp < 0.33) {
            const t = normalizedTemp * 3;
            return [
              13 + (128 - 13) * t,
              8 + (3 - 8) * t,
              135 + (91 - 135) * t
            ];
          } else if (normalizedTemp < 0.67) {
            const t = (normalizedTemp - 0.33) * 3;
            return [
              128 + (240 - 128) * t,
              3 + (99 - 3) * t,
              91 + (20 - 91) * t
            ];
          } else {
            const t = (normalizedTemp - 0.67) * 3;
            return [
              240 + (252 - 240) * t,
              99 + (222 - 99) * t,
              20 + (59 - 20) * t
            ];
          }

        case 'turbo':
        default:
          // Blue → Cyan → Green → Yellow → Red
          if (normalizedTemp < 0.2) {
            const t = normalizedTemp * 5;
            return [
              48 + (57 - 48) * t,
              18 + (146 - 18) * t,
              59 + (223 - 59) * t
            ];
          } else if (normalizedTemp < 0.4) {
            const t = (normalizedTemp - 0.2) * 5;
            return [
              57 + (34 - 57) * t,
              146 + (198 - 146) * t,
              223 + (122 - 223) * t
            ];
          } else if (normalizedTemp < 0.6) {
            const t = (normalizedTemp - 0.4) * 5;
            return [
              34 + (122 - 34) * t,
              198 + (209 - 198) * t,
              122 + (58 - 122) * t
            ];
          } else if (normalizedTemp < 0.8) {
            const t = (normalizedTemp - 0.6) * 5;
            return [
              122 + (240 - 122) * t,
              209 + (150 - 209) * t,
              58 + (40 - 58) * t
            ];
          } else {
            const t = (normalizedTemp - 0.8) * 5;
            return [
              240 + (220 - 240) * t,
              150 + (20 - 150) * t,
              40 + (60 - 40) * t
            ];
          }
      }
    };
  }, [colorScale]);

  /**
   * Interpolate between two temperatures
   */
  function interpolateTemperature(temp1: number | undefined, temp2: number | undefined, progress: number): number {
    if (temp1 === undefined && temp2 === undefined) return 25; // Default
    if (temp1 === undefined) return temp2!;
    if (temp2 === undefined) return temp1;

    if (interpolation === 'smooth') {
      // Smooth interpolation using ease-in-out
      const t = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      return temp1 + (temp2 - temp1) * t;
    } else {
      // Linear interpolation
      return temp1 + (temp2 - temp1) * progress;
    }
  }

  useEffect(() => {
    if (!map || !visible || !currentFrame) {
      // Clean up
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

    // Draw temperature heatmap
    drawTemperatureHeatmap(ctx, canvas.width, canvas.height);

    // Create or update image overlay
    const bounds = map.getBounds();
    const imageUrl = canvas.toDataURL();

    if (overlayRef.current) {
      overlayRef.current.setUrl(imageUrl);
      overlayRef.current.setBounds(bounds);
    } else {
      overlayRef.current = L.imageOverlay(imageUrl, bounds, {
        opacity,
        interactive: false,
        zIndex: 300
      }).addTo(map);
    }

    // Update previous frame for interpolation
    previousFrameRef.current = currentFrame;

    // Handle map changes
    const handleMapChange = () => {
      if (canvasRef.current && ctx && overlayRef.current) {
        const newBounds = map.getBounds();
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        drawTemperatureHeatmap(ctx, canvas.width, canvas.height);
        
        const newImageUrl = canvas.toDataURL();
        overlayRef.current.setUrl(newImageUrl);
        overlayRef.current.setBounds(newBounds);
      }
    };

    map.on('zoomend moveend', handleMapChange);

    // Cleanup
    return () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
      }
      map.off('zoomend moveend', handleMapChange);
    };
  }, [map, visible, currentFrame, opacity, showGradient, colorScale, interpolation, getTemperatureColor]);

  /**
   * Draw temperature heatmap on canvas
   */
  function drawTemperatureHeatmap(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!currentFrame || !map) return;

    // Create gradient overlay
    const temperature = currentFrame.temperature || 25;
    
    // Get current temperature and interpolate if we have a previous frame
    const displayTemp = previousFrameRef.current && interpolation === 'smooth'
      ? interpolateTemperature(previousFrameRef.current.temperature, temperature, interpolationProgressRef.current)
      : temperature;

    const [r, g, b] = getTemperatureColor(displayTemp);

    if (showGradient) {
      // Create radial gradient from center
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`);

      ctx.fillStyle = gradient;
    } else {
      // Uniform color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    ctx.fillRect(0, 0, width, height);

    // Add temperature text overlay
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    const text = `${displayTemp.toFixed(1)}°C`;
    const textWidth = ctx.measureText(text).width;
    const x = width - textWidth - 20;
    const y = 40;
    
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);

    // Add timestamp if available
    if (currentFrame.timestamp) {
      const time = new Date(currentFrame.timestamp);
      const timeText = time.toLocaleTimeString('pt-AO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      ctx.font = '14px Arial';
      const timeWidth = ctx.measureText(timeText).width;
      const timeX = width - timeWidth - 20;
      const timeY = 60;
      
      ctx.strokeText(timeText, timeX, timeY);
      ctx.fillText(timeText, timeX, timeY);
    }
  }

  return null; // This is a purely effect-based component
}

/**
 * TemperatureAnimationLegend - Shows temperature scale and current value
 */
export function TemperatureAnimationLegend({
  visible = true,
  currentTemp,
  minTemp = 20,
  maxTemp = 35,
  colorScale = 'turbo'
}: {
  visible?: boolean;
  currentTemp?: number;
  minTemp?: number;
  maxTemp?: number;
  colorScale?: 'turbo' | 'viridis' | 'plasma';
}) {
  if (!visible) return null;

  // Generate gradient CSS
  const generateGradient = () => {
    const steps: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const temp = minTemp + (maxTemp - minTemp) * (i / 10);
      const [r, g, b] = getColorForScale(temp, minTemp, maxTemp, colorScale);
      steps.push(`rgba(${r}, ${g}, ${b}, 1) ${i * 10}%`);
    }
    return `linear-gradient(to right, ${steps.join(', ')})`;
  };

  return (
    <div className="absolute bottom-32 left-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[220px]">
      <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
        Temperatura (Animação)
      </div>
      <div className="space-y-2">
        {/* Temperature gradient */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-4 rounded shadow-sm"
            style={{
              background: generateGradient()
            }}
          />
        </div>
        
        {/* Temperature range labels */}
        <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
          <span>{minTemp}°C</span>
          <span>{maxTemp}°C</span>
        </div>

        {/* Current temperature indicator */}
        {currentTemp !== undefined && (
          <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Atual:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {currentTemp.toFixed(1)}°C
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to get color for a temperature value
 */
function getColorForScale(
  temperature: number,
  minTemp: number,
  maxTemp: number,
  colorScale: 'turbo' | 'viridis' | 'plasma'
): [number, number, number] {
  const normalizedTemp = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));

  switch (colorScale) {
    case 'viridis':
      if (normalizedTemp < 0.25) {
        const t = normalizedTemp * 4;
        return [68 + (58 - 68) * t, 1 + (82 - 1) * t, 84 + (139 - 84) * t];
      } else if (normalizedTemp < 0.5) {
        const t = (normalizedTemp - 0.25) * 4;
        return [58 + (33 - 58) * t, 82 + (145 - 82) * t, 139 + (140 - 139) * t];
      } else if (normalizedTemp < 0.75) {
        const t = (normalizedTemp - 0.5) * 4;
        return [33 + (94 - 33) * t, 145 + (201 - 145) * t, 140 + (98 - 140) * t];
      } else {
        const t = (normalizedTemp - 0.75) * 4;
        return [94 + (253 - 94) * t, 201 + (231 - 201) * t, 98 + (37 - 98) * t];
      }

    case 'plasma':
      if (normalizedTemp < 0.33) {
        const t = normalizedTemp * 3;
        return [13 + (128 - 13) * t, 8 + (3 - 8) * t, 135 + (91 - 135) * t];
      } else if (normalizedTemp < 0.67) {
        const t = (normalizedTemp - 0.33) * 3;
        return [128 + (240 - 128) * t, 3 + (99 - 3) * t, 91 + (20 - 91) * t];
      } else {
        const t = (normalizedTemp - 0.67) * 3;
        return [240 + (252 - 240) * t, 99 + (222 - 99) * t, 20 + (59 - 20) * t];
      }

    case 'turbo':
    default:
      if (normalizedTemp < 0.2) {
        const t = normalizedTemp * 5;
        return [48 + (57 - 48) * t, 18 + (146 - 18) * t, 59 + (223 - 59) * t];
      } else if (normalizedTemp < 0.4) {
        const t = (normalizedTemp - 0.2) * 5;
        return [57 + (34 - 57) * t, 146 + (198 - 146) * t, 223 + (122 - 223) * t];
      } else if (normalizedTemp < 0.6) {
        const t = (normalizedTemp - 0.4) * 5;
        return [34 + (122 - 34) * t, 198 + (209 - 198) * t, 122 + (58 - 122) * t];
      } else if (normalizedTemp < 0.8) {
        const t = (normalizedTemp - 0.6) * 5;
        return [122 + (240 - 122) * t, 209 + (150 - 209) * t, 58 + (40 - 58) * t];
      } else {
        const t = (normalizedTemp - 0.8) * 5;
        return [240 + (220 - 240) * t, 150 + (20 - 150) * t, 40 + (60 - 40) * t];
      }
  }
}

