"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Wand2, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lightbulb,
  Zap,
  Eye,
  Settings,
  Layers,
  MapPin,
  Palette,
  Code,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface MapCreatorToolsProps {
  className?: string;
  onMapCreated?: (mapData: any) => void;
}

interface MapConfiguration {
  name: string;
  description: string;
  category: string;
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [[number, number], [number, number]];
  baseLayers: string[];
  defaultBaseLayer: string;
  controls: {
    zoom: boolean;
    scale: boolean;
    fullscreen: boolean;
    layers: boolean;
    search: boolean;
    coordinates: boolean;
    measurement: boolean;
    drawing: boolean;
    export: boolean;
  };
  layers: any[];
}

export function MapCreatorTools({ className, onMapCreated }: MapCreatorToolsProps) {
  // Estados
  const [categories, setCategories] = useState<any[]>([]);
  const [baseLayers, setBaseLayers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [suggestedLayers, setSuggestedLayers] = useState<any[]>([]);
  
  // Configuração do mapa
  const [config, setConfig] = useState<MapConfiguration>({
    name: '',
    description: '',
    category: '',
    center: [-12.5, 13.5], // Centro de Angola
    zoom: 6,
    minZoom: 1,
    maxZoom: 18,
    bounds: [[-18.2, 8.5], [-4.2, 17.5]], // Bounds de Angola
    baseLayers: ['osm'],
    defaultBaseLayer: 'osm',
    controls: {
      zoom: true,
      scale: true,
      fullscreen: true,
      layers: true,
      search: false,
      coordinates: false,
      measurement: false,
      drawing: false,
      export: false
    },
    layers: []
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [categoriesResponse, baseLayersResponse, templatesResponse] = await Promise.all([
        api.getMapCategories(),
        api.getBaseLayers(),
        api.getMapTemplates()
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }
      
      if (baseLayersResponse.success) {
        setBaseLayers(baseLayersResponse.data || []);
      }
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados das ferramentas');
    }
  };

  // Validar configuração
  const validateConfiguration = async () => {
    try {
      setLoading(true);
      const response = await api.validateMapConfig(config);
      
      if (response.success) {
        setValidationResult(response.data);
        
        if (response.data.valid) {
          toast.success('Configuração válida!');
        } else {
          toast.warning('Configuração com problemas');
        }
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      toast.error('Erro ao validar configuração');
    } finally {
      setLoading(false);
    }
  };

  // Otimizar configuração
  const optimizeConfiguration = async () => {
    try {
      setLoading(true);
      const response = await api.optimizeMapConfig(config);
      
      if (response.success) {
        setOptimizationResult(response.data);
        
        // Aplicar otimizações automaticamente
        if (response.data.config) {
          setConfig(prev => ({ ...prev, ...response.data.config }));
          toast.success('Configuração otimizada!');
        }
      }
    } catch (error) {
      console.error('Erro na otimização:', error);
      toast.error('Erro ao otimizar configuração');
    } finally {
      setLoading(false);
    }
  };

  // Sugerir camadas por categoria
  const suggestLayersForCategory = async (category: string) => {
    try {
      const response = await api.suggestLayers(category);
      
      if (response.success) {
        setSuggestedLayers(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao sugerir camadas:', error);
      toast.error('Erro ao sugerir camadas');
    }
  };

  // Aplicar template
  const applyTemplate = (template: any) => {
    setConfig(prev => ({
      ...prev,
      ...template.configuration,
      name: prev.name, // Manter nome personalizado
      description: prev.description // Manter descrição personalizada
    }));
    
    // Sugerir camadas para a categoria do template
    if (template.category) {
      suggestLayersForCategory(template.category);
    }
    
    toast.success(`Template "${template.name}" aplicado!`);
  };

  // Criar mapa
  const createMap = async () => {
    try {
      if (!config.name || !config.category) {
        toast.error('Nome e categoria são obrigatórios');
        return;
      }

      setLoading(true);
      
      const mapData = {
        name: config.name,
        description: config.description,
        category: config.category,
        configuration: config,
        layers: config.layers
      };

      const response = await api.createMap(mapData);
      
      if (response.success) {
        toast.success('Mapa criado com sucesso!');
        
        // Resetar formulário
        setConfig({
          name: '',
          description: '',
          category: '',
          center: [-12.5, 13.5],
          zoom: 6,
          minZoom: 1,
          maxZoom: 18,
          bounds: [[-18.2, 8.5], [-4.2, 17.5]],
          baseLayers: ['osm'],
          defaultBaseLayer: 'osm',
          controls: {
            zoom: true,
            scale: true,
            fullscreen: true,
            layers: true,
            search: false,
            coordinates: false,
            measurement: false,
            drawing: false,
            export: false
          },
          layers: []
        });
        
        setValidationResult(null);
        setOptimizationResult(null);
        setSuggestedLayers([]);
        
        // Callback para componente pai
        if (onMapCreated) {
          onMapCreated(response.data);
        }
      }
    } catch (error) {
      console.error('Erro ao criar mapa:', error);
      toast.error('Erro ao criar mapa');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar controles
  const updateControl = (controlName: string, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      controls: {
        ...prev.controls,
        [controlName]: value
      }
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Ferramentas de Criação de Mapas
          </CardTitle>
          <CardDescription>
            Ferramentas avançadas para criar mapas personalizados com configurações otimizadas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="layers">Camadas</TabsTrigger>
              <TabsTrigger value="controls">Controles</TabsTrigger>
              <TabsTrigger value="validation">Validação</TabsTrigger>
            </TabsList>
            
            {/* Configuração Básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="map-name">Nome do Mapa</Label>
                  <Input
                    id="map-name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Mapa Oceanográfico Angola"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="map-category">Categoria</Label>
                  <Select 
                    value={config.category} 
                    onValueChange={(value) => {
                      setConfig(prev => ({ ...prev, category: value }));
                      suggestLayersForCategory(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="map-description">Descrição</Label>
                <Textarea
                  id="map-description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do mapa..."
                  rows={3}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Centro do Mapa (Lat, Lng)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={config.center[0]}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        center: [parseFloat(e.target.value) || 0, prev.center[1]] 
                      }))}
                      placeholder="Latitude"
                      step="0.1"
                    />
                    <Input
                      type="number"
                      value={config.center[1]}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        center: [prev.center[0], parseFloat(e.target.value) || 0] 
                      }))}
                      placeholder="Longitude"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Zoom Inicial</Label>
                  <div className="px-2">
                    <Slider
                      value={[config.zoom]}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, zoom: value[0] }))}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-500 mt-1">
                      Zoom: {config.zoom}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Camada Base Padrão</Label>
                  <Select 
                    value={config.defaultBaseLayer} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, defaultBaseLayer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {baseLayers.map((layer) => (
                        <SelectItem key={layer.id} value={layer.id}>
                          {layer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Templates Disponíveis</h3>
                  <Badge variant="secondary">{templates.length} templates</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline">
                            {categories.find(c => c.id === template.category)?.icon} {template.category}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {template.required_layers.length} camadas obrigatórias
                          </div>
                          <Button size="sm" onClick={() => applyTemplate(template)}>
                            Aplicar Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Camadas */}
            <TabsContent value="layers" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Camadas Sugeridas</h3>
                  {config.category && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => suggestLayersForCategory(config.category)}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Atualizar Sugestões
                    </Button>
                  )}
                </div>
                
                {suggestedLayers.length > 0 ? (
                  <div className="grid gap-3">
                    {suggestedLayers.map((layer, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Layers className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium">{layer.name}</div>
                              <div className="text-sm text-gray-500">
                                Tipo: {layer.type} 
                                {layer.required && (
                                  <Badge variant="destructive" className="ml-2">Obrigatória</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Adicionar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {config.category 
                        ? "Nenhuma camada sugerida para esta categoria"
                        : "Selecione uma categoria para ver sugestões de camadas"
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            {/* Controles */}
            <TabsContent value="controls" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Controles do Mapa</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.controls).map(([controlName, enabled]) => (
                    <div key={controlName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <Label className="capitalize">
                          {controlName.replace('_', ' ')}
                        </Label>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => updateControl(controlName, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Validação */}
            <TabsContent value="validation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Validação e Otimização</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={validateConfiguration}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={optimizeConfiguration}
                      disabled={loading}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Otimizar
                    </Button>
                  </div>
                </div>
                
                {/* Resultado da validação */}
                {validationResult && (
                  <Alert className={validationResult.valid ? "border-green-200" : "border-red-200"}>
                    {validationResult.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription>
                      <div className="font-medium mb-2">
                        {validationResult.valid ? "Configuração Válida" : "Problemas Encontrados"}
                      </div>
                      
                      {validationResult.errors?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-red-600">Erros:</div>
                          <ul className="list-disc list-inside text-sm">
                            {validationResult.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.warnings?.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-yellow-600">Avisos:</div>
                          <ul className="list-disc list-inside text-sm">
                            {validationResult.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.suggestions?.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-blue-600">Sugestões:</div>
                          <ul className="list-disc list-inside text-sm">
                            {validationResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Resultado da otimização */}
                {optimizationResult && (
                  <Alert className="border-blue-200">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Otimizações Aplicadas</div>
                      {optimizationResult.optimizations?.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {optimizationResult.optimizations.map((optimization: string, index: number) => (
                            <li key={index}>{optimization}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm">Nenhuma otimização necessária.</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Botão de criação */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              onClick={createMap} 
              disabled={loading || !config.name || !config.category}
              size="lg"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Criar Mapa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
