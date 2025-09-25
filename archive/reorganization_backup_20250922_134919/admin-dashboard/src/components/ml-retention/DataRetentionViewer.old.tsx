/**
 * 📊 Data Retention Viewer
 * Visualizador de dados retidos no sistema ML com filtros e paginação
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  MapPin,
  Zap,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings
} from 'lucide-react';

interface RetainedDataRecord {
  id: string;
  table_name: string;
  data_type: string;
  created_at: string;
  last_accessed: string;
  access_count: number;
  size_mb: number;
  quality_score: number;
  retention_days: number;
  status: 'active' | 'archived' | 'expired';
  metadata: Record<string, any>;
}

interface DataViewerProps {
  onRefresh?: () => void;
}

const DataRetentionViewer: React.FC<DataViewerProps> = ({ onRefresh }) => {
  const [data, setData] = useState<RetainedDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<keyof RetainedDataRecord>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<RetainedDataRecord | null>(null);

  // Mock data - em produção viria da API
  useEffect(() => {
    const generateMockData = (): RetainedDataRecord[] => {
      const tables = ['ml_feature_store', 'ml_training_cache', 'ml_inference_cache', 'aggregated_time_series'];
      const dataTypes = ['temporal', 'spatial', 'environmental', 'species', 'training_set', 'prediction', 'aggregation'];
      const statuses: ('active' | 'archived' | 'expired')[] = ['active', 'active', 'active', 'archived', 'expired'];
      
      return Array.from({ length: 150 }, (_, i) => {
        const table = tables[Math.floor(Math.random() * tables.length)];
        const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
        const createdDaysAgo = Math.floor(Math.random() * 365);
        const lastAccessedDaysAgo = Math.floor(Math.random() * createdDaysAgo);
        
        return {
          id: `ret_${Date.now()}_${i}`,
          table_name: table,
          data_type: dataType,
          created_at: new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
          last_accessed: new Date(Date.now() - lastAccessedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
          access_count: Math.floor(Math.random() * 100) + 1,
          size_mb: Math.round((Math.random() * 50 + 0.1) * 100) / 100,
          quality_score: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100,
          retention_days: [30, 90, 180, 365, 730][Math.floor(Math.random() * 5)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          metadata: {
            source_study_id: `study_${Math.floor(Math.random() * 1000)}`,
            latitude: -12.5 + (Math.random() - 0.5) * 10,
            longitude: 18.3 + (Math.random() - 0.5) * 10,
            features_count: Math.floor(Math.random() * 20) + 5,
            model_type: ['biodiversity_predictor', 'species_classifier', 'environmental_model'][Math.floor(Math.random() * 3)]
          }
        };
      });
    };

    setLoading(true);
    // Simular delay de API
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1000);
  }, []);

  // Filtros e ordenação
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filtro por tabela
    if (selectedTable !== 'all') {
      filtered = filtered.filter(record => record.table_name === selectedTable);
    }

    // Filtro por pesquisa
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.data_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(record.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    return filtered;
  }, [data, selectedTable, searchTerm, sortField, sortDirection]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (field: keyof RetainedDataRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getTableIcon = (tableName: string) => {
    const icons = {
      ml_feature_store: <Database className="h-4 w-4" />,
      ml_training_cache: <Zap className="h-4 w-4" />,
      ml_inference_cache: <Eye className="h-4 w-4" />,
      aggregated_time_series: <HardDrive className="h-4 w-4" />
    };
    return icons[tableName as keyof typeof icons] || <Database className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (sizeMb: number) => {
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(1)} KB`;
    if (sizeMb < 1024) return `${sizeMb.toFixed(1)} MB`;
    return `${(sizeMb / 1024).toFixed(1)} GB`;
  };

  const uniqueTables = Array.from(new Set(data.map(record => record.table_name)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">📊 Viewer de Dados Retidos</h2>
          <p className="text-muted-foreground">
            Visualização detalhada dos {filteredAndSortedData.length} registos retidos no sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Filtro por Tabela */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tabela</label>
              <select 
                value={selectedTable} 
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todas as Tabelas</option>
                {uniqueTables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>

            {/* Pesquisa */}
            <div>
              <label className="text-sm font-medium mb-2 block">Pesquisar</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ID, tipo, metadados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 border rounded-md"
                />
              </div>
            </div>

            {/* Tamanho da Página */}
            <div>
              <label className="text-sm font-medium mb-2 block">Registos por Página</label>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Estatísticas */}
            <div>
              <label className="text-sm font-medium mb-2 block">Estatísticas</label>
              <div className="text-sm text-muted-foreground">
                <div>Total: {data.length}</div>
                <div>Filtrados: {filteredAndSortedData.length}</div>
                <div>Páginas: {totalPages}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Retidos</CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages} • {filteredAndSortedData.length} registos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('table_name')}>
                        <div className="flex items-center space-x-1">
                          <span>Tabela</span>
                          {sortField === 'table_name' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('data_type')}>
                        <div className="flex items-center space-x-1">
                          <span>Tipo</span>
                          {sortField === 'data_type' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center space-x-1">
                          <span>Criado</span>
                          {sortField === 'created_at' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('access_count')}>
                        <div className="flex items-center space-x-1">
                          <span>Acessos</span>
                          {sortField === 'access_count' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('size_mb')}>
                        <div className="flex items-center space-x-1">
                          <span>Tamanho</span>
                          {sortField === 'size_mb' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('quality_score')}>
                        <div className="flex items-center space-x-1">
                          <span>Qualidade</span>
                          {sortField === 'quality_score' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('status')}>
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortField === 'status' && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            {getTableIcon(record.table_name)}
                            <span className="font-medium text-xs">
                              {record.table_name.replace('ml_', '')}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {record.data_type}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {formatDate(record.created_at)}
                        </td>
                        <td className="p-2 text-center">
                          <span className="font-medium">{record.access_count}</span>
                        </td>
                        <td className="p-2 text-xs">
                          {formatSize(record.size_mb)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${record.quality_score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs">{(record.quality_score * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-2">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de {filteredAndSortedData.length} registos
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Seguinte
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Registo</h3>
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="font-mono text-sm">{selectedRecord.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tabela</label>
                  <p>{selectedRecord.table_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Dados</label>
                  <p>{selectedRecord.data_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{getStatusBadge(selectedRecord.status)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                  <p>{formatDate(selectedRecord.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Último Acesso</label>
                  <p>{formatDate(selectedRecord.last_accessed)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contagem de Acessos</label>
                  <p>{selectedRecord.access_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tamanho</label>
                  <p>{formatSize(selectedRecord.size_mb)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Score de Qualidade</label>
                  <p>{(selectedRecord.quality_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Retenção (dias)</label>
                  <p>{selectedRecord.retention_days}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Metadados</label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedRecord.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRetentionViewer;
