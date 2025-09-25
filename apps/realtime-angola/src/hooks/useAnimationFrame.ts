// Optimized animation hook with precise timing and frame rate control
// Provides smooth animations with configurable FPS and delta time calculations

import { useRef, useEffect, useCallback } from 'react';

interface AnimationOptions {
  fps?: number;           // Target frames per second (default: 30 for smooth but efficient animation)
  autoStart?: boolean;    // Whether to start animation automatically (default: true)
  enabled?: boolean;      // Whether animation is enabled (default: true)
}

interface AnimationState {
  isRunning: boolean;
  startTime: number;
  lastTime: number;
  frameCount: number;
  actualFPS: number;
}

interface AnimationCallbackParams {
  deltaTime: number;      // Time since last frame in milliseconds
  totalTime: number;      // Total time since animation started in milliseconds
  progress: number;       // Normalized progress value (0-1 based on time)
  frameCount: number;     // Total number of frames rendered
  actualFPS: number;      // Current actual FPS (calculated over last second)
}

type AnimationCallback = (params: AnimationCallbackParams) => void | boolean; // Return false to stop animation

export function useAnimationFrame(
  callback: AnimationCallback,
  options: AnimationOptions = {}
) {
  const {
    fps = 30,
    autoStart = true,
    enabled = true
  } = options;

  const frameId = useRef<number | null>(null);
  const stateRef = useRef<AnimationState>({
    isRunning: false,
    startTime: 0,
    lastTime: 0,
    frameCount: 0,
    actualFPS: 0
  });

  const frameInterval = 1000 / fps; // Target interval between frames in ms
  const fpsCalculationInterval = 1000; // Calculate FPS every second
  const fpsFrameCountRef = useRef(0);
  const fpsLastCalculation = useRef(0);

  const animate = useCallback((currentTime: number) => {
    const state = stateRef.current;

    if (!state.isRunning) return;

    // Initialize timing on first frame
    if (state.frameCount === 0) {
      state.startTime = currentTime;
      state.lastTime = currentTime;
      fpsLastCalculation.current = currentTime;
    }

    // Calculate delta time
    const deltaTime = currentTime - state.lastTime;

    // Frame rate limiting - only proceed if enough time has passed
    if (deltaTime < frameInterval) {
      frameId.current = requestAnimationFrame(animate);
      return;
    }

    // Calculate FPS every second
    fpsFrameCountRef.current++;
    if (currentTime - fpsLastCalculation.current >= fpsCalculationInterval) {
      state.actualFPS = (fpsFrameCountRef.current * 1000) / (currentTime - fpsLastCalculation.current);
      fpsFrameCountRef.current = 0;
      fpsLastCalculation.current = currentTime;
    }

    // Calculate animation parameters
    const totalTime = currentTime - state.startTime;
    const progress = (totalTime % 10000) / 10000; // 10-second cycle for progress (0-1)

    const animationParams: AnimationCallbackParams = {
      deltaTime,
      totalTime,
      progress,
      frameCount: state.frameCount,
      actualFPS: state.actualFPS
    };

    // Call the animation callback
    let shouldContinue = true;
    try {
      const result = callback(animationParams);
      shouldContinue = result !== false;
    } catch (error) {
      console.error('Animation callback error:', error);
      shouldContinue = false;
    }

    // Update state
    state.lastTime = currentTime;
    state.frameCount++;

    // Continue animation if requested
    if (shouldContinue && state.isRunning) {
      frameId.current = requestAnimationFrame(animate);
    } else {
      stop();
    }
  }, [callback, frameInterval]);

  const start = useCallback(() => {
    if (stateRef.current.isRunning || !enabled) return;

    stateRef.current.isRunning = true;
    stateRef.current.frameCount = 0;
    fpsFrameCountRef.current = 0;

    frameId.current = requestAnimationFrame(animate);
  }, [animate, enabled]);

  const stop = useCallback(() => {
    stateRef.current.isRunning = false;

    if (frameId.current !== null) {
      cancelAnimationFrame(frameId.current);
      frameId.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (stateRef.current.isRunning) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const reset = useCallback(() => {
    stop();
    stateRef.current = {
      isRunning: false,
      startTime: 0,
      lastTime: 0,
      frameCount: 0,
      actualFPS: 0
    };
    fpsFrameCountRef.current = 0;
  }, [stop]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && enabled) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, enabled, start, stop]);

  // Enable/disable effect
  useEffect(() => {
    if (!enabled && stateRef.current.isRunning) {
      stop();
    }
  }, [enabled, stop]);

  return {
    start,
    stop,
    toggle,
    reset,
    isRunning: stateRef.current.isRunning,
    frameCount: stateRef.current.frameCount,
    actualFPS: stateRef.current.actualFPS
  };
}

// Helper hook for simple easing animations
export function useEasedAnimation(
  duration: number,
  easing: (t: number) => number = (t) => t, // Linear by default
  options: AnimationOptions = {}
) {
  const progressRef = useRef(0);
  const easedProgressRef = useRef(0);

  const animationCallback = useCallback((params: AnimationCallbackParams) => {
    const rawProgress = (params.totalTime % duration) / duration;
    const easedProgress = easing(rawProgress);

    progressRef.current = rawProgress;
    easedProgressRef.current = easedProgress;

    return true; // Continue animation
  }, [duration, easing]);

  const animation = useAnimationFrame(animationCallback, options);

  return {
    ...animation,
    progress: progressRef.current,
    easedProgress: easedProgressRef.current
  };
}

// Common easing functions
export const easingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  // Smooth breathing effect - perfect for subtle heat map animation
  breathing: (t: number) => (Math.sin(t * Math.PI * 2) + 1) / 2
};

// Performance monitoring hook
export function useAnimationPerformance() {
  const metricsRef = useRef({
    frameDrops: 0,
    averageFPS: 0,
    maxFrameTime: 0,
    samples: [] as number[]
  });

  const monitor = useCallback((actualFPS: number, deltaTime: number) => {
    const metrics = metricsRef.current;

    // Track frame drops (when FPS is significantly below target)
    if (actualFPS > 0 && actualFPS < 25) { // Below 25 FPS considered a drop
      metrics.frameDrops++;
    }

    // Track frame times
    if (deltaTime > metrics.maxFrameTime) {
      metrics.maxFrameTime = deltaTime;
    }

    // Calculate rolling average FPS
    metrics.samples.push(actualFPS);
    if (metrics.samples.length > 60) { // Keep last 60 samples (2 seconds at 30fps)
      metrics.samples.shift();
    }

    metrics.averageFPS = metrics.samples.reduce((sum, fps) => sum + fps, 0) / metrics.samples.length;
  }, []);

  const reset = useCallback(() => {
    metricsRef.current = {
      frameDrops: 0,
      averageFPS: 0,
      maxFrameTime: 0,
      samples: []
    };
  }, []);

  return {
    monitor,
    reset,
    metrics: metricsRef.current
  };
}