// Cache bust: Wed Sep 18 15:15:00 WEST 2025 - Fixed admin dashboard errors

export const CACHE_VERSION = '2.2.0-fixed-admin-errors'
export const BUILD_TIMESTAMP = '2025-09-18T15:15:00.000Z'

export function cacheBustUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_v=${CACHE_VERSION}&_t=${Date.now()}`
}
