import axios from 'axios'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bgapp-admin.pages.dev'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'warning'
  port: number
  url: string
  response_time?: number
  last_check: string
}

export interface SystemMetrics {
  timestamp: string
  cpu_percent: number
  memory_percent: number
  disk_percent: number
  connections_db: number
  requests_per_minute: number
}

// API Functions
export const apiService = {
  async getSystemStatus(): Promise<ServiceStatus[]> {
    try {
      const response = await api.get('/admin/services/status')
      return response.data
    } catch (error) {
      // Return mock data for development
      return [
        {
          name: 'PostGIS Database',
          status: 'online',
          port: 5432,
          url: 'postgresql://localhost:5432',
          response_time: 2.3,
          last_check: new Date().toISOString()
        },
        {
          name: 'STAC FastAPI',
          status: 'online',
          port: 8000,
          url: 'https://bgapp-api-worker.majearcasa.workers.dev',
          response_time: 1.1,
          last_check: new Date().toISOString()
        }
      ]
    }
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await api.get('/admin/metrics')
      return response.data
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        cpu_percent: 25.3 + Math.random() * 20,
        memory_percent: 67.2 + Math.random() * 10,
        disk_percent: 43.1 + Math.random() * 5,
        connections_db: 24 + Math.floor(Math.random() * 10),
        requests_per_minute: 1200 + Math.floor(Math.random() * 100)
      }
    }
  }
}

export default api
