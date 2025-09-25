import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now.getTime() - targetDate.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Agora mesmo'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`
  }
  if (diffHours < 24) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
  }
  if (diffDays < 7) {
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
  }
  
  return targetDate.toLocaleDateString('pt-PT')
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'healthy':
    case 'completed':
    case 'success':
      return 'text-green-600 bg-green-100'
    case 'offline':
    case 'inactive':
    case 'error':
    case 'failed':
    case 'critical':
      return 'text-red-600 bg-red-100'
    case 'warning':
    case 'pending':
    case 'running':
      return 'text-yellow-600 bg-yellow-100'
    case 'info':
    case 'maintenance':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
    case 'active':
    case 'healthy':
    case 'completed':
    case 'success':
      return '✅'
    case 'offline':
    case 'inactive':
    case 'error':
    case 'failed':
    case 'critical':
      return '❌'
    case 'warning':
    case 'pending':
      return '⚠️'
    case 'running':
      return '🔄'
    case 'info':
    case 'maintenance':
      return 'ℹ️'
    default:
      return '⚪'
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function parseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-999999px'
    document.body.prepend(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
    } catch (error) {
      // console.error('Copy to clipboard failed:', error)
      throw error
    } finally {
      textArea.remove()
    }
    
    return Promise.resolve()
  }
}

export function getColorForValue(value: number, min: number = 0, max: number = 100): string {
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))
  
  if (normalizedValue < 0.5) {
    // Red to Yellow
    const red = 255
    const green = Math.round(255 * normalizedValue * 2)
    return `rgb(${red}, ${green}, 0)`
  } else {
    // Yellow to Green
    const red = Math.round(255 * (1 - normalizedValue) * 2)
    const green = 255
    return `rgb(${red}, ${green}, 0)`
  }
}

export function generateChartColors(count: number): string[] {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ]
  
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length])
  }
  
  return result
}

export const MARINE_COLORS = {
  primary: '#0ea5e9',
  secondary: '#0284c7',
  accent: '#14b8a6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  light: '#f8fafc',
  dark: '#1e293b',
}

export const CHART_COLORS = {
  biodiversity: '#10b981',
  temperature: '#ef4444',
  salinity: '#06b6d4',
  chlorophyll: '#84cc16',
  currents: '#3b82f6',
  wind: '#6b7280',
  species: '#8b5cf6',
  habitat: '#f59e0b',
}

export function getServiceIcon(serviceName: string): string {
  const icons: Record<string, string> = {
    'postgis': '🗄️',
    'minio': '💾',
    'stac': '🗂️',
    'pygeoapi': '🌍',
    'browser': '🔍',
    'frontend': '💻',
    'admin': '⚙️',
    'redis': '⚡',
    'celery': '🔄',
    'flower': '🌺',
    'keycloak': '🔐',
    'proxy': '🔀',
  }
  
  const key = serviceName.toLowerCase().replace(/[^a-z]/g, '')
  return icons[key] || '🔧'
}
