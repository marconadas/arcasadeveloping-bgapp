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
      // SEM MOCK DATA - Mostrar erro real!
      console.error('❌ Erro obtendo status real dos serviços:', error);
      throw new Error(`Serviços não acessíveis: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await api.get('/admin/metrics')
      return response.data
    } catch (error) {
      // SEM MOCK DATA - Mostrar que métricas não estão disponíveis
      console.error('❌ Métricas não acessíveis:', error);
      throw new Error(`Métricas não disponíveis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default api
