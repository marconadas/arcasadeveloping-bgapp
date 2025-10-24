'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity, AlertCircle, Target } from 'lucide-react';

interface MLStats {
  totalPredictions: number;
  averageConfidence: number;
  highConfidencePredictions: number;
  biodiversityHotspots: number;
  conservationAreas: number;
  riskZones: number;
  lastUpdate: Date;
}

interface MLStatisticsPanelProps {
  data: any[];
  visible?: boolean;
}

export function MLStatisticsPanel({ data, visible = true }: MLStatisticsPanelProps) {
  const [stats, setStats] = useState<MLStats>({
    totalPredictions: 0,
    averageConfidence: 0,
    highConfidencePredictions: 0,
    biodiversityHotspots: 0,
    conservationAreas: 0,
    riskZones: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate statistics
    const totalPredictions = data.length;
    const averageConfidence = data.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPredictions;
    const highConfidencePredictions = data.filter(p => p.confidence >= 0.85).length;

    // Count by type
    const biodiversityHotspots = data.filter(p =>
      p.prediction_type === 'biodiversityHotspots' && p.prediction_value > 70
    ).length;

    const conservationAreas = data.filter(p =>
      p.prediction_type === 'conservationPriority' && p.prediction_value > 75
    ).length;

    const riskZones = data.filter(p =>
      p.prediction_type === 'riskAssessment' && p.prediction_value > 40
    ).length;

    setStats({
      totalPredictions,
      averageConfidence,
      highConfidencePredictions,
      biodiversityHotspots,
      conservationAreas,
      riskZones,
      lastUpdate: new Date()
    });
  }, [data]);

  if (!visible) return null;

  return (
    <div className="bg-gray-900 bg-opacity-95 rounded-lg shadow-xl p-4 w-80">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        Estatísticas ML
      </h3>

      <div className="space-y-3">
        {/* Total Predictions */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Total de Previsões</span>
          </div>
          <span className="text-lg font-bold text-white">
            {stats.totalPredictions.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Average Confidence */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Confiança Média</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stats.averageConfidence >= 0.85 ? 'bg-green-500' :
                  stats.averageConfidence >= 0.7 ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${stats.averageConfidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-white">
              {(stats.averageConfidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* High Confidence Count */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Alta Confiança</span>
          </div>
          <span className="text-sm font-medium text-green-400">
            {stats.highConfidencePredictions} ({((stats.highConfidencePredictions / stats.totalPredictions) * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
          <div className="text-center p-2 bg-blue-500 bg-opacity-10 rounded">
            <div className="text-2xl">🌊</div>
            <div className="text-lg font-bold text-blue-400">
              {stats.biodiversityHotspots}
            </div>
            <div className="text-xs text-gray-400">Hotspots</div>
          </div>

          <div className="text-center p-2 bg-green-500 bg-opacity-10 rounded">
            <div className="text-2xl">🛡️</div>
            <div className="text-lg font-bold text-green-400">
              {stats.conservationAreas}
            </div>
            <div className="text-xs text-gray-400">Conservação</div>
          </div>

          <div className="text-center p-2 bg-red-500 bg-opacity-10 rounded">
            <div className="text-2xl">⚡</div>
            <div className="text-lg font-bold text-red-400">
              {stats.riskZones}
            </div>
            <div className="text-xs text-gray-400">Riscos</div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center text-xs text-gray-500 pt-2">
          Última atualização: {stats.lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  );
}