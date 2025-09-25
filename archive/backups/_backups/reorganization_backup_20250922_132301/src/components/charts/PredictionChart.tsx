'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MLPrediction, MarineData } from '@/lib/types';
import { PredictionService } from '@/services/ml/predictionService';
import { formatTemperature, formatChlorophyll } from '@/lib/utils';
import { TrendingUp, Brain, Clock } from 'lucide-react';

interface PredictionChartProps {
  marineData: MarineData | null;
  className?: string;
}

interface ChartDataPoint {
  time: string;
  temperature: number;
  chlorophyll: number;
  tempPrediction?: number;
  chlorPrediction?: number;
  confidence?: number;
}

export function PredictionChart({ marineData, className = '' }: PredictionChartProps) {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'1h' | '6h' | '24h'>('6h');

  useEffect(() => {
    if (marineData) {
      generatePredictions();
    }
  }, [marineData, timeframe]);

  const generatePredictions = async () => {
    if (!marineData) return;

    setIsLoading(true);
    try {
      const predictionService = PredictionService.getInstance();

      const [tempPrediction, chlorPrediction] = await Promise.all([
        predictionService.predictTemperature(marineData, timeframe),
        predictionService.predictChlorophyll(marineData, timeframe)
      ]);

      setPredictions([tempPrediction, chlorPrediction]);
      generateChartData(marineData, tempPrediction, chlorPrediction);
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateChartData = (
    current: MarineData,
    tempPred: MLPrediction,
    chlorPred: MLPrediction
  ) => {
    const data: ChartDataPoint[] = [];
    const now = new Date();

    // Dados históricos simulados (últimas 6 horas)
    for (let i = -6; i <= 0; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        temperature: current.temperature + (Math.random() - 0.5) * 2,
        chlorophyll: current.chlorophyll + (Math.random() - 0.5) * 0.3
      });
    }

    // Predições futuras
    const hours = timeframe === '1h' ? 1 : timeframe === '6h' ? 6 : 24;
    for (let i = 1; i <= hours; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        temperature: current.temperature,
        chlorophyll: current.chlorophyll,
        tempPrediction: tempPred.prediction + (Math.random() - 0.5) * 0.5,
        chlorPrediction: chlorPred.prediction + (Math.random() - 0.5) * 0.1,
        confidence: Math.min(tempPred.confidence, chlorPred.confidence)
      });
    }

    setChartData(data);
  };

  const averageConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;

  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Predições ML</h3>
            <p className="text-sm text-gray-600">Análise preditiva em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white"
          >
            <option value="1h">1 hora</option>
            <option value="6h">6 horas</option>
            <option value="24h">24 horas</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {predictions.map((prediction) => (
          <div
            key={prediction.type}
            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 capitalize">
                  {prediction.type === 'temperature' ? 'Temperatura' :
                   prediction.type === 'chlorophyll' ? 'Clorofila' : prediction.type}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {prediction.type === 'temperature'
                    ? formatTemperature(prediction.prediction)
                    : formatChlorophyll(prediction.prediction)
                  }
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Confiança</div>
                <div className={`text-sm font-semibold ${
                  prediction.confidence >= 0.8 ? 'text-green-600' :
                  prediction.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(prediction.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Gerando predições...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: string) => {
                  if (name.includes('temperature') || name.includes('temp')) {
                    return [formatTemperature(value), name];
                  }
                  if (name.includes('chlorophyll') || name.includes('chlor')) {
                    return [formatChlorophyll(value), name];
                  }
                  return [value, name];
                }}
              />
              <Legend />

              {/* Dados históricos */}
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                name="Temperatura Atual"
              />
              <Line
                type="monotone"
                dataKey="chlorophyll"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                name="Clorofila Atual"
              />

              {/* Predições */}
              <Line
                type="monotone"
                dataKey="tempPrediction"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                name="Predição Temperatura"
              />
              <Line
                type="monotone"
                dataKey="chlorPrediction"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Predição Clorofila"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>Modelo TensorFlow.js</span>
        </div>
        <div>
          Confiança média: {(averageConfidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}