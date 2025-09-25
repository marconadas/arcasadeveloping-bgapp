'use client';

import { useEffect, useState } from 'react';
import { Activity, Thermometer, Droplets, Ship, Wifi } from 'lucide-react';
import { MarineData, VesselData } from '@/lib/types';
import { formatTemperature, formatChlorophyll, formatTimestamp } from '@/lib/utils';

interface RealtimeStatsProps {
  marineData: MarineData | null;
  vessels: VesselData[];
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function RealtimeStats({
  marineData,
  vessels,
  isConnected,
  lastUpdate
}: RealtimeStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      id: 'temperature',
      title: 'Temperatura da Água',
      value: marineData ? formatTemperature(marineData.temperature) : '--',
      icon: Thermometer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      quality: marineData?.quality || 'low'
    },
    {
      id: 'chlorophyll',
      title: 'Clorofila',
      value: marineData ? formatChlorophyll(marineData.chlorophyll) : '--',
      icon: Droplets,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      quality: marineData?.quality || 'low'
    },
    {
      id: 'vessels',
      title: 'Embarcações Ativas',
      value: vessels.length.toString(),
      icon: Ship,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      quality: 'high'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Status de Conexão */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wifi className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
            <div className="text-sm text-gray-600">
              {lastUpdate ? `Atualizado: ${formatTimestamp(lastUpdate)}` : 'Sem dados'}
            </div>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const qualityColor = {
            high: 'text-green-600',
            medium: 'text-yellow-600',
            low: 'text-red-600'
          }[stat.quality];

          return (
            <div
              key={stat.id}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${qualityColor.replace('text-', 'bg-')}`} />
              </div>

              {/* Indicador de Qualidade */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      stat.quality === 'high' ? 'bg-green-500 w-full' :
                      stat.quality === 'medium' ? 'bg-yellow-500 w-2/3' :
                      'bg-red-500 w-1/3'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${qualityColor}`}>
                  {stat.quality === 'high' ? 'Alta' :
                   stat.quality === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhes dos Dados Marítimos */}
      {marineData && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Dados Marítimos Detalhados</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Salinidade</div>
              <div className="font-semibold text-gray-900">
                {marineData.salinity.toFixed(2)} PSU
              </div>
            </div>
            <div>
              <div className="text-gray-600">Fonte</div>
              <div className="font-semibold text-gray-900 capitalize">
                {marineData.source}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Timestamp</div>
              <div className="font-semibold text-gray-900">
                {formatTimestamp(marineData.timestamp)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Qualidade</div>
              <div className={`font-semibold capitalize ${
                marineData.quality === 'high' ? 'text-green-600' :
                marineData.quality === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {marineData.quality === 'high' ? 'Alta' :
                 marineData.quality === 'medium' ? 'Média' : 'Baixa'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}