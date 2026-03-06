'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Gauge, Calendar } from 'lucide-react';
import { useAnimationStore } from '@/stores/animationStore';

/**
 * TimeSeriesPlayer Component
 * Interactive time-series animation player for oceanographic data (SST, Chlorophyll, Salinity)
 *
 * Features:
 * - Play/Pause controls
 * - Speed adjustment (0.5x, 1x, 2x, 4x)
 * - Timeline scrubbing
 * - Frame-by-frame navigation
 * - Date/time display
 * - Data type selector (SST, Ocean Color, Salinity)
 *
 * Performance Targets:
 * - 30 FPS on desktop
 * - 60 FPS on mobile
 * - <100ms frame transition
 */

interface TimeFrame {
  timestamp: string;
  frameIndex: number;
  dataPoints: number;
  minValue: number;
  maxValue: number;
  avgValue: number;
}

interface TimeSeriesPlayerProps {
  dataType: 'sst' | 'ocean_color' | 'salinity';
  onFrameChange: (frameIndex: number, timestamp: string) => void;
  className?: string;
}

export default function TimeSeriesPlayer({
  dataType,
  onFrameChange,
  className = ''
}: TimeSeriesPlayerProps) {
  const [frames, setFrames] = useState<TimeFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Zustand store for global animation state
  const {
    currentFrame,
    isAnimating,
    animationSpeed,
    setCurrentFrame,
    setIsAnimating,
    setAnimationSpeed
  } = useAnimationStore();

  /**
   * Fetch time-series frames metadata from API
   */
  useEffect(() => {
    async function fetchFrames() {
      try {
        setLoading(true);
        setError(null);

        // Fetch frames metadata from timeseries-api-worker
        const response = await fetch(
          `https://bgapp-api-worker.majearcasa.workers.dev/api/timeseries/frames?dataType=${dataType}&days=30`,
          {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'max-age=3600'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch frames: ${response.statusText}`);
        }

        const data = await response.json();
        setFrames(data.frames || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching time-series frames:', err);
        setError(err instanceof Error ? err.message : 'Failed to load frames');
        setLoading(false);

        // Use mock data for development
        setFrames(generateMockFrames());
      }
    }

    fetchFrames();
  }, [dataType]);

  /**
   * Animation loop for auto-playback
   */
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      const frameInterval = (1000 / 30) / playbackSpeed; // Target 30 FPS adjusted by speed

      if (elapsed >= frameInterval) {
        setCurrentFrameIndex((prev) => {
          const nextFrame = (prev + 1) % frames.length;

          // Notify parent component of frame change
          if (frames[nextFrame]) {
            onFrameChange(nextFrame, frames[nextFrame].timestamp);
            setCurrentFrame(nextFrame);
          }

          return nextFrame;
        });

        lastFrameTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, frames, playbackSpeed, onFrameChange, setCurrentFrame]);

  /**
   * Play/Pause toggle
   */
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setIsAnimating(!isPlaying);
  }, [isPlaying, setIsAnimating]);

  /**
   * Jump to previous frame
   */
  const previousFrame = useCallback(() => {
    setCurrentFrameIndex((prev) => {
      const newIndex = prev === 0 ? frames.length - 1 : prev - 1;
      if (frames[newIndex]) {
        onFrameChange(newIndex, frames[newIndex].timestamp);
        setCurrentFrame(newIndex);
      }
      return newIndex;
    });
  }, [frames, onFrameChange, setCurrentFrame]);

  /**
   * Jump to next frame
   */
  const nextFrame = useCallback(() => {
    setCurrentFrameIndex((prev) => {
      const newIndex = (prev + 1) % frames.length;
      if (frames[newIndex]) {
        onFrameChange(newIndex, frames[newIndex].timestamp);
        setCurrentFrame(newIndex);
      }
      return newIndex;
    });
  }, [frames, onFrameChange, setCurrentFrame]);

  /**
   * Seek to specific frame via timeline scrubbing
   */
  const seekToFrame = useCallback((frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < frames.length) {
      setCurrentFrameIndex(frameIndex);
      if (frames[frameIndex]) {
        onFrameChange(frameIndex, frames[frameIndex].timestamp);
        setCurrentFrame(frameIndex);
      }
    }
  }, [frames, onFrameChange, setCurrentFrame]);

  /**
   * Cycle through playback speeds
   */
  const cycleSpeed = useCallback(() => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    setAnimationSpeed(nextSpeed);
  }, [playbackSpeed, setAnimationSpeed]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
  };

  /**
   * Get data type label in Portuguese
   */
  const getDataTypeLabel = () => {
    switch (dataType) {
      case 'sst': return 'Temperatura Superficial (SST)';
      case 'ocean_color': return 'Clorofila-a (Ocean Color)';
      case 'salinity': return 'Salinidade';
      default: return dataType;
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-300">A carregar animação temporal...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="text-red-400 text-sm">
          ⚠️ Erro ao carregar frames: {error}
        </div>
      </div>
    );
  }

  const currentFrame = frames[currentFrameIndex];
  const timestamp = currentFrame ? formatTimestamp(currentFrame.timestamp) : { date: '--', time: '--' };

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {/* Header: Data Type & Current Date/Time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-sm font-medium text-gray-300">{getDataTypeLabel()}</div>
            <div className="text-xs text-gray-500">
              {timestamp.date} às {timestamp.time}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-gray-400" />
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-gray-300 transition-colors"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentFrameIndex}
          onChange={(e) => seekToFrame(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Frame {currentFrameIndex + 1}</span>
          <span>{frames.length} frames</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={previousFrame}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          title="Frame anterior"
        >
          <SkipBack className="w-5 h-5 text-gray-300" />
        </button>

        <button
          onClick={togglePlayPause}
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors shadow-lg"
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={nextFrame}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          title="Próximo frame"
        >
          <SkipForward className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Frame Statistics (Debug Info) */}
      {currentFrame && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div>
              <div className="text-gray-500">Pontos</div>
              <div className="font-medium">{currentFrame.dataPoints.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Mín/Máx</div>
              <div className="font-medium">
                {currentFrame.minValue.toFixed(2)} / {currentFrame.maxValue.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Média</div>
              <div className="font-medium">{currentFrame.avgValue.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate mock frames for development/fallback
 */
function generateMockFrames(): TimeFrame[] {
  const frames: TimeFrame[] = [];
  const now = new Date();

  for (let i = 0; i < 120; i++) {
    const timestamp = new Date(now.getTime() - (120 - i) * 6 * 60 * 60 * 1000); // 6-hour intervals
    frames.push({
      timestamp: timestamp.toISOString(),
      frameIndex: i,
      dataPoints: Math.floor(1000 + Math.random() * 500),
      minValue: 20 + Math.random() * 3,
      maxValue: 28 + Math.random() * 2,
      avgValue: 24 + Math.random() * 2
    });
  }

  return frames;
}
