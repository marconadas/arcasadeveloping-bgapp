"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Map, 
  Settings, 
  BarChart3, 
  Layers,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { BGAPPMap, MapTemplate, MapCreationRequest } from '@/types';

interface MapsManagementProps {
  className?: string;
}

export function MapsManagement({ className }: MapsManagementProps) {
  // Estados
  const [maps, setMaps] = useState<BGAPPMap[]>([]);
  const [templates, setTemplates] = useState<MapTemplate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [baseLayers, setBaseLayers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<BGAPPMap | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Estados do formulário
  const [formData, setFormData] = useState<Partial<MapCreationRequest>>({
    name: '',
    description: '',
    category: '',
    configuration: {
      center: [-12.5, 13.5], // Centro de Angola
      zoom: 6,
      baseLayers: ['osm'],
      defaultBaseLayer: 'osm'
    },
    layers: []
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [mapsResponse, templatesResponse, categoriesResponse, baseLayersResponse, statsResponse] = await Promise.all([
        api.getMaps(),
        api.getMapTemplates(),
        api.getMapCategories(),
        api.getBaseLayers(),
        api.getMapStats()
      ]);

      if (mapsResponse.success) {
        setMaps(mapsResponse.data || []);
      }
      
      if (templatesResponse.success) {
        setTemplates(templatesResponse.data || []);
      }
      
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }
      
      if (baseLayersResponse.success) {
        setBaseLayers(baseLayersResponse.data || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados dos mapas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar mapas
  const filteredMaps = maps.filter(map => {
    const matchesSearch = map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         map.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || map.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || map.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Criar novo mapa
  const handleCreateMap = async () => {
    try {
      if (!formData.name || !formData.category) {
        toast.error('Nome e categoria são obrigatórios');
        return;
      }

      const response = await api.createMap(formData as MapCreationRequest);
      
      if (response.success) {
        toast.success('Mapa criado com sucesso!');
        setIsCreateDialogOpen(false);
        resetForm();
        loadInitialData();
      }
    } catch (error) {
      console.error('Erro ao criar mapa:', error);
      toast.error('Erro ao criar mapa');
    }
  };

  // Atualizar mapa
  const handleUpdateMap = async () => {
    try {
      if (!selectedMap) return;

      const response = await api.updateMap(selectedMap.id, formData);
      
      if (response.success) {
        toast.success('Mapa atualizado com sucesso!');
        setIsEditDialogOpen(false);
        setSelectedMap(null);
        resetForm();
        loadInitialData();
      }
    } catch (error) {
      console.error('Erro ao atualizar mapa:', error);
      toast.error('Erro ao atualizar mapa');
    }
  };

  // Deletar mapa
  const handleDeleteMap = async (mapId: string) => {
    try {
      const response = await api.deleteMap(mapId);
      
      if (response.success) {
        toast.success('Mapa deletado com sucesso!');
        loadInitialData();
      }
    } catch (error) {
      console.error('Erro ao deletar mapa:', error);
      toast.error('Erro ao deletar mapa');
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      configuration: {
        center: [-12.5, 13.5],
        zoom: 6,
        baseLayers: ['osm'],
        defaultBaseLayer: 'osm'
      },
      layers: []
    });
  };

  // Abrir modal de edição
  const openEditDialog = (map: BGAPPMap) => {
    setSelectedMap(map);
    setFormData({
      name: map.name,
      description: map.description,
      category: map.category,
      configuration: map.configuration || {
        center: [-12.5, 13.5],
        zoom: 6,
        baseLayers: ['osm'],
        defaultBaseLayer: 'osm'
      },
      layers: []
    });
    setIsEditDialogOpen(true);
  };

  // Obter ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mapas</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_maps || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapas Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active_maps || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Gestão de Mapas</CardTitle>
              <CardDescription>
                Gerir todos os mapas do sistema BGAPP
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mapa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Mapa</DialogTitle>
                  <DialogDescription>
                    Configure um novo mapa para o sistema BGAPP
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Mapa</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Mapa Oceanográfico Angola"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={formData.category || ''} 
                        onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
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
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição detalhada do mapa..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMap}>
                    Criar Mapa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar mapas..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Lista de mapas */}
          <div className="grid gap-4">
            {filteredMaps.length === 0 ? (
              <div className="text-center py-8">
                <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum mapa encontrado</p>
              </div>
            ) : (
              filteredMaps.map((map) => (
                <Card key={map.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{map.icon}</div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{map.name}</h3>
                            {getStatusIcon(map.status)}
                            <Badge className={getStatusColor(map.status)}>
                              {map.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{map.description}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Categoria: {categories.find(c => c.id === map.category)?.name || map.category}</span>
                            <span>•</span>
                            <span>Atualizado: {new Date(map.last_updated).toLocaleDateString('pt-PT')}</span>
                            <span>•</span>
                            <span>{map.features.length} funcionalidades</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={map.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(map)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteMap(map.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Mapa</DialogTitle>
            <DialogDescription>
              Atualizar configurações do mapa {selectedMap?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Mapa</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateMap}>
              Atualizar Mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
