import { useState, useEffect, useCallback, useRef } from 'react';

export interface WeatherFrame {
  latitude: number;
  longitude: number;
  temperature?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  precipitation?: number;
  cloud_cover?: number;
  relative_humidity?: number;
  pressure_msl?: number;
  timestamp: string;
}

export interface WeatherAnimationState {
  frames: WeatherFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1 = normal, 2 = 2x, 0.5 = 0.5x
  loop: boolean;
  animationType: 'wind' | 'temperature' | 'precipitation' | 'all';
}

export interface UseWeatherAnimationOptions {
  initialSpeed?: number;
  initialLoop?: boolean;
  initialAnimationType?: 'wind' | 'temperature' | 'precipitation' | 'all';
  frameDuration?: number; // milliseconds per frame
  autoPlay?: boolean;
}

/**
 * Hook for managing weather animation state and playback
 * Provides controls for playing weather data as an animation over time
 */
export function useWeatherAnimation(options: UseWeatherAnimationOptions = {}) {
  const {
    initialSpeed = 1,
    initialLoop = true,
    initialAnimationType = 'all',
    frameDuration = 1000, // 1 second per frame by default
    autoPlay = false
  } = options;

  const [state, setState] = useState<WeatherAnimationState>({
    frames: [],
    currentFrameIndex: 0,
    isPlaying: autoPlay,
    playbackSpeed: initialSpeed,
    loop: initialLoop,
    animationType: initialAnimationType
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const frameRequestRef = useRef<number | null>(null);

  /**
   * Load weather history data for animation
   */
  const loadWeatherHistory = useCallback(async (
    lat?: number,
    lon?: number,
    hours: number = 24
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: 'history',
        hours: hours.toString(),
        limit: hours.toString()
      });

      if (lat !== undefined) params.append('lat', lat.toString());
      if (lon !== undefined) params.append('lon', lon.toString());

      const response = await fetch(`/api/environmental/weather?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load weather history: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        setState(prev => ({
          ...prev,
          frames: result.data,
          currentFrameIndex: 0
        }));
        console.log(`[WeatherAnimation] Loaded ${result.data.length} weather frames`);
      } else {
        throw new Error('Invalid weather history response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weather data';
      setError(errorMessage);
      console.error('[WeatherAnimation] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Play animation
   */
  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  /**
   * Go to next frame
   */
  const nextFrame = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentFrameIndex + 1;
      if (nextIndex >= prev.frames.length) {
        if (prev.loop) {
          return { ...prev, currentFrameIndex: 0 };
        } else {
          return { ...prev, isPlaying: false };
        }
      }
      return { ...prev, currentFrameIndex: nextIndex };
    });
  }, []);

  /**
   * Go to previous frame
   */
  const previousFrame = useCallback(() => {
    setState(prev => {
      const prevIndex = prev.currentFrameIndex - 1;
      if (prevIndex < 0) {
        if (prev.loop) {
          return { ...prev, currentFrameIndex: prev.frames.length - 1 };
        } else {
          return { ...prev, currentFrameIndex: 0 };
        }
      }
      return { ...prev, currentFrameIndex: prevIndex };
    });
  }, []);

  /**
   * Go to specific frame
   */
  const goToFrame = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentFrameIndex: Math.max(0, Math.min(index, prev.frames.length - 1))
    }));
  }, []);

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: Math.max(0.1, Math.min(5, speed)) }));
  }, []);

  /**
   * Toggle loop mode
   */
  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, loop: !prev.loop }));
  }, []);

  /**
   * Set animation type
   */
  const setAnimationType = useCallback((type: 'wind' | 'temperature' | 'precipitation' | 'all') => {
    setState(prev => ({ ...prev, animationType: type }));
  }, []);

  /**
   * Reset animation to start
   */
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentFrameIndex: 0,
      isPlaying: false
    }));
  }, []);

  /**
   * Clear all frames
   */
  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      frames: [],
      currentFrameIndex: 0,
      isPlaying: false
    }));
  }, []);

  /**
   * Animation loop effect
   */
  useEffect(() => {
    if (state.isPlaying && state.frames.length > 0) {
      const adjustedDuration = frameDuration / state.playbackSpeed;
      
      animationTimerRef.current = setTimeout(() => {
        nextFrame();
      }, adjustedDuration);

      return () => {
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
        }
      };
    }
  }, [state.isPlaying, state.currentFrameIndex, state.playbackSpeed, frameDuration, nextFrame, state.frames.length]);

  /**
   * Get current frame data
   */
  const currentFrame = state.frames[state.currentFrameIndex] || null;

  /**
   * Get animation progress (0-1)
   */
  const progress = state.frames.length > 0 
    ? state.currentFrameIndex / (state.frames.length - 1) 
    : 0;

  /**
   * Get time range of animation
   */
  const timeRange = state.frames.length > 0
    ? {
        start: new Date(state.frames[0].timestamp),
        end: new Date(state.frames[state.frames.length - 1].timestamp),
        current: new Date(currentFrame?.timestamp || Date.now())
      }
    : null;

  return {
    // State
    state,
    currentFrame,
    progress,
    timeRange,
    isLoading,
    error,
    
    // Actions
    loadWeatherHistory,
    play,
    pause,
    togglePlayPause,
    nextFrame,
    previousFrame,
    goToFrame,
    setPlaybackSpeed,
    toggleLoop,
    setAnimationType,
    reset,
    clear
  };
}

