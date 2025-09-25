"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Layers, 
  Satellite, 
  Map, 
  Download, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Navigation,
  Thermometer
} from 'lucide-react'

interface MapViewerProps {
  items?: any[]
  center?: [number, number]
  zoom?: number
  onItemClick?: (item: any) => void
}

export function STACMapViewer({ 
  items = [], 
  center = [-12.0, 13.0], // Centro de Angola
  zoom = 6,
  onItemClick 
}: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<'streets' | 'satellite' | 'ocean'>('ocean')
  const [showHeatmap, setShowHeatmap] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    // Importar Leaflet dinamicamente
    const initMap = async () => {
      try {
        // Criar elemento para carregar CSS do Leaflet
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // Aguardar CSS carregar
        await new Promise(resolve => {
          link.onload = resolve
          setTimeout(resolve, 1000) // Timeout de segurança
        })

        // Importar Leaflet JS
        const L = (window as any).L || await import('leaflet').then(m => m.default)
        
        if (!L) {
          console.error('Leaflet não pôde ser carregado')
          return
        }

        // Configurar ícones padrão do Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Criar mapa
        const map = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: false
        })

        // Adicionar controle de zoom customizado
        L.control.zoom({
          position: 'topright'
        }).addTo(map)

        // Camadas base
        const layers: Record<string, any> = {
          streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }),
          satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
          }),
          ocean: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
          })
        }

        // Adicionar camada inicial
        layers[selectedLayer].addTo(map)

        // Adicionar marcadores para Angola
        const angolaMarkers = [
          { name: 'Luanda', coords: [-8.8368, 13.2343], type: 'capital' },
          { name: 'Porto de Lobito', coords: [-12.3644, 13.5456], type: 'port' },
          { name: 'Namibe', coords: [-15.1961, 12.1522], type: 'port' },
          { name: 'Cabinda', coords: [-5.5500, 12.2000], type: 'port' },
          { name: 'Soyo', coords: [-6.1349, 12.3658], type: 'port' }
        ]

        angolaMarkers.forEach(marker => {
          const icon = marker.type === 'capital' 
            ? L.divIcon({
                html: '<div style="background: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [12, 12],
                className: 'custom-marker'
              })
            : L.divIcon({
                html: '<div style="background: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [10, 10],
                className: 'custom-marker'
              })

          L.marker(marker.coords as [number, number], { icon })
            .bindPopup(`<strong>${marker.name}</strong><br/>Tipo: ${marker.type === 'capital' ? 'Capital' : 'Porto'}`)
            .addTo(map)
        })

        // Adicionar área da ZEE de Angola
        const angolaEEZ = [
          [-4.5, 11.0],
          [-4.5, 14.0],
          [-18.0, 14.0],
          [-18.0, 11.0],
          [-4.5, 11.0]
        ]

        L.polygon(angolaEEZ as [number, number][], {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.6,
          fillColor: '#3b82f6',
          fillOpacity: 0.1
        }).addTo(map).bindPopup('Zona Económica Exclusiva de Angola')

        // Adicionar items STAC se disponíveis
        if (items && items.length > 0) {
          items.forEach(item => {
            if (item.geometry && item.geometry.type === 'Polygon') {
              const coords = item.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])
              L.polygon(coords, {
                color: '#10b981',
                weight: 2,
                opacity: 0.8,
                fillColor: '#10b981',
                fillOpacity: 0.3
              })
              .bindPopup(`
                <strong>${item.id}</strong><br/>
                Coleção: ${item.collection}<br/>
                Data: ${new Date(item.datetime).toLocaleDateString()}
              `)
              .on('click', () => onItemClick && onItemClick(item))
              .addTo(map)
            }
          })
        }

        // Guardar referências
        mapRef.current = { map, layers, L }
        setMapLoaded(true)

      } catch (error) {
        console.error('Erro ao inicializar mapa:', error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapRef.current?.map) {
        mapRef.current.map.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Atualizar camada quando selectedLayer mudar
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const { map, layers } = mapRef.current
    
    // Remover todas as camadas base
    Object.values(layers).forEach((layer: any) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    })

    // Adicionar nova camada
    layers[selectedLayer].addTo(map)
  }, [selectedLayer, mapLoaded])

  // Funções de controle do mapa
  const handleZoomIn = () => {
    if (mapRef.current?.map) {
      mapRef.current.map.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current?.map) {
      mapRef.current.map.zoomOut()
    }
  }

  const handleFullscreen = () => {
    if (mapContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        mapContainerRef.current.requestFullscreen()
      }
    }
  }

  const handleExportMap = () => {
    if (!mapRef.current?.map) return

    // Aqui poderia implementar exportação real do mapa
    // Por enquanto, apenas mostrar mensagem
    const bounds = mapRef.current.map.getBounds()
    console.log('Exportar mapa com bounds:', bounds)
    alert('Funcionalidade de exportação será implementada em breve!')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Visualização Geoespacial
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={mapLoaded ? "default" : "secondary"}>
              {mapLoaded ? "Mapa Carregado" : "Carregando..."}
            </Badge>
            {items.length > 0 && (
              <Badge variant="outline">
                {items.length} items
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Container do Mapa */}
          <div 
            ref={mapContainerRef}
            className="w-full h-[500px] bg-slate-100 dark:bg-slate-800 rounded-b-lg"
            style={{ zIndex: 1 }}
          />

          {/* Controles do Mapa */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-1 flex flex-col gap-1">
              <Button
                size="sm"
                variant={selectedLayer === 'ocean' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => setSelectedLayer('ocean')}
              >
                <Map className="h-4 w-4 mr-2" />
                Oceano
              </Button>
              <Button
                size="sm"
                variant={selectedLayer === 'satellite' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => setSelectedLayer('satellite')}
              >
                <Satellite className="h-4 w-4 mr-2" />
                Satélite
              </Button>
              <Button
                size="sm"
                variant={selectedLayer === 'streets' ? 'default' : 'ghost'}
                className="justify-start"
                onClick={() => setSelectedLayer('streets')}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Ruas
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-1 flex flex-col gap-1">
              <Button
                size="sm"
                variant={showHeatmap ? 'default' : 'ghost'}
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Thermometer className="h-4 w-4 mr-2" />
                Heatmap
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportMap}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Controles de Zoom Adicionais */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Indicador de carregamento */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Carregando mapa interativo...</p>
              </div>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Portos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-muted-foreground">Capital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Dados STAC</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Powered by Leaflet | Dados: OpenStreetMap, Esri
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
