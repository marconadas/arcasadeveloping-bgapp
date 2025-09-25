import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utilitários para dados marítimos
export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

export function formatChlorophyll(chlor: number): string {
  return `${chlor.toFixed(2)} mg/m³`;
}

export function formatVesselSpeed(speed: number): string {
  return `${speed.toFixed(1)} nós`;
}

export function getDataQuality(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

export function interpolateColor(value: number, min: number, max: number, colorScale: string[]): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const index = Math.floor(normalized * (colorScale.length - 1));
  return colorScale[index] || colorScale[0];
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function isWithinAngolaBounds(lat: number, lng: number): boolean {
  return lat >= -18.0 && lat <= -4.0 && lng >= 11.0 && lng <= 24.0;
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}