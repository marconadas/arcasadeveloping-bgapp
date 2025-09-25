'use client'

import { useState, useEffect, useCallback } from 'react'
import { STACApiClient, STACCollection, STACItem, stacClients } from '@/lib/stac/api-client'

export interface UseSTACOptions {
  provider?: 'planetaryComputer' | 'earthSearch' | 'bgappStac'
  autoLoad?: boolean
}

export interface UseSTACReturn {
  collections: STACCollection[]
  items: STACItem[]
  loading: boolean
  error: string | null
  selectedCollection: STACCollection | null
  loadCollections: () => Promise<void>
  searchItems: (params: {
    collections?: string[]
    datetime?: string
    bbox?: number[]
    limit?: number
  }) => Promise<void>
  selectCollection: (collection: STACCollection) => void
  clearCache: () => void
}

export function useSTAC(options: UseSTACOptions = {}): UseSTACReturn {
  const { provider = 'bgappStac', autoLoad = false } = options
  
  const [collections, setCollections] = useState<STACCollection[]>([])
  const [items, setItems] = useState<STACItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<STACCollection | null>(null)
  
  const client = stacClients[provider]
  
  const loadCollections = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await client.getCollections()
      setCollections(data)
      
      // Se não houver coleções, tentar dados mock
      if (data.length === 0) {
        console.warn('No collections found, using mock data')
        setCollections([
          {
            id: 'zee-angola-sst',
            title: 'ZEE Angola - Temperatura da Superfície do Mar',
            description: 'Dados de temperatura da superfície do mar da Zona Econômica Exclusiva de Angola',
            extent: {
              temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
              spatial: { bbox: [[-20, -20, 20, 5]] }
            },
            links: []
          },
          {
            id: 'zee-angola-chlorophyll',
            title: 'ZEE Angola - Clorofila-a',
            description: 'Concentrações de clorofila-a na costa angolana',
            extent: {
              temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
              spatial: { bbox: [[-20, -20, 20, 5]] }
            },
            links: []
          },
          {
            id: 'zee-angola-biodiversity',
            title: 'ZEE Angola - Biodiversidade Marinha',
            description: 'Dados de biodiversidade e espécies marinhas de Angola',
            extent: {
              temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
              spatial: { bbox: [[-20, -20, 20, 5]] }
            },
            links: []
          }
        ])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar coleções'
      setError(errorMessage)
      console.error('Error loading collections:', err)
      
      // Usar dados mock em caso de erro
      setCollections([
        {
          id: 'zee-angola-sst',
          title: 'ZEE Angola - Temperatura da Superfície do Mar',
          description: 'Dados de temperatura da superfície do mar da Zona Econômica Exclusiva de Angola',
          extent: {
            temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
            spatial: { bbox: [[-20, -20, 20, 5]] }
          },
          links: []
        },
        {
          id: 'zee-angola-chlorophyll',
          title: 'ZEE Angola - Clorofila-a',
          description: 'Concentrações de clorofila-a na costa angolana',
          extent: {
            temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
            spatial: { bbox: [[-20, -20, 20, 5]] }
          },
          links: []
        },
        {
          id: 'zee-angola-biodiversity',
          title: 'ZEE Angola - Biodiversidade Marinha',
          description: 'Dados de biodiversidade e espécies marinhas de Angola',
          extent: {
            temporal: { interval: [['2020-01-01T00:00:00Z', null]] },
            spatial: { bbox: [[-20, -20, 20, 5]] }
          },
          links: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [client])
  
  const searchItems = useCallback(async (params: {
    collections?: string[]
    datetime?: string
    bbox?: number[]
    limit?: number
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await client.searchItems(params)
      setItems(result.features)
      
      // Se não houver items, usar dados mock
      if (result.features.length === 0) {
        console.warn('No items found, using mock data')
        setItems([
          {
            id: 'S2A_MSIL2A_20240901_Angola',
            collection: params.collections?.[0] || 'sentinel-2-l2a',
            datetime: '2024-09-01T10:30:00Z',
            properties: {
              'eo:cloud_cover': 12.5,
              'platform': 'Sentinel-2A',
              'instruments': ['MSI'],
              'processing_level': 'L2A'
            },
            assets: {
              thumbnail: { href: '/api/placeholder/200/200' },
              visual: { href: '/api/placeholder/800/600' }
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[-10, -15], [15, -15], [15, -5], [-10, -5], [-10, -15]]]
            }
          },
          {
            id: 'SST_20240901_Angola',
            collection: params.collections?.[0] || 'noaa-sst',
            datetime: '2024-09-01T00:00:00Z',
            properties: {
              'sst:min': 18.5,
              'sst:max': 28.3,
              'sst:mean': 23.7,
              'quality': 'good'
            },
            assets: {
              data: { href: '/data/sst_20240901.nc' }
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[-10, -18], [14, -18], [14, -4], [-10, -4], [-10, -18]]]
            }
          }
        ])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar items'
      setError(errorMessage)
      console.error('Error searching items:', err)
      
      // Usar dados mock em caso de erro
      setItems([
        {
          id: 'S2A_MSIL2A_20240901_Angola',
          collection: params.collections?.[0] || 'sentinel-2-l2a',
          datetime: '2024-09-01T10:30:00Z',
          properties: {
            'eo:cloud_cover': 12.5,
            'platform': 'Sentinel-2A',
            'instruments': ['MSI'],
            'processing_level': 'L2A'
          },
          assets: {
            thumbnail: { href: '/api/placeholder/200/200' },
            visual: { href: '/api/placeholder/800/600' }
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-10, -15], [15, -15], [15, -5], [-10, -5], [-10, -15]]]
          }
        },
        {
          id: 'SST_20240901_Angola',
          collection: params.collections?.[0] || 'noaa-sst',
          datetime: '2024-09-01T00:00:00Z',
          properties: {
            'sst:min': 18.5,
            'sst:max': 28.3,
            'sst:mean': 23.7,
            'quality': 'good'
          },
          assets: {
            data: { href: '/data/sst_20240901.nc' }
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-10, -18], [14, -18], [14, -4], [-10, -4], [-10, -18]]]
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [client])
  
  const selectCollection = useCallback((collection: STACCollection) => {
    setSelectedCollection(collection)
  }, [])
  
  const clearCache = useCallback(() => {
    client.clearCache()
  }, [client])
  
  // Auto-carregar coleções se configurado
  useEffect(() => {
    if (autoLoad) {
      loadCollections()
    }
  }, [autoLoad, loadCollections])
  
  return {
    collections,
    items,
    loading,
    error,
    selectedCollection,
    loadCollections,
    searchItems,
    selectCollection,
    clearCache
  }
}
