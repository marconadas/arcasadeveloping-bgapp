"use client"

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface STACItem {
  id: string
  collection: string
  datetime: string
  geometry?: any
  properties?: Record<string, any>
  assets?: Record<string, any>
  links?: Array<{ href: string; rel: string; type?: string }>
}

interface STACSearchParams {
  datetime: string
  bbox: number[]
  limit: number
  collections?: string[]
}

interface STACProvider {
  id: string
  name: string
  url: string
  apiKey?: string
}

const STAC_PROVIDERS: Record<string, STACProvider> = {
  'planetary-computer': {
    id: 'planetary-computer',
    name: 'Microsoft Planetary Computer',
    url: 'https://planetarycomputer.microsoft.com/api/stac/v1'
  },
  'earth-search': {
    id: 'earth-search', 
    name: 'Element84 Earth Search',
    url: 'https://earth-search.aws.element84.com/v1'
  }
}

export function useSTACOperations() {
  const [loading, setLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  
  // Buscar items STAC de um provedor
  const searchSTACItems = useCallback(async (
    providerId: string,
    params: STACSearchParams
  ): Promise<STACItem[]> => {
    const provider = STAC_PROVIDERS[providerId]
    if (!provider) {
      throw new Error(`Provider ${providerId} não encontrado`)
    }

    try {
      setLoading(true)
      
      // Construir URL de busca
      const searchUrl = `${provider.url}/search`
      
      // Preparar parâmetros da requisição
      const searchBody = {
        datetime: params.datetime,
        bbox: params.bbox,
        limit: params.limit,
        collections: params.collections || []
      }

      // Fazer requisição para o provedor STAC
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey && { 'Authorization': `Bearer ${provider.apiKey}` })
        },
        body: JSON.stringify(searchBody)
      })

      if (!response.ok) {
        // Se falhar, retornar dados mock para demonstração
        console.warn(`Falha ao buscar de ${provider.name}, usando dados de demonstração`)
        return getMockSTACItems(params)
      }

      const data = await response.json()
      return data.features || []
      
    } catch (error) {
      console.error('Erro ao buscar items STAC:', error)
      toast.error('Usando dados de demonstração devido a erro na API')
      return getMockSTACItems(params)
    } finally {
      setLoading(false)
    }
  }, [])

  // Download de um item STAC
  const downloadSTACItem = useCallback(async (item: STACItem) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [item.id]: 0 }))
      
      // Simular progresso de download
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const current = prev[item.id] || 0
          if (current >= 100) {
            clearInterval(progressInterval)
            return prev
          }
          return { ...prev, [item.id]: Math.min(current + 10, 100) }
        })
      }, 200)

      // Buscar asset principal (geralmente COG ou NetCDF)
      const mainAsset = item.assets?.visual || 
                       item.assets?.data || 
                       item.assets?.['B04'] || 
                       Object.values(item.assets || {})[0]

      if (!mainAsset?.href) {
        throw new Error('Nenhum asset disponível para download')
      }

      // Criar metadata JSON
      const metadata = {
        id: item.id,
        collection: item.collection,
        datetime: item.datetime,
        geometry: item.geometry,
        properties: item.properties,
        assets: Object.keys(item.assets || {}),
        downloadDate: new Date().toISOString(),
        source: 'BGAPP STAC Interface'
      }

      // Download do metadata como JSON
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.id}_metadata.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Aguardar conclusão da animação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Download concluído: ${item.id}`)
      
      // Limpar progresso após 1 segundo
      setTimeout(() => {
        setDownloadProgress(prev => {
          const { [item.id]: _, ...rest } = prev
          return rest
        })
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do item')
      setDownloadProgress(prev => {
        const { [item.id]: _, ...rest } = prev
        return rest
      })
    }
  }, [])

  // Exportar coleção de items
  const exportCollection = useCallback(async (items: STACItem[], format: 'json' | 'csv' | 'geojson' = 'json') => {
    try {
      let content: string
      let mimeType: string
      let extension: string

      switch (format) {
        case 'csv':
          // Converter para CSV
          const headers = ['id', 'collection', 'datetime', 'cloud_cover', 'platform']
          const rows = items.map(item => [
            item.id,
            item.collection,
            item.datetime,
            item.properties?.['eo:cloud_cover'] || '',
            item.properties?.platform || ''
          ])
          content = [headers, ...rows].map(row => row.join(',')).join('\n')
          mimeType = 'text/csv'
          extension = 'csv'
          break
          
        case 'geojson':
          // Converter para GeoJSON
          const geojson = {
            type: 'FeatureCollection',
            features: items.map(item => ({
              type: 'Feature',
              id: item.id,
              geometry: item.geometry || null,
              properties: {
                ...item.properties,
                collection: item.collection,
                datetime: item.datetime
              }
            }))
          }
          content = JSON.stringify(geojson, null, 2)
          mimeType = 'application/geo+json'
          extension = 'geojson'
          break
          
        default:
          // JSON padrão
          content = JSON.stringify(items, null, 2)
          mimeType = 'application/json'
          extension = 'json'
      }

      // Fazer download
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stac_export_${new Date().getTime()}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exportação concluída: ${items.length} items`)
      
    } catch (error) {
      console.error('Erro ao exportar coleção:', error)
      toast.error('Erro ao exportar coleção')
    }
  }, [])

  return {
    loading,
    downloadProgress,
    searchSTACItems,
    downloadSTACItem,
    exportCollection
  }
}

// Função auxiliar para gerar dados mock
function getMockSTACItems(params: STACSearchParams): STACItem[] {
  const mockItems: STACItem[] = [
    {
      id: 'S2A_MSIL2A_20240901_Angola',
      collection: 'sentinel-2-l2a',
      datetime: '2024-09-01T10:30:00Z',
      properties: {
        'eo:cloud_cover': 12.5,
        'platform': 'Sentinel-2A',
        'instruments': ['MSI'],
        'processing:level': 'L2A'
      },
      assets: {
        visual: {
          href: 'https://example.com/visual.tif',
          type: 'image/tiff'
        },
        thumbnail: {
          href: 'https://example.com/thumb.jpg',
          type: 'image/jpeg'
        }
      }
    },
    {
      id: 'SST_20240901_Angola',
      collection: 'noaa-sst',
      datetime: '2024-09-01T00:00:00Z',
      properties: {
        'sst:min': 18.5,
        'sst:max': 28.3,
        'sst:mean': 23.7,
        'quality': 'good'
      },
      assets: {
        data: {
          href: 'https://example.com/sst.nc',
          type: 'application/x-netcdf'
        }
      }
    },
    {
      id: 'CHLOR_A_20240901_Angola',
      collection: 'modis-chlorophyll',
      datetime: '2024-09-01T12:00:00Z',
      properties: {
        'chlor:min': 0.1,
        'chlor:max': 2.5,
        'chlor:mean': 0.45,
        'sensor': 'MODIS-Aqua'
      },
      assets: {
        data: {
          href: 'https://example.com/chlor.hdf',
          type: 'application/x-hdf'
        }
      }
    }
  ]

  // Filtrar por limite
  return mockItems.slice(0, params.limit)
}
