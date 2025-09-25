import * as tf from '@tensorflow/tfjs';
import { MLPrediction, MarineData, VesselData } from '@/lib/types';
import { ML_MODEL_PATHS } from '@/lib/constants';

export class PredictionService {
  private static instance: PredictionService;
  private models: Map<string, tf.LayersModel> = new Map();
  private isInitialized = false;

  public static getInstance(): PredictionService {
    if (!PredictionService.instance) {
      PredictionService.instance = new PredictionService();
    }
    return PredictionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set TensorFlow.js backend
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());

      // Load pre-trained models (quando disponíveis)
      // await this.loadModels();

      this.isInitialized = true;
      console.log('ML Prediction Service initialized');
    } catch (error) {
      console.error('Failed to initialize ML service:', error);
    }
  }

  private async loadModels(): Promise<void> {
    const modelPromises = Object.entries(ML_MODEL_PATHS).map(async ([key, path]) => {
      try {
        const model = await tf.loadLayersModel(path);
        this.models.set(key, model);
        console.log(`Loaded ${key} model`);
      } catch (error) {
        console.warn(`Failed to load ${key} model:`, error);
      }
    });

    await Promise.allSettled(modelPromises);
  }

  // Predição de temperatura baseada em dados históricos
  async predictTemperature(
    currentData: MarineData,
    timeframe: '1h' | '6h' | '24h' = '1h'
  ): Promise<MLPrediction> {
    await this.initialize();

    try {
      // Preparar dados de entrada
      const inputData = this.prepareTemperatureInput(currentData);

      // Se modelo carregado, usar predição real
      const model = this.models.get('temperature');
      if (model) {
        const prediction = model.predict(inputData) as tf.Tensor;
        const result = await prediction.data();
        prediction.dispose();
        inputData.dispose();

        return {
          type: 'temperature',
          prediction: result[0],
          confidence: this.calculateConfidence(result[0], currentData.quality),
          timeframe,
          timestamp: new Date()
        };
      }

      // Fallback: predição baseada em tendências simples
      return this.simplePredictTemperature(currentData, timeframe);
    } catch (error) {
      console.error('Temperature prediction error:', error);
      return this.simplePredictTemperature(currentData, timeframe);
    }
  }

  // Predição de clorofila baseada em padrões sazonais
  async predictChlorophyll(
    currentData: MarineData,
    timeframe: '1h' | '6h' | '24h' = '1h'
  ): Promise<MLPrediction> {
    await this.initialize();

    try {
      const inputData = this.prepareChlorophyllInput(currentData);

      const model = this.models.get('chlorophyll');
      if (model) {
        const prediction = model.predict(inputData) as tf.Tensor;
        const result = await prediction.data();
        prediction.dispose();
        inputData.dispose();

        return {
          type: 'chlorophyll',
          prediction: result[0],
          confidence: this.calculateConfidence(result[0], currentData.quality),
          timeframe,
          timestamp: new Date()
        };
      }

      return this.simplePredictChlorophyll(currentData, timeframe);
    } catch (error) {
      console.error('Chlorophyll prediction error:', error);
      return this.simplePredictChlorophyll(currentData, timeframe);
    }
  }

  // Análise de comportamento de embarcações
  async analyzeVesselBehavior(vessels: VesselData[]): Promise<MLPrediction[]> {
    await this.initialize();

    const predictions: MLPrediction[] = [];

    for (const vessel of vessels) {
      try {
        const behaviorScore = this.calculateVesselBehaviorScore(vessel);

        predictions.push({
          type: 'vessel_behavior',
          prediction: behaviorScore,
          confidence: this.calculateVesselConfidence(vessel),
          timeframe: '1h',
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Vessel behavior analysis error for ${vessel.id}:`, error);
      }
    }

    return predictions;
  }

  // Predição de áreas de pesca potenciais
  async predictFishingAreas(
    marineData: MarineData,
    vessels: VesselData[]
  ): Promise<{ lat: number; lng: number; probability: number }[]> {
    await this.initialize();

    try {
      const areas: { lat: number; lng: number; probability: number }[] = [];

      // Algoritmo baseado em características oceanográficas
      const optimalTemp = this.getOptimalTemperatureRange();
      const optimalChlor = this.getOptimalChlorophyllRange();

      // Gerar grid de pontos para análise
      for (let lat = -18; lat <= -4; lat += 0.5) {
        for (let lng = 11; lng <= 24; lng += 0.5) {
          const probability = this.calculateFishingProbability(
            lat,
            lng,
            marineData,
            optimalTemp,
            optimalChlor
          );

          if (probability > 0.3) {
            areas.push({ lat, lng, probability });
          }
        }
      }

      return areas.sort((a, b) => b.probability - a.probability).slice(0, 20);
    } catch (error) {
      console.error('Fishing area prediction error:', error);
      return [];
    }
  }

  private prepareTemperatureInput(data: MarineData): tf.Tensor {
    // Normalizar dados de entrada
    const features = [
      data.temperature / 35, // Normalizar temperatura
      data.salinity / 40,    // Normalizar salinidade
      data.chlorophyll / 2,  // Normalizar clorofila
      new Date().getHours() / 24, // Hora do dia
      new Date().getMonth() / 12   // Mês do ano
    ];

    return tf.tensor2d([features]);
  }

  private prepareChlorophyllInput(data: MarineData): tf.Tensor {
    const features = [
      data.chlorophyll / 2,
      data.temperature / 35,
      data.salinity / 40,
      new Date().getMonth() / 12,
      Math.sin(2 * Math.PI * new Date().getMonth() / 12) // Componente sazonal
    ];

    return tf.tensor2d([features]);
  }

  private simplePredictTemperature(data: MarineData, timeframe: string): MLPrediction {
    // Predição baseada em tendências
    const hourlyChange = this.getTemperatureHourlyTrend();
    const timeMultiplier = timeframe === '1h' ? 1 : timeframe === '6h' ? 6 : 24;

    const prediction = data.temperature + (hourlyChange * timeMultiplier);

    return {
      type: 'temperature',
      prediction: Math.max(20, Math.min(32, prediction)), // Clamp realista
      confidence: 0.7,
      timeframe: timeframe as any,
      timestamp: new Date()
    };
  }

  private simplePredictChlorophyll(data: MarineData, timeframe: string): MLPrediction {
    const seasonalFactor = this.getSeasonalChlorophyllFactor();
    const prediction = data.chlorophyll * seasonalFactor;

    return {
      type: 'chlorophyll',
      prediction: Math.max(0.1, Math.min(3.0, prediction)),
      confidence: 0.65,
      timeframe: timeframe as any,
      timestamp: new Date()
    };
  }

  private calculateVesselBehaviorScore(vessel: VesselData): number {
    // Score baseado em velocidade, padrão de movimento, etc.
    const speedScore = vessel.speed / 25; // Normalizar por velocidade máxima típica
    const timeScore = this.getTimeBasedScore();

    return Math.min(1, (speedScore + timeScore) / 2);
  }

  private calculateConfidence(prediction: number, dataQuality: string): number {
    const baseConfidence = dataQuality === 'high' ? 0.9 : dataQuality === 'medium' ? 0.7 : 0.5;
    const predictionReliability = Math.max(0.5, 1 - Math.abs(prediction - 0.5) * 0.5);

    return Math.min(1, baseConfidence * predictionReliability);
  }

  private calculateVesselConfidence(vessel: VesselData): number {
    const hasRecentData = (Date.now() - vessel.timestamp.getTime()) < 3600000; // 1 hora
    const hasValidSpeed = vessel.speed >= 0 && vessel.speed <= 50;

    return hasRecentData && hasValidSpeed ? 0.8 : 0.5;
  }

  private getTemperatureHourlyTrend(): number {
    // Tendência baseada na hora do dia (aquecimento diurno)
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) return 0.1; // Aquecimento durante o dia
    return -0.05; // Resfriamento durante a noite
  }

  private getSeasonalChlorophyllFactor(): number {
    const month = new Date().getMonth();
    // Pico de clorofila durante upwelling (junho-setembro)
    if (month >= 5 && month <= 8) return 1.2;
    return 0.9;
  }

  private getTimeBasedScore(): number {
    const hour = new Date().getHours();
    // Atividade pesqueira maior durante madrugada e final da tarde
    if ((hour >= 4 && hour <= 8) || (hour >= 16 && hour <= 20)) return 0.8;
    return 0.4;
  }

  private getOptimalTemperatureRange(): [number, number] {
    return [24, 28]; // Temperatura ótima para pesca em Angola
  }

  private getOptimalChlorophyllRange(): [number, number] {
    return [0.5, 1.5]; // Concentração ótima de clorofila
  }

  private calculateFishingProbability(
    lat: number,
    lng: number,
    marineData: MarineData,
    tempRange: [number, number],
    chlorRange: [number, number]
  ): number {
    // Proximidade à zona de upwelling
    const upwellingProximity = this.calculateUpwellingProximity(lat, lng);

    // Score de temperatura
    const tempScore = this.scoreInRange(marineData.temperature, tempRange);

    // Score de clorofila
    const chlorScore = this.scoreInRange(marineData.chlorophyll, chlorRange);

    // Profundidade (aproximada)
    const depthScore = this.getDepthScore(lat, lng);

    return (upwellingProximity + tempScore + chlorScore + depthScore) / 4;
  }

  private calculateUpwellingProximity(lat: number, lng: number): number {
    // Zona de upwelling costeira de Angola (aproximação)
    const coastalDistance = Math.abs(lng - 13); // Distância da costa aproximada
    return Math.max(0, 1 - coastalDistance / 3);
  }

  private scoreInRange(value: number, range: [number, number]): number {
    if (value >= range[0] && value <= range[1]) return 1;

    const lowerDist = Math.abs(value - range[0]);
    const upperDist = Math.abs(value - range[1]);
    const minDist = Math.min(lowerDist, upperDist);

    return Math.max(0, 1 - minDist / (range[1] - range[0]));
  }

  private getDepthScore(lat: number, lng: number): number {
    // Profundidades ideais para pesca (50-200m aproximadamente)
    // Simplificação baseada na distância da costa
    const coastalDistance = Math.abs(lng - 13);
    if (coastalDistance >= 0.5 && coastalDistance <= 2) return 1;
    return Math.max(0, 1 - Math.abs(coastalDistance - 1.25) / 2);
  }
}