"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  MapPin,
  Ship,
  Flag,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GFWVessel } from '@/lib/api-gfw';

export interface VesselFilters {
  search: string;
  vesselTypes: string[];
  flags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  locationRange: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  activeOnly: boolean;
  hasIMO: boolean;
  sortBy: 'name' | 'type' | 'flag' | 'lastTransmission' | 'location';
  sortOrder: 'asc' | 'desc';
}

interface VesselFiltersProps {
  vessels: GFWVessel[];
  filters: VesselFilters;
  onFiltersChange: (filters: VesselFilters) => void;
  onExport: (format: 'json' | 'csv') => void;
  loading?: boolean;
}

const DEFAULT_FILTERS: VesselFilters = {
  search: '',
  vesselTypes: [],
  flags: [],
  dateRange: {
    start: null,
    end: null,
  },
  locationRange: {
    minLat: -18,
    maxLat: -5,
    minLon: 11,
    maxLon: 14,
  },
  activeOnly: false,
  hasIMO: false,
  sortBy: 'lastTransmission',
  sortOrder: 'desc',
};

const VESSEL_TYPE_OPTIONS = [
  { value: 'fishing', label: 'Pesca', icon: '🎣' },
  { value: 'carrier', label: 'Transporte', icon: '🚢' },
  { value: 'support', label: 'Apoio', icon: '⚓' },
  { value: 'passenger', label: 'Passageiros', icon: '🛳️' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'type', label: 'Tipo' },
  { value: 'flag', label: 'Bandeira' },
  { value: 'lastTransmission', label: 'Última Transmissão' },
  { value: 'location', label: 'Localização' },
];

export function VesselFilters({
  vessels,
  filters,
  onFiltersChange,
  onExport,
  loading = false
}: VesselFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [availableFlags, setAvailableFlags] = useState<string[]>([]);

  // Extract unique flags from vessels
  useEffect(() => {
    const flags = Array.from(new Set(vessels.map(v => v.flag).filter(Boolean)));
    setAvailableFlags(flags.sort());
  }, [vessels]);

  const updateFilters = (updates: Partial<VesselFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.vesselTypes.length > 0 ||
      filters.flags.length > 0 ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null ||
      filters.activeOnly ||
      filters.hasIMO ||
      filters.locationRange.minLat !== DEFAULT_FILTERS.locationRange.minLat ||
      filters.locationRange.maxLat !== DEFAULT_FILTERS.locationRange.maxLat ||
      filters.locationRange.minLon !== DEFAULT_FILTERS.locationRange.minLon ||
      filters.locationRange.maxLon !== DEFAULT_FILTERS.locationRange.maxLon
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.vesselTypes.length > 0) count++;
    if (filters.flags.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.activeOnly) count++;
    if (filters.hasIMO) count++;
    if (
      filters.locationRange.minLat !== DEFAULT_FILTERS.locationRange.minLat ||
      filters.locationRange.maxLat !== DEFAULT_FILTERS.locationRange.maxLat ||
      filters.locationRange.minLon !== DEFAULT_FILTERS.locationRange.minLon ||
      filters.locationRange.maxLon !== DEFAULT_FILTERS.locationRange.maxLon
    ) count++;
    return count;
  };

  const removeVesselType = (type: string) => {
    updateFilters({
      vesselTypes: filters.vesselTypes.filter(t => t !== type)
    });
  };

  const removeFlag = (flag: string) => {
    updateFilters({
      flags: filters.flags.filter(f => f !== flag)
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Quick Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, ID, IMO ou sinal de chamada..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters() && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2">
                {filters.vesselTypes.map(type => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    {VESSEL_TYPE_OPTIONS.find(opt => opt.value === type)?.icon}
                    {VESSEL_TYPE_OPTIONS.find(opt => opt.value === type)?.label}
                    <button onClick={() => removeVesselType(type)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.flags.map(flag => (
                  <Badge key={flag} variant="secondary" className="flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    {flag}
                    <button onClick={() => removeFlag(flag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Data
                    <button onClick={() => updateFilters({ dateRange: { start: null, end: null } })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.activeOnly && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Apenas Ativas
                    <button onClick={() => updateFilters({ activeOnly: false })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.hasIMO && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Com IMO
                    <button onClick={() => updateFilters({ hasIMO: false })}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Sort and Export */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Ordenar por:</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => updateFilters({ sortBy: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                  })}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('csv')}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('json')}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vessel Types */}
              <div className="space-y-2">
                <Label>Tipo de Embarcação</Label>
                <div className="grid grid-cols-2 gap-2">
                  {VESSEL_TYPE_OPTIONS.map(type => (
                    <Button
                      key={type.value}
                      variant={filters.vesselTypes.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newTypes = filters.vesselTypes.includes(type.value)
                          ? filters.vesselTypes.filter(t => t !== type.value)
                          : [...filters.vesselTypes, type.value];
                        updateFilters({ vesselTypes: newTypes });
                      }}
                      className="justify-start"
                    >
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <Label>Bandeira</Label>
                <Select
                  value=""
                  onValueChange={(flag) => {
                    if (!filters.flags.includes(flag)) {
                      updateFilters({ flags: [...filters.flags, flag] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar bandeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFlags.map(flag => (
                      <SelectItem
                        key={flag}
                        value={flag}
                        disabled={filters.flags.includes(flag)}
                      >
                        {flag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Período de Transmissão</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.start
                          ? format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Data inicial'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.start || undefined}
                        onSelect={(date) => updateFilters({
                          dateRange: { ...filters.dateRange, start: date || null }
                        })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.dateRange.end
                          ? format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Data final'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.end || undefined}
                        onSelect={(date) => updateFilters({
                          dateRange: { ...filters.dateRange, end: date || null }
                        })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label>Opções</Label>
                <div className="space-y-2">
                  <Button
                    variant={filters.activeOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ activeOnly: !filters.activeOnly })}
                    className="w-full justify-start"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Apenas embarcações ativas
                  </Button>
                  <Button
                    variant={filters.hasIMO ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ hasIMO: !filters.hasIMO })}
                    className="w-full justify-start"
                  >
                    <Ship className="h-4 w-4 mr-2" />
                    Apenas com número IMO
                  </Button>
                </div>
              </div>
            </div>

            {/* Location Range */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Área Geográfica (Águas Angolanas)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Latitude: {filters.locationRange.minLat}° - {filters.locationRange.maxLat}°</Label>
                  <Slider
                    value={[filters.locationRange.minLat, filters.locationRange.maxLat]}
                    onValueChange={([min, max]) => updateFilters({
                      locationRange: { ...filters.locationRange, minLat: min, maxLat: max }
                    })}
                    min={-20}
                    max={-3}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Longitude: {filters.locationRange.minLon}° - {filters.locationRange.maxLon}°</Label>
                  <Slider
                    value={[filters.locationRange.minLon, filters.locationRange.maxLon]}
                    onValueChange={([min, max]) => updateFilters({
                      locationRange: { ...filters.locationRange, minLon: min, maxLon: max }
                    })}
                    min={8}
                    max={16}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VesselFilters;