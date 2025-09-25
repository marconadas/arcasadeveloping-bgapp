/**
 * STAC API Client
 * Cliente para comunicação com APIs STAC reais
 */

export interface STACProvider {
  id: string
  name: string
  url: string
  status: 'online' | 'offline' | 'connecting'
  collections_count?: number
  ocean_collections?: number
  description?: string
}

export interface STACCollection {
  id: string
  title: string
  description: string
  extent: {
    temporal: {
      interval: string[][]
    }
    spatial: {
      bbox: number[][]
    }
  }
  summaries?: any
  links: any[]
  license?: string
  keywords?: string[]
  providers?: any[]
  items_count?: number
  last_updated?: string
}

export interface STACItem {
  id: string
  collection: string
  datetime: string
  properties: any
  assets: any
  geometry: any
  bbox?: number[]
}

export class STACApiClient {
  private baseUrl: string
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutos

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  /**
   * Verifica se o cache está válido
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  /**
   * Busca dados com cache
   */
  private async fetchWithCache(url: string): Promise<any> {
    if (this.isCacheValid(url)) {
      return this.cache.get(url)!.data
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      this.cache.set(url, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error)
      throw error
    }
  }

  /**
   * Verifica o status da API
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Busca todas as coleções
   */
  async getCollections(): Promise<STACCollection[]> {
    try {
      const data = await this.fetchWithCache(`${this.baseUrl}/collections`)
      return data.collections || []
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  }

  /**
   * Busca uma coleção específica
   */
  async getCollection(collectionId: string): Promise<STACCollection | null> {
    try {
      const data = await this.fetchWithCache(`${this.baseUrl}/collections/${collectionId}`)
      return data
    } catch (error) {
      console.error(`Error fetching collection ${collectionId}:`, error)
      return null
    }
  }

  /**
   * Busca items de uma coleção
   */
  async searchItems(params: {
    collections?: string[]
    datetime?: string
    bbox?: number[]
    limit?: number
    page?: number
  }): Promise<{ features: STACItem[], numberMatched?: number }> {
    try {
      const searchParams = new URLSearchParams()
      
      if (params.collections?.length) {
        searchParams.append('collections', params.collections.join(','))
      }
      if (params.datetime) {
        searchParams.append('datetime', params.datetime)
      }
      if (params.bbox?.length === 4) {
        searchParams.append('bbox', params.bbox.join(','))
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString())
      }
      if (params.page) {
        searchParams.append('page', params.page.toString())
      }
      
      const url = `${this.baseUrl}/search?${searchParams.toString()}`
      const data = await this.fetchWithCache(url)
      
      return {
        features: data.features || [],
        numberMatched: data.numberMatched
      }
    } catch (error) {
      console.error('Error searching items:', error)
      return { features: [] }
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Clientes pré-configurados para APIs conhecidas
export const stacClients = {
  planetaryComputer: new STACApiClient('https://planetarycomputer.microsoft.com/api/stac/v1'),
  earthSearch: new STACApiClient('https://earth-search.aws.element84.com/v1'),
  bgappStac: new STACApiClient('https://bgapp-api.majearcasa.workers.dev/stac'),
  // Brazil Data Cube requer autenticação, deixar comentado por enquanto
  // brazilDataCube: new STACApiClient('https://brazildatacube.dpi.inpe.br/stac')
}

// Função helper para buscar coleções oceanográficas
export async function getOceanCollections(client: STACApiClient): Promise<STACCollection[]> {
  const collections = await client.getCollections()
  
  // Filtrar coleções relacionadas ao oceano
  const oceanKeywords = ['ocean', 'marine', 'sea', 'sst', 'chlorophyll', 'coastal', 'reef', 'bathymetry']
  
  return collections.filter(collection => {
    const title = collection.title?.toLowerCase() || ''
    const description = collection.description?.toLowerCase() || ''
    const keywords = collection.keywords?.map(k => k.toLowerCase()) || []
    
    return oceanKeywords.some(keyword => 
      title.includes(keyword) || 
      description.includes(keyword) ||
      keywords.includes(keyword)
    )
  })
}
