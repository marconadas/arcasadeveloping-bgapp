/**
 * Data Retention Viewer - Versão com Dados Reais
 * Substitui completamente o mock data por integração com API
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Database,
  Calendar,
  HardDrive,
  Activity,
  Search,
  Filter,
  Download,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  MoreVertical,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Importar serviço de dados real
import mlRetentionService, { RetainedDataRecord } from '@/services/data/MLRetentionService';

interface DataViewerProps {
  onRefresh?: () => void;
}

const DataRetentionViewerReal: React.FC<DataViewerProps> = ({ onRefresh }) => {
  // Estados principais
  const [data, setData] = useState<RetainedDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<keyof RetainedDataRecord>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRecord, setSelectedRecord] = useState<RetainedDataRecord | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [recordDetails, setRecordDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Buscar dados reais da API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await mlRetentionService.getRetainedData({
        table: selectedTable === 'all' ? undefined : selectedTable,
        search: searchTerm || undefined,
        page: currentPage,
        pageSize,
        sortField,
        sortDirection
      });

      if (response.success && response.data) {
        setData(response.data.records);
        setTotalRecords(response.data.total);
      } else {
        throw new Error(response.error || 'Falha ao buscar dados');
      }
    } catch (err) {
      console.error('Erro ao buscar dados de retenção:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados de retenção');
    } finally {
      setLoading(false);
    }
  }, [selectedTable, searchTerm, currentPage, pageSize, sortField, sortDirection]);

  // Buscar dados ao montar e quando parâmetros mudarem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success('Dados atualizados com sucesso');
    onRefresh?.();
  };

  // Buscar detalhes de um registro
  const fetchRecordDetails = async (recordId: string) => {
    try {
      setLoadingDetails(true);
      const response = await mlRetentionService.getRecordDetails(recordId);
      
      if (response.success && response.data) {
        setRecordDetails(response.data);
        setShowDetailsDialog(true);
      } else {
        toast.error('Erro ao buscar detalhes do registro');
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      toast.error('Falha ao carregar detalhes');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Arquivar registros selecionados
  const handleArchiveSelected = async () => {
    if (selectedRecords.size === 0) {
      toast.warning('Selecione registros para arquivar');
      return;
    }

    try {
      const response = await mlRetentionService.archiveRecords(Array.from(selectedRecords));
      
      if (response.success) {
        toast.success(`${response.data?.archived_count} registros arquivados`);
        setSelectedRecords(new Set());
        await fetchData();
      } else {
        toast.error('Erro ao arquivar registros');
      }
    } catch (err) {
      console.error('Erro ao arquivar:', err);
      toast.error('Falha na operação de arquivamento');
    }
  };

  // Exportar dados
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const response = await mlRetentionService.exportData({
        format,
        filters: {
          table: selectedTable === 'all' ? undefined : selectedTable,
          search: searchTerm || undefined
        }
      });

      if (response.success && response.data) {
        window.open(response.data.download_url, '_blank');
        toast.success(`Exportação ${format.toUpperCase()} iniciada`);
      } else {
        toast.error('Erro ao exportar dados');
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Falha na exportação');
    }
  };

  // Toggle seleção de registro
  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  // Selecionar todos os registros da página
  const toggleSelectAll = () => {
    if (selectedRecords.size === data.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(data.map(r => r.id)));
    }
  };

  // Cálculo de paginação
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Renderizar status badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      archived: 'secondary',
      expired: 'destructive'
    };

    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      archived: <Archive className="h-3 w-3 mr-1" />,
      expired: <AlertCircle className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  // Renderizar score de qualidade
  const renderQualityScore = (score: number) => {
    const percentage = score * 100;
    const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
    
    return (
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="w-16 h-2" />
        <span className={`text-sm font-medium ${color}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    );
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formatar tamanho
  const formatSize = (sizeMb: number) => {
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(2)} KB`;
    if (sizeMb < 1024) return `${sizeMb.toFixed(2)} MB`;
    return `${(sizeMb / 1024).toFixed(2)} GB`;
  };

  // Loading skeleton
  if (loading && data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Visualizador de Dados Retidos
            </CardTitle>
            <CardDescription>
              Gerenciamento de dados ML em cache e armazenamento
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar dados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Exportar como CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Exportar como JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Exportar como Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtros e busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecionar tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tabelas</SelectItem>
              <SelectItem value="ml_feature_store">Feature Store</SelectItem>
              <SelectItem value="ml_training_cache">Training Cache</SelectItem>
              <SelectItem value="ml_inference_cache">Inference Cache</SelectItem>
              <SelectItem value="aggregated_time_series">Time Series</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID, tipo ou metadata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / página</SelectItem>
              <SelectItem value="20">20 / página</SelectItem>
              <SelectItem value="50">50 / página</SelectItem>
              <SelectItem value="100">100 / página</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ações em lote */}
        {selectedRecords.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedRecords.size} registro(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleArchiveSelected}
              >
                <Archive className="h-4 w-4 mr-1" />
                Arquivar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRecords(new Set())}
              >
                Limpar seleção
              </Button>
            </div>
          </div>
        )}

        {/* Tabela de dados */}
        <div className="rounded-lg border">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRecords.size === data.length && data.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSortField('table_name');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Tabela
                  </TableHead>
                  <TableHead>Tipo de Dados</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSortField('created_at');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Criado em
                  </TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-center">Acessos</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => (
                  <TableRow 
                    key={record.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => toggleRecordSelection(record.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        {record.table_name.replace('ml_', '').replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.data_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(record.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(record.last_accessed)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">{record.access_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{formatSize(record.size_mb)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{renderQualityScore(record.quality_score)}</TableCell>
                    <TableCell>{renderStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => fetchRecordDetails(record.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveSelected()}>
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Mostrando {startRecord} a {endRecord} de {totalRecords} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
              {totalPages > 5 && (
                <Button
                  variant={currentPage === totalPages ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Dialog de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              Informações completas sobre o registro de dados retido
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : recordDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-sm">{recordDetails.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tabela</label>
                  <p className="text-sm">{recordDetails.table_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Dados</label>
                  <p className="text-sm">{recordDetails.data_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm">{recordDetails.status}</p>
                </div>
              </div>

              {recordDetails.access_history && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Histórico de Acesso</h4>
                  <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {recordDetails.access_history.map((access: any, idx: number) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span>{access.action}</span>
                        <span className="text-gray-500">{formatDate(access.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recordDetails.related_models && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Modelos Relacionados</h4>
                  <div className="flex flex-wrap gap-2">
                    {recordDetails.related_models.map((model: string) => (
                      <Badge key={model} variant="secondary">{model}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DataRetentionViewerReal;
