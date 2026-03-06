import { create } from 'zustand';

/**
 * Animation Store
 * Global state management for time-series animation controls
 *
 * Purpose:
 * - Synchronize animation state across multiple layers
 * - Maintain playback state (playing/paused, speed, current frame)
 * - Enable frame buffering for smooth playback
 * - Coordinate between TimeSeriesPlayer and visualization layers
 */

interface AnimationState {
  // Playback state
  isAnimating: boolean;
  currentFrame: number;
  totalFrames: number;
  animationSpeed: number; // 0.5x, 1x, 2x, 4x

  // Data type being animated
  currentDataType: 'sst' | 'ocean_color' | 'salinity' | null;

  // Frame buffer for preloading
  frameBuffer: Map<number, any>; // frameIndex -> frame data
  bufferSize: number; // Number of frames to preload

  // Performance metrics
  fps: number;
  lastFrameTime: number;

  // Actions
  setIsAnimating: (isAnimating: boolean) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (total: number) => void;
  setAnimationSpeed: (speed: number) => void;
  setCurrentDataType: (dataType: 'sst' | 'ocean_color' | 'salinity') => void;

  // Frame buffer management
  preloadFrame: (frameIndex: number, frameData: any) => void;
  getBufferedFrame: (frameIndex: number) => any | null;
  clearBuffer: () => void;

  // Performance tracking
  updateFPS: (fps: number) => void;
  updateLastFrameTime: (time: number) => void;

  // Reset all state
  reset: () => void;
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
  // Initial state
  isAnimating: false,
  currentFrame: 0,
  totalFrames: 0,
  animationSpeed: 1,
  currentDataType: null,
  frameBuffer: new Map(),
  bufferSize: 10, // Preload 10 frames ahead
  fps: 0,
  lastFrameTime: 0,

  // Actions
  setIsAnimating: (isAnimating) => set({ isAnimating }),

  setCurrentFrame: (frame) => set({ currentFrame: frame }),

  setTotalFrames: (total) => set({ totalFrames: total }),

  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  setCurrentDataType: (dataType) => set({ currentDataType: dataType }),

  // Frame buffer management
  preloadFrame: (frameIndex, frameData) => {
    const { frameBuffer, bufferSize } = get();
    const newBuffer = new Map(frameBuffer);

    // Add new frame to buffer
    newBuffer.set(frameIndex, frameData);

    // Remove old frames beyond buffer size
    if (newBuffer.size > bufferSize * 2) {
      const sortedKeys = Array.from(newBuffer.keys()).sort((a, b) => a - b);
      const keysToRemove = sortedKeys.slice(0, sortedKeys.length - bufferSize * 2);
      keysToRemove.forEach(key => newBuffer.delete(key));
    }

    set({ frameBuffer: newBuffer });
  },

  getBufferedFrame: (frameIndex) => {
    const { frameBuffer } = get();
    return frameBuffer.get(frameIndex) || null;
  },

  clearBuffer: () => set({ frameBuffer: new Map() }),

  // Performance tracking
  updateFPS: (fps) => set({ fps }),

  updateLastFrameTime: (time) => set({ lastFrameTime: time }),

  // Reset state
  reset: () => set({
    isAnimating: false,
    currentFrame: 0,
    totalFrames: 0,
    animationSpeed: 1,
    currentDataType: null,
    frameBuffer: new Map(),
    fps: 0,
    lastFrameTime: 0
  })
}));

/**
 * Hook to get animation progress percentage
 */
export function useAnimationProgress() {
  const currentFrame = useAnimationStore((state) => state.currentFrame);
  const totalFrames = useAnimationStore((state) => state.totalFrames);

  return totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;
}

/**
 * Hook to check if frame is buffered (for preloading UI feedback)
 */
export function useIsFrameBuffered(frameIndex: number) {
  const getBufferedFrame = useAnimationStore((state) => state.getBufferedFrame);
  return getBufferedFrame(frameIndex) !== null;
}
