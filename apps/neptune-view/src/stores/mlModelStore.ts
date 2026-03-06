import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface MLModel {
  id: string;
  name: string;
  nameEn: string;
  type: string;
  version: string;
  description: string;
  accuracy: number;
  lastTrained: Date;
  isActive: boolean;
  icon?: string;
  color?: string;
  trainingDataSize?: number;
}

export interface MLPrediction {
  id: string;
  model_name: string;
  model_version: string;
  prediction_type: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  prediction_value: number;
  confidence: number;
  input_features?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface MLMetrics {
  totalPredictions: number;
  averageConfidence: number;
  highConfidenceCount: number;
  predictionsByType: Record<string, number>;
  accuracyByModel: Record<string, number>;
  lastUpdate: Date | null;
}

export interface MLAlert {
  id: string;
  type: 'high-risk' | 'low-confidence' | 'anomaly' | 'conservation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  location?: { lat: number; lon: number };
  prediction?: MLPrediction;
  isRead: boolean;
}

interface MLModelState {
  // Models
  models: MLModel[];
  activeModels: string[];
  selectedModel: MLModel | null;

  // Predictions
  predictions: MLPrediction[];
  filteredPredictions: MLPrediction[];
  isLoadingPredictions: boolean;
  predictionsError: string | null;

  // Filters
  minConfidence: number;
  selectedTypes: string[];
  geoBounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null;

  // Metrics
  metrics: MLMetrics;
  isLoadingMetrics: boolean;

  // Alerts
  alerts: MLAlert[];
  unreadAlertCount: number;

  // Cache
  lastFetch: Date | null;
  cacheExpiry: number; // minutes

  // Actions
  initializeModels: () => Promise<void>;
  loadModels: () => Promise<void>;
  toggleModel: (modelId: string) => void;
  selectModel: (modelId: string | null) => void;
  setActiveModels: (modelIds: string[]) => void;

  // Prediction actions
  fetchPredictions: (bounds?: { minLat: number; maxLat: number; minLon: number; maxLon: number }) => Promise<void>;
  setPredictions: (predictions: MLPrediction[]) => void;
  filterPredictions: () => void;
  setMinConfidence: (confidence: number) => void;
  setSelectedTypes: (types: string[]) => void;
  setGeoBounds: (bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null) => void;
  clearPredictions: () => void;

  // Metrics actions
  updateMetrics: () => void;
  fetchModelAccuracy: (modelId: string) => Promise<number>;

  // Alert actions
  addAlert: (alert: Omit<MLAlert, 'id' | 'timestamp' | 'isRead'>) => void;
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  checkForAnomalies: () => void;

  // Cache actions
  shouldRefetch: () => boolean;
  invalidateCache: () => void;
}

// Default models configuration
const defaultModels: MLModel[] = [
  {
    id: 'fishing-zones-v2',
    name: 'Zonas de Pesca',
    nameEn: 'Fishing Zones',
    type: 'fishingZones',
    version: '2.0.1',
    description: 'Detecta e classifica zonas de pesca ativa',
    accuracy: 95.8,
    lastTrained: new Date('2025-01-15'),
    isActive: true,
    icon: '🎣',
    color: '#3B82F6'
  },
  {
    id: 'species-presence-v3',
    name: 'Presença de Espécies',
    nameEn: 'Species Presence',
    type: 'speciesPresence',
    version: '3.1.0',
    description: 'Predição de distribuição de 30 espécies prioritárias',
    accuracy: 94.2,
    lastTrained: new Date('2025-01-10'),
    isActive: true,
    icon: '🐟',
    color: '#10B981'
  },
  {
    id: 'risk-assessment-v1',
    name: 'Avaliação de Risco',
    nameEn: 'Risk Assessment',
    type: 'riskAssessment',
    version: '1.2.3',
    description: 'Identifica áreas de alto risco ecológico',
    accuracy: 92.5,
    lastTrained: new Date('2025-01-08'),
    isActive: false,
    icon: '⚠️',
    color: '#EF4444'
  },
  {
    id: 'habitat-suitability-v2',
    name: 'Adequação de Habitat',
    nameEn: 'Habitat Suitability',
    type: 'habitatSuitability',
    version: '2.0.0',
    description: 'Análise de adequação de habitat para espécies marinhas',
    accuracy: 93.7,
    lastTrained: new Date('2025-01-12'),
    isActive: false,
    icon: '🏠',
    color: '#F59E0B'
  },
  {
    id: 'monitoring-points-v1',
    name: 'Pontos de Monitoramento',
    nameEn: 'Monitoring Points',
    type: 'monitoringPoints',
    version: '1.1.0',
    description: 'Sugere locais críticos para monitoramento',
    accuracy: 91.3,
    lastTrained: new Date('2025-01-05'),
    isActive: false,
    icon: '📍',
    color: '#8B5CF6'
  },
  {
    id: 'conservation-priority-v2',
    name: 'Prioridade de Conservação',
    nameEn: 'Conservation Priority',
    type: 'conservationPriority',
    version: '2.1.0',
    description: 'Identifica áreas prioritárias para conservação',
    accuracy: 94.9,
    lastTrained: new Date('2025-01-14'),
    isActive: true,
    icon: '🌿',
    color: '#06B6D4'
  },
  {
    id: 'biodiversity-hotspots-v1',
    name: 'Hotspots de Biodiversidade',
    nameEn: 'Biodiversity Hotspots',
    type: 'biodiversityHotspots',
    version: '1.3.2',
    description: 'Mapeia áreas de alta biodiversidade marinha',
    accuracy: 93.1,
    lastTrained: new Date('2025-01-11'),
    isActive: false,
    icon: '🦈',
    color: '#EC4899'
  }
];

// Create store
export const useMLModelStore = create<MLModelState>()(
  devtools(
    (set, get) => ({
      // Initial state
      models: [],
      activeModels: [],
      selectedModel: null,
      predictions: [],
      filteredPredictions: [],
      isLoadingPredictions: false,
      predictionsError: null,
      minConfidence: 0.7,
      selectedTypes: [],
      geoBounds: null,
      metrics: {
        totalPredictions: 0,
        averageConfidence: 0,
        highConfidenceCount: 0,
        predictionsByType: {},
        accuracyByModel: {},
        lastUpdate: null
      },
      isLoadingMetrics: false,
      alerts: [],
      unreadAlertCount: 0,
      lastFetch: null,
      cacheExpiry: 5, // 5 minutes cache

      // Initialize models on first load
      initializeModels: async () => {
        const { models } = get();
        if (models.length === 0) {
          set({
            models: defaultModels,
            activeModels: defaultModels.filter(m => m.isActive).map(m => m.id)
          });
        }
      },

      // Load models from API
      loadModels: async () => {
        try {
          // Try to fetch from API first
          const response = await fetch('/api/ml/models/list');
          if (response.ok) {
            const data = await response.json();
            set({
              models: data.models || defaultModels,
              activeModels: data.models?.filter((m: MLModel) => m.isActive).map((m: MLModel) => m.id) || []
            });
          } else {
            // Fallback to default models
            set({
              models: defaultModels,
              activeModels: defaultModels.filter(m => m.isActive).map(m => m.id)
            });
          }
        } catch (error) {
          console.error('Error loading models:', error);
          // Use default models on error
          set({
            models: defaultModels,
            activeModels: defaultModels.filter(m => m.isActive).map(m => m.id)
          });
        }
      },

      // Toggle model active state
      toggleModel: (modelId: string) => {
        const { activeModels } = get();
        const isActive = activeModels.includes(modelId);

        if (isActive) {
          set({ activeModels: activeModels.filter(id => id !== modelId) });
        } else {
          set({ activeModels: [...activeModels, modelId] });
        }

        // Trigger prediction filter update
        get().filterPredictions();
      },

      // Select a specific model for details
      selectModel: (modelId: string | null) => {
        const { models } = get();
        const model = modelId ? models.find(m => m.id === modelId) || null : null;
        set({ selectedModel: model });
      },

      // Set active models
      setActiveModels: (modelIds: string[]) => {
        set({ activeModels: modelIds });
        get().filterPredictions();
      },

      // Fetch predictions from API
      fetchPredictions: async (bounds) => {
        const { minConfidence, shouldRefetch } = get();

        // Check cache
        if (!shouldRefetch() && get().predictions.length > 0) {
          get().filterPredictions();
          return;
        }

        set({ isLoadingPredictions: true, predictionsError: null });

        try {
          const params = new URLSearchParams();
          if (bounds) {
            params.append('minLat', bounds.minLat.toString());
            params.append('maxLat', bounds.maxLat.toString());
            params.append('minLon', bounds.minLon.toString());
            params.append('maxLon', bounds.maxLon.toString());
          }
          params.append('minConfidence', minConfidence.toString());

          const response = await fetch(`/api/realtime/ml-predictions?${params}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          set({
            predictions: data.predictions || [],
            lastFetch: new Date(),
            isLoadingPredictions: false,
            geoBounds: bounds || null
          });

          // Update metrics and filter
          get().updateMetrics();
          get().filterPredictions();
          get().checkForAnomalies();

        } catch (error) {
          console.error('Error fetching predictions:', error);
          set({
            predictionsError: error instanceof Error ? error.message : 'Failed to fetch predictions',
            isLoadingPredictions: false
          });
        }
      },

      // Set predictions directly (used by page.tsx when fetching from API)
      setPredictions: (predictions: MLPrediction[]) => {
        console.log('🟢 [STORE] setPredictions called with', predictions.length, 'predictions');

        set({
          predictions,
          lastFetch: new Date()
        });

        console.log('🟢 [STORE] State updated, now calling updateMetrics, filterPredictions, checkForAnomalies');

        // Update metrics and apply filters
        get().updateMetrics();
        get().filterPredictions();
        get().checkForAnomalies();

        const state = get();
        console.log('🟢 [STORE] After updates - predictions:', state.predictions.length, 'filtered:', state.filteredPredictions.length, 'metrics:', state.metrics);
      },

      // Filter predictions based on active models and confidence
      filterPredictions: () => {
        const { predictions, activeModels, minConfidence, selectedTypes } = get();

        let filtered = predictions;

        // Filter by active models
        if (activeModels.length > 0) {
          const activeModelTypes = get().models
            .filter(m => activeModels.includes(m.id))
            .map(m => m.type);

          filtered = filtered.filter(p =>
            activeModelTypes.includes(p.prediction_type)
          );
        }

        // Filter by confidence
        filtered = filtered.filter(p => p.confidence >= minConfidence);

        // Filter by selected types
        if (selectedTypes.length > 0) {
          filtered = filtered.filter(p =>
            selectedTypes.includes(p.prediction_type)
          );
        }

        set({ filteredPredictions: filtered });
      },

      // Set minimum confidence
      setMinConfidence: (confidence: number) => {
        set({ minConfidence: confidence });
        get().filterPredictions();
      },

      // Set selected types
      setSelectedTypes: (types: string[]) => {
        set({ selectedTypes: types });
        get().filterPredictions();
      },

      // Set geographic bounds
      setGeoBounds: (bounds) => {
        set({ geoBounds: bounds });
        if (bounds) {
          get().fetchPredictions(bounds);
        }
      },

      // Clear predictions
      clearPredictions: () => {
        set({
          predictions: [],
          filteredPredictions: [],
          lastFetch: null
        });
      },

      // Update metrics
      updateMetrics: () => {
        const { filteredPredictions, models } = get();

        if (filteredPredictions.length === 0) {
          set({
            metrics: {
              totalPredictions: 0,
              averageConfidence: 0,
              highConfidenceCount: 0,
              predictionsByType: {},
              accuracyByModel: {},
              lastUpdate: new Date()
            }
          });
          return;
        }

        const totalConfidence = filteredPredictions.reduce((sum, p) => sum + p.confidence, 0);
        const highConfidence = filteredPredictions.filter(p => p.confidence >= 0.8).length;

        const byType = filteredPredictions.reduce((acc, p) => {
          acc[p.prediction_type] = (acc[p.prediction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const accuracyByModel = models.reduce((acc, model) => {
          acc[model.id] = model.accuracy;
          return acc;
        }, {} as Record<string, number>);

        set({
          metrics: {
            totalPredictions: filteredPredictions.length,
            averageConfidence: totalConfidence / filteredPredictions.length,
            highConfidenceCount: highConfidence,
            predictionsByType: byType,
            accuracyByModel,
            lastUpdate: new Date()
          }
        });
      },

      // Fetch model accuracy
      fetchModelAccuracy: async (modelId: string) => {
        try {
          const response = await fetch(`/api/ml/models/info?modelId=${modelId}`);
          if (response.ok) {
            const data = await response.json();
            return data.accuracy || 0;
          }
        } catch (error) {
          console.error('Error fetching model accuracy:', error);
        }

        // Return default accuracy from local model
        const model = get().models.find(m => m.id === modelId);
        return model?.accuracy || 0;
      },

      // Add alert
      addAlert: (alert) => {
        const newAlert: MLAlert = {
          ...alert,
          id: `alert-${Date.now()}`,
          timestamp: new Date(),
          isRead: false
        };

        set(state => ({
          alerts: [newAlert, ...state.alerts].slice(0, 50), // Keep max 50 alerts
          unreadAlertCount: state.unreadAlertCount + 1
        }));
      },

      // Mark alert as read
      markAlertAsRead: (alertId: string) => {
        set(state => ({
          alerts: state.alerts.map(a =>
            a.id === alertId ? { ...a, isRead: true } : a
          ),
          unreadAlertCount: Math.max(0, state.unreadAlertCount - 1)
        }));
      },

      // Dismiss alert (alias to markAlertAsRead or remove if preferred)
      dismissAlert: (alertId: string) => {
        set(state => ({
          alerts: state.alerts.filter(a => a.id !== alertId),
          unreadAlertCount: state.alerts.find(a => a.id === alertId && !a.isRead)
            ? Math.max(0, state.unreadAlertCount - 1)
            : state.unreadAlertCount
        }));
      },

      // Clear all alerts
      clearAlerts: () => {
        set({ alerts: [], unreadAlertCount: 0 });
      },

      // Check for anomalies in predictions
      checkForAnomalies: () => {
        const { filteredPredictions, addAlert } = get();

        // Check for high-risk predictions
        const highRisk = filteredPredictions.filter(p =>
          p.prediction_type === 'riskAssessment' && p.prediction_value > 0.8
        );

        highRisk.forEach(prediction => {
          addAlert({
            type: 'high-risk',
            severity: 'high',
            title: 'Área de Alto Risco Detectada',
            message: `Risco elevado detectado em (${prediction.latitude.toFixed(3)}, ${prediction.longitude.toFixed(3)}) com confiança de ${(prediction.confidence * 100).toFixed(1)}%`,
            location: { lat: prediction.latitude, lon: prediction.longitude },
            prediction
          });
        });

        // Check for conservation priority areas
        const conservation = filteredPredictions.filter(p =>
          p.prediction_type === 'conservationPriority' && p.confidence > 0.9
        );

        if (conservation.length > 0) {
          addAlert({
            type: 'conservation',
            severity: 'medium',
            title: 'Áreas de Conservação Identificadas',
            message: `${conservation.length} áreas prioritárias para conservação foram identificadas com alta confiança`,
          });
        }

        // Check for low confidence predictions
        const lowConfidence = filteredPredictions.filter(p => p.confidence < 0.5);
        if (lowConfidence.length > filteredPredictions.length * 0.3) {
          addAlert({
            type: 'low-confidence',
            severity: 'low',
            title: 'Baixa Confiança nas Predições',
            message: `Mais de 30% das predições estão com confiança abaixo de 50%. Considere re-treinar os modelos.`,
          });
        }
      },

      // Check if should refetch
      shouldRefetch: () => {
        const { lastFetch, cacheExpiry } = get();
        if (!lastFetch) return true;

        const now = new Date();
        const diff = (now.getTime() - lastFetch.getTime()) / 1000 / 60; // minutes
        return diff > cacheExpiry;
      },

      // Invalidate cache
      invalidateCache: () => {
        set({ lastFetch: null });
      }
    }),
    {
      name: 'ml-model-store',
    }
  )
);

// Selectors
export const selectActiveModels = (state: MLModelState) =>
  state.models.filter(m => state.activeModels.includes(m.id));

export const selectFilteredPredictions = (state: MLModelState) =>
  state.filteredPredictions;

export const selectHighConfidencePredictions = (state: MLModelState) =>
  state.filteredPredictions.filter(p => p.confidence >= 0.8);

export const selectPredictionsByType = (type: string) => (state: MLModelState) =>
  state.filteredPredictions.filter(p => p.prediction_type === type);

export const selectUnreadAlerts = (state: MLModelState) =>
  state.alerts.filter(a => !a.isRead);

export const selectCriticalAlerts = (state: MLModelState) =>
  state.alerts.filter(a => a.severity === 'critical' || a.severity === 'high');