'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WeatherFrame } from '@/hooks/useWeatherAnimation';

interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  speed: number;
}

interface WindParticlesLayerProps {
  weatherData: WeatherFrame | WeatherFrame[];
  visible: boolean;
  particleCount?: number;
  particleLifetime?: number;
  particleSpeed?: number;
  opacity?: number;
  colorScheme?: 'speed' | 'direction' | 'uniform';
}

/**
 * WindParticlesLayer - Animated wind particles visualization
 * 
 * Creates a dynamic particle system that visualizes wind flow across the map
 * Particles move according to wind speed and direction from weather data
 * 
 * Features:
 * - Smooth particle motion based on real wind data
 * - Color-coded particles (by speed or uniform)
 * - Automatic particle lifecycle management
 * - Performance optimized with canvas rendering
 * - Responsive to map zoom and pan
 */
export function WindParticlesLayer({
  weatherData,
  visible = true,
  particleCount = 3000,
  particleLifetime = 100,
  particleSpeed = 1.0,
  opacity = 0.6,
  colorScheme = 'speed'
}: WindParticlesLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<WindParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);

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

    // Initialize particles
    initializeParticles(canvas.width, canvas.height);

    // Create image overlay from canvas
    const bounds = map.getBounds();
    const imageUrl = canvas.toDataURL();
    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 1,
      interactive: false,
      zIndex: 400
    }).addTo(map);

    // Animation loop
    const animate = () => {
      if (!canvasRef.current || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      updateParticles(canvas.width, canvas.height);
      drawParticles(ctx, canvas.width, canvas.height);

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
        initializeParticles(canvas.width, canvas.height);
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
  }, [map, visible, weatherData, particleCount, particleLifetime, particleSpeed, opacity, colorScheme]);

  /**
   * Initialize particles with random positions
   */
  function initializeParticles(width: number, height: number) {
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(width, height));
    }
  }

  /**
   * Create a new particle
   */
  function createParticle(width: number, height: number): WindParticle {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      age: 0,
      maxAge: particleLifetime + Math.random() * particleLifetime,
      speed: 0
    };
  }

  /**
   * Get wind data at particle position
   */
  function getWindAtPosition(x: number, y: number, width: number, height: number): { vx: number; vy: number; speed: number } {
    if (!map) return { vx: 0, vy: 0, speed: 0 };

    // Convert canvas coordinates to lat/lng
    const point = L.point(x, y);
    const latLng = map.containerPointToLatLng(point);

    // Get weather data for this location
    const weather = Array.isArray(weatherData) 
      ? findNearestWeatherData(latLng.lat, latLng.lng, weatherData)
      : weatherData;

    if (!weather || !weather.wind_speed_10m || !weather.wind_direction_10m) {
      return { vx: 0, vy: 0, speed: 0 };
    }

    // Convert wind direction (meteorological) to velocity components
    // Wind direction is "from" direction, so we add 180° to get "to" direction
    const windDirection = (weather.wind_direction_10m + 180) % 360;
    const windSpeed = weather.wind_speed_10m;

    // Convert to radians
    const angleRad = (windDirection * Math.PI) / 180;

    // Calculate velocity components (scaled for visualization)
    const speedScale = particleSpeed * 0.5;
    const vx = Math.sin(angleRad) * windSpeed * speedScale;
    const vy = -Math.cos(angleRad) * windSpeed * speedScale; // Negative because canvas Y is inverted

    return { vx, vy, speed: windSpeed };
  }

  /**
   * Find nearest weather data point
   */
  function findNearestWeatherData(lat: number, lng: number, data: WeatherFrame[]): WeatherFrame | null {
    if (data.length === 0) return null;
    if (data.length === 1) return data[0];

    let nearest = data[0];
    let minDistance = Infinity;

    for (const point of data) {
      const distance = Math.sqrt(
        Math.pow(point.latitude - lat, 2) + 
        Math.pow(point.longitude - lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }

    return nearest;
  }

  /**
   * Update particle positions and lifecycle
   */
  function updateParticles(width: number, height: number) {
    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];

      // Update particle age
      particle.age++;

      // Reset particle if too old or out of bounds
      if (particle.age >= particle.maxAge || 
          particle.x < 0 || particle.x > width || 
          particle.y < 0 || particle.y > height) {
        particlesRef.current[i] = createParticle(width, height);
        continue;
      }

      // Get wind velocity at particle position
      const wind = getWindAtPosition(particle.x, particle.y, width, height);
      particle.vx = wind.vx;
      particle.vy = wind.vy;
      particle.speed = wind.speed;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
    }
  }

  /**
   * Draw particles on canvas
   */
  function drawParticles(ctx: CanvasRenderingContext2D, width: number, height: number) {
    for (const particle of particlesRef.current) {
      // Calculate particle alpha based on age (fade out towards end of life)
      const ageRatio = particle.age / particle.maxAge;
      const alpha = opacity * (1 - ageRatio);

      // Get color based on color scheme
      let color: string;
      switch (colorScheme) {
        case 'speed':
          // Color based on wind speed: blue (slow) -> cyan -> yellow -> red (fast)
          const speedRatio = Math.min(particle.speed / 30, 1); // 30 km/h max for color scale
          if (speedRatio < 0.33) {
            const t = speedRatio * 3;
            color = `rgba(${Math.round(100 + (0 - 100) * t)}, ${Math.round(150 + (200 - 150) * t)}, 255, ${alpha})`;
          } else if (speedRatio < 0.67) {
            const t = (speedRatio - 0.33) * 3;
            color = `rgba(${Math.round(0 + (255 - 0) * t)}, ${Math.round(200 + (255 - 200) * t)}, ${Math.round(255 + (0 - 255) * t)}, ${alpha})`;
          } else {
            const t = (speedRatio - 0.67) * 3;
            color = `rgba(255, ${Math.round(255 + (100 - 255) * t)}, 0, ${alpha})`;
          }
          break;

        case 'direction':
          // Color based on wind direction (hue wheel)
          const hue = particle.speed > 0 ? (Math.atan2(particle.vx, -particle.vy) * 180 / Math.PI + 180) % 360 : 0;
          color = `hsla(${hue}, 80%, 60%, ${alpha})`;
          break;

        case 'uniform':
        default:
          // Uniform white color
          color = `rgba(255, 255, 255, ${alpha})`;
          break;
      }

      // Draw particle
      ctx.fillStyle = color;
      ctx.fillRect(particle.x, particle.y, 2, 2);

      // Optionally draw particle trail
      if (particle.speed > 5) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        ctx.stroke();
      }
    }
  }

  return null; // This is a purely effect-based component
}

