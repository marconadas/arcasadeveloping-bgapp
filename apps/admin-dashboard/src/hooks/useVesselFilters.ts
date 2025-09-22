import { useState, useMemo, useCallback } from 'react';
import { GFWVessel } from '@/lib/api-gfw';
import { VesselFilters } from '@/components/gfw/vessel-filters';

export interface UseVesselFiltersReturn {
  filters: VesselFilters;
  filteredVessels: GFWVessel[];
  filteredCount: number;
  totalCount: number;
  updateFilters: (filters: VesselFilters) => void;
  resetFilters: () => void;
  exportFilteredData: (format: 'json' | 'csv') => void;
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

export function useVesselFilters(vessels: GFWVessel[]): UseVesselFiltersReturn {
  const [filters, setFilters] = useState<VesselFilters>(DEFAULT_FILTERS);

  // Apply all filters to vessels
  const filteredVessels = useMemo(() => {
    let filtered = [...vessels];

    // Text search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(vessel => {
        return (
          vessel.name?.toLowerCase().includes(searchTerm) ||
          vessel.vesselId?.toLowerCase().includes(searchTerm) ||
          vessel.id?.toLowerCase().includes(searchTerm) ||
          vessel.imo?.toLowerCase().includes(searchTerm) ||
          vessel.callsign?.toLowerCase().includes(searchTerm) ||
          vessel.flag?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Vessel type filter
    if (filters.vesselTypes.length > 0) {
      filtered = filtered.filter(vessel =>
        filters.vesselTypes.includes(vessel.vesselType)
      );
    }

    // Flag filter
    if (filters.flags.length > 0) {
      filtered = filtered.filter(vessel =>
        filters.flags.includes(vessel.flag)
      );
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(vessel => {
        const lastTransmission = new Date(vessel.lastTransmissionDate);
        const firstTransmission = new Date(vessel.firstTransmissionDate);

        let matchesStart = true;
        let matchesEnd = true;

        if (filters.dateRange.start) {
          matchesStart =
            lastTransmission >= filters.dateRange.start ||
            firstTransmission >= filters.dateRange.start;
        }

        if (filters.dateRange.end) {
          matchesEnd =
            firstTransmission <= filters.dateRange.end ||
            lastTransmission <= filters.dateRange.end;
        }

        return matchesStart && matchesEnd;
      });
    }

    // Location filter
    if (vessel => vessel.geom?.coordinates) {
      filtered = filtered.filter(vessel => {
        if (!vessel.geom?.coordinates || vessel.geom.coordinates.length < 2) {
          return false;
        }

        const [lon, lat] = vessel.geom.coordinates;
        return (
          lat >= filters.locationRange.minLat &&
          lat <= filters.locationRange.maxLat &&
          lon >= filters.locationRange.minLon &&
          lon <= filters.locationRange.maxLon
        );
      });
    }

    // Active only filter
    if (filters.activeOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      filtered = filtered.filter(vessel => {
        const lastTransmission = new Date(vessel.lastTransmissionDate);
        return lastTransmission >= thirtyDaysAgo;
      });
    }

    // Has IMO filter
    if (filters.hasIMO) {
      filtered = filtered.filter(vessel =>
        vessel.imo && vessel.imo.trim() !== ''
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = (a.name || a.vesselId || '').localeCompare(b.name || b.vesselId || '');
          break;

        case 'type':
          comparison = a.vesselType.localeCompare(b.vesselType);
          break;

        case 'flag':
          comparison = a.flag.localeCompare(b.flag);
          break;

        case 'lastTransmission':
          comparison = new Date(b.lastTransmissionDate).getTime() - new Date(a.lastTransmissionDate).getTime();
          break;

        case 'location':
          const aLat = a.geom?.coordinates[1] || 0;
          const bLat = b.geom?.coordinates[1] || 0;
          comparison = aLat - bLat;
          break;

        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [vessels, filters]);

  const updateFilters = useCallback((newFilters: VesselFilters) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const exportFilteredData = useCallback((format: 'json' | 'csv') => {
    if (filteredVessels.length === 0) {
      console.warn('No vessels to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `vessels-filtered-${timestamp}`;

    if (format === 'json') {
      const data = {
        exportDate: new Date().toISOString(),
        filters: filters,
        totalVessels: filteredVessels.length,
        vessels: filteredVessels
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      downloadFile(blob, `${filename}.json`);
    } else if (format === 'csv') {
      const headers = [
        'ID',
        'Nome',
        'Tipo',
        'Bandeira',
        'IMO',
        'Callsign',
        'Primeira Transmissão',
        'Última Transmissão',
        'Latitude',
        'Longitude'
      ];

      const csvData = filteredVessels.map(vessel => [
        vessel.vesselId || vessel.id,
        vessel.name || '',
        getVesselTypeLabel(vessel.vesselType),
        vessel.flag,
        vessel.imo || '',
        vessel.callsign || '',
        new Date(vessel.firstTransmissionDate).toLocaleDateString('pt-BR'),
        new Date(vessel.lastTransmissionDate).toLocaleDateString('pt-BR'),
        vessel.geom?.coordinates[1]?.toFixed(4) || '',
        vessel.geom?.coordinates[0]?.toFixed(4) || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          row.map(cell =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell
          ).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `${filename}.csv`);
    }
  }, [filteredVessels, filters]);

  return {
    filters,
    filteredVessels,
    filteredCount: filteredVessels.length,
    totalCount: vessels.length,
    updateFilters,
    resetFilters,
    exportFilteredData,
  };
}

// Helper functions
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getVesselTypeLabel(type: string): string {
  switch (type) {
    case 'fishing': return 'Pesca';
    case 'carrier': return 'Transporte';
    case 'support': return 'Apoio';
    case 'passenger': return 'Passageiros';
    default: return 'Desconhecido';
  }
}

export default useVesselFilters;