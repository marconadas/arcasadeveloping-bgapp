"use client";

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Ship,
  MapPin,
  Clock,
  Flag,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { GFWVessel } from '@/lib/api-gfw';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VesselListProps {
  vessels: GFWVessel[];
  loading?: boolean;
  onVesselClick: (vessel: GFWVessel) => void;
  totalCount?: number;
  filteredCount?: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function VesselList({
  vessels,
  loading = false,
  onVesselClick,
  totalCount = 0,
  filteredCount = 0
}: VesselListProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25
  });

  // Calculate pagination
  const totalPages = Math.ceil(vessels.length / pagination.pageSize);
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedVessels = vessels.slice(startIndex, endIndex);

  const updatePage = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(newPage, totalPages))
    }));
  };

  const updatePageSize = (newPageSize: number) => {
    setPagination({
      page: 1,
      pageSize: newPageSize
    });
  };

  const getVesselTypeIcon = (type: string) => {
    switch (type) {
      case 'fishing': return '🎣';
      case 'carrier': return '🚢';
      case 'support': return '⚓';
      case 'passenger': return '🛳️';
      default: return '🚤';
    }
  };

  const getVesselTypeLabel = (type: string) => {
    switch (type) {
      case 'fishing': return 'Pesca';
      case 'carrier': return 'Transporte';
      case 'support': return 'Apoio';
      case 'passenger': return 'Passageiros';
      default: return 'Desconhecido';
    }
  };

  const getActivityStatus = (lastTransmissionDate: string) => {
    const lastTransmission = new Date(lastTransmissionDate);
    const now = new Date();
    const daysSinceLastTransmission = Math.floor(
      (now.getTime() - lastTransmission.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastTransmission <= 1) {
      return { status: 'active', label: 'Ativa', color: 'bg-green-500' };
    } else if (daysSinceLastTransmission <= 7) {
      return { status: 'recent', label: 'Recente', color: 'bg-yellow-500' };
    } else {
      return { status: 'inactive', label: 'Inativa', color: 'bg-gray-500' };
    }
  };

  const formatCoordinates = (coordinates?: number[]) => {
    if (!coordinates || coordinates.length < 2) return 'N/A';
    const [lon, lat] = coordinates;
    return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Lista de Embarcações
            {filteredCount !== totalCount && (
              <Badge variant="secondary">
                {filteredCount} de {totalCount}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Itens por página:
            </span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => updatePageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Carregando embarcações...</span>
            </div>
          </div>
        ) : vessels.length === 0 ? (
          <div className="text-center py-8">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Nenhuma Embarcação Encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros para encontrar embarcações específicas.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Embarcação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Bandeira</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Última Transmissão</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVessels.map((vessel) => {
                    const activity = getActivityStatus(vessel.lastTransmissionDate);
                    return (
                      <TableRow
                        key={vessel.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onVesselClick(vessel)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {vessel.name || `Embarcação ${vessel.vesselId}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {vessel.vesselId}
                              {vessel.imo && ` | IMO: ${vessel.imo}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getVesselTypeIcon(vessel.vesselType)}
                            </span>
                            <span className="text-sm">
                              {getVesselTypeLabel(vessel.vesselType)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            <span>{vessel.flag}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">
                              {formatCoordinates(vessel.geom?.coordinates)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`rounded-full p-1 ${activity.color}`}>
                              <Activity className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm">{activity.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {format(new Date(vessel.lastTransmissionDate), 'dd/MM/yyyy', {
                                locale: ptBR
                              })}
                            </div>
                            <div className="text-muted-foreground">
                              {formatDistanceToNow(new Date(vessel.lastTransmissionDate), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onVesselClick(vessel);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {vessel.geom?.coordinates && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `https://www.google.com/maps?q=${vessel.geom?.coordinates[1]},${vessel.geom?.coordinates[0]}`,
                                    '_blank'
                                  );
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedVessels.map((vessel) => {
                const activity = getActivityStatus(vessel.lastTransmissionDate);
                return (
                  <Card
                    key={vessel.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onVesselClick(vessel)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {vessel.name || `Embarcação ${vessel.vesselId}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              ID: {vessel.vesselId}
                              {vessel.imo && ` | IMO: ${vessel.imo}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getVesselTypeIcon(vessel.vesselType)}
                            </span>
                            <div className={`rounded-full p-1 ${activity.color}`}>
                              <Activity className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            <span>{vessel.flag}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{getVesselTypeLabel(vessel.vesselType)}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{formatCoordinates(vessel.geom?.coordinates)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(vessel.lastTransmissionDate), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, vessels.length)} de{' '}
                  {vessels.length} embarcações
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => updatePage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(totalPages)}
                    disabled={pagination.page === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default VesselList;