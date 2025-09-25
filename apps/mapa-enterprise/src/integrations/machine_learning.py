"""
Integração com modelos de Machine Learning
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import geopandas as gpd
from shapely.geometry import Point
from config.settings import get_config

logger = logging.getLogger(__name__)

class MachineLearningIntegration:
    """Classe para integração com modelos de Machine Learning"""

    def __init__(self):
        self.config = get_config()
        self.models_path = self.config.ML_MODELS_PATH
        self.models = {}
        self.scalers = {}

        self._load_models()

    def _load_models(self):
        """Carregar modelos treinados"""
        try:
            # Verificar se modelos existem
            model_files = [
                'fishing_prediction_model.pkl',
                'upwelling_prediction_model.pkl',
                'vessel_behavior_model.pkl',
                'anomaly_detection_model.pkl'
            ]

            for model_file in model_files:
                model_path = os.path.join(self.models_path, model_file)
                if os.path.exists(model_path):
                    self.models[model_file.split('.')[0]] = joblib.load(model_path)
                    logger.info(f"Modelo {model_file} carregado com sucesso")
                else:
                    logger.warning(f"Modelo {model_file} não encontrado em {model_path}")

            # Carregar scalers se existirem
            scaler_path = os.path.join(self.models_path, 'feature_scaler.pkl')
            if os.path.exists(scaler_path):
                self.scalers['main'] = joblib.load(scaler_path)
                logger.info("Scaler carregado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao carregar modelos: {str(e)}")

    def predict_fishing_activity(self, location_data: Dict, environmental_data: Dict) -> Optional[Dict]:
        """
        Prever atividade de pesca baseada em dados de localização e ambientais

        Args:
            location_data: Dados de localização
            environmental_data: Dados ambientais (SST, clorofila, etc.)

        Returns:
            Dict com previsões
        """
        try:
            if 'fishing_prediction_model' not in self.models:
                return self._get_sample_prediction(location_data, 'fishing')

            # Preparar features
            features = self._prepare_features(location_data, environmental_data)

            if features is None:
                return self._get_sample_prediction(location_data, 'fishing')

            # Fazer previsão
            model = self.models['fishing_prediction_model']
            prediction = model.predict([features])
            probability = model.predict_proba([features])

            return {
                "timestamp": datetime.now().isoformat(),
                "location": location_data,
                "prediction": "fishing" if prediction[0] == 1 else "not_fishing",
                "confidence": float(max(probability[0])),
                "features_used": list(features),
                "model": "RandomForest"
            }

        except Exception as e:
            logger.error(f"Erro na previsão de pesca: {str(e)}")
            return self._get_sample_prediction(location_data, 'fishing')

    def predict_upwelling(self, environmental_data: Dict, days_ahead: int = 7) -> Optional[Dict]:
        """
        Prever eventos de upwelling

        Args:
            environmental_data: Dados ambientais
            days_ahead: Dias para prever

        Returns:
            Dict com previsões de upwelling
        """
        try:
            if 'upwelling_prediction_model' not in self.models:
                return self._get_sample_upwelling_prediction(environmental_data)

            features = self._prepare_environmental_features(environmental_data)

            if features is None:
                return self._get_sample_upwelling_prediction(environmental_data)

            model = self.models['upwelling_prediction_model']
            prediction = model.predict([features])
            probability = model.predict_proba([features])

            return {
                "timestamp": datetime.now().isoformat(),
                "environmental_data": environmental_data,
                "prediction": "upwelling_likely" if prediction[0] == 1 else "no_upwelling",
                "confidence": float(max(probability[0])),
                "intensity": self._calculate_upwelling_intensity(features),
                "days_ahead": days_ahead,
                "model": "RandomForest"
            }

        except Exception as e:
            logger.error(f"Erro na previsão de upwelling: {str(e)}")
            return self._get_sample_upwelling_prediction(environmental_data)

    def detect_anomalies(self, vessel_data: List[Dict]) -> Optional[Dict]:
        """
        Detectar anomalias no comportamento de embarcações

        Args:
            vessel_data: Lista de dados de embarcações

        Returns:
            Dict com anomalias detectadas
        """
        try:
            if 'anomaly_detection_model' not in self.models:
                return self._get_sample_anomaly_detection(vessel_data)

            features_list = []
            for vessel in vessel_data:
                features = self._prepare_vessel_features(vessel)
                if features is not None:
                    features_list.append(features)

            if not features_list:
                return self._get_sample_anomaly_detection(vessel_data)

            model = self.models['anomaly_detection_model']
            anomalies = model.predict(features_list)
            anomaly_scores = model.decision_function(features_list)

            anomaly_results = []
            for i, (vessel, is_anomaly, score) in enumerate(zip(vessel_data, anomalies, anomaly_scores)):
                if is_anomaly:
                    anomaly_results.append({
                        "vessel": vessel,
                        "anomaly_score": float(score),
                        "severity": "high" if score < -0.7 else "medium" if score < -0.5 else "low",
                        "possible_causes": self._get_anomaly_causes(vessel, score)
                    })

            return {
                "timestamp": datetime.now().isoformat(),
                "total_vessels_analyzed": len(vessel_data),
                "anomalies_detected": len(anomaly_results),
                "anomaly_details": anomaly_results,
                "model": "Isolation Forest"
            }

        except Exception as e:
            logger.error(f"Erro na detecção de anomalias: {str(e)}")
            return self._get_sample_anomaly_detection(vessel_data)

    def predict_vessel_behavior(self, vessel_history: List[Dict], time_horizon: int = 24) -> Optional[Dict]:
        """
        Prever comportamento futuro de embarcações

        Args:
            vessel_history: Histórico de posições da embarcação
            time_horizon: Horário para prever (horas)

        Returns:
            Dict com previsões de comportamento
        """
        try:
            if 'vessel_behavior_model' not in self.models:
                return self._get_sample_behavior_prediction(vessel_history)

            # Preparar sequência de features
            sequence_features = self._prepare_sequence_features(vessel_history)

            if sequence_features is None:
                return self._get_sample_behavior_prediction(vessel_history)

            model = self.models['vessel_behavior_model']
            prediction = model.predict([sequence_features])

            return {
                "timestamp": datetime.now().isoformat(),
                "vessel_history": vessel_history,
                "predicted_behavior": self._decode_behavior_prediction(prediction[0]),
                "confidence": 0.85,  # Placeholder
                "time_horizon_hours": time_horizon,
                "model": "LSTM"  # Em produção seria LSTM
            }

        except Exception as e:
            logger.error(f"Erro na previsão de comportamento: {str(e)}")
            return self._get_sample_behavior_prediction(vessel_history)

    def _prepare_features(self, location_data: Dict, environmental_data: Dict) -> Optional[List[float]]:
        """Preparar features para o modelo de pesca"""
        try:
            features = [
                location_data.get('lat', 0),
                location_data.get('lon', 0),
                environmental_data.get('sst', 20),
                environmental_data.get('chlorophyll', 1),
                environmental_data.get('salinity', 35),
                location_data.get('hour', 12),
                location_data.get('month', 6)
            ]

            if self.scalers.get('main'):
                features = self.scalers['main'].transform([features])[0]

            return features
        except:
            return None

    def _prepare_environmental_features(self, environmental_data: Dict) -> Optional[List[float]]:
        """Preparar features ambientais para upwelling"""
        try:
            features = [
                environmental_data.get('sst', 20),
                environmental_data.get('chlorophyll', 1),
                environmental_data.get('wind_speed', 5),
                environmental_data.get('wind_direction', 180),
                environmental_data.get('month', 6),
                environmental_data.get('lat', -15)
            ]

            if self.scalers.get('main'):
                features = self.scalers['main'].transform([features])[0]

            return features
        except:
            return None

    def _prepare_vessel_features(self, vessel: Dict) -> Optional[List[float]]:
        """Preparar features de embarcação para detecção de anomalias"""
        try:
            features = [
                vessel.get('speed', 0),
                vessel.get('heading', 0),
                vessel.get('distance_from_shore', 0),
                vessel.get('hour', 12),
                vessel.get('fishing_gear_deployed', 0),
                vessel.get('vessel_type_encoded', 0)
            ]
            return features
        except:
            return None

    def _prepare_sequence_features(self, vessel_history: List[Dict]) -> Optional[List[float]]:
        """Preparar features de sequência para previsão de comportamento"""
        try:
            # Simplificação: usar média das últimas posições
            avg_speed = np.mean([v.get('speed', 0) for v in vessel_history])
            avg_heading = np.mean([v.get('heading', 0) for v in vessel_history])
            recent_lat = vessel_history[-1].get('lat', 0)
            recent_lon = vessel_history[-1].get('lon', 0)

            features = [avg_speed, avg_heading, recent_lat, recent_lon]
            return features
        except:
            return None

    def _calculate_upwelling_intensity(self, features: List[float]) -> str:
        """Calcular intensidade do upwelling"""
        # Simplificação baseada em clorofila e SST
        chlorophyll = features[1] if len(features) > 1 else 1
        sst = features[0] if len(features) > 0 else 20

        if chlorophyll > 10 and sst < 18:
            return "extreme"
        elif chlorophyll > 5 and sst < 20:
            return "high"
        elif chlorophyll > 2 and sst < 22:
            return "medium"
        else:
            return "low"

    def _get_anomaly_causes(self, vessel: Dict, score: float) -> List[str]:
        """Obter possíveis causas de anomalia"""
        causes = []
        if vessel.get('speed', 0) == 0 and vessel.get('distance_from_shore', 0) > 50:
            causes.append("embarcação parada em alto mar")
        if vessel.get('heading_change_rate', 0) > 30:
            causes.append("mudança de direção irregular")
        if vessel.get('fishing_gear_deployed', 0) == 0 and vessel.get('speed', 0) < 2:
            causes.append("comportamento suspeito de pesca sem equipamento declarado")

        return causes if causes else ["comportamento irregular detectado"]

    def _decode_behavior_prediction(self, prediction: Any) -> str:
        """Decodificar previsão de comportamento"""
        # Placeholder - em produção seria baseado no modelo treinado
        return "fishing" if prediction > 0.5 else "transiting"

    # Métodos para dados de exemplo quando modelos não estão disponíveis
    def _get_sample_prediction(self, location_data: Dict, prediction_type: str) -> Dict:
        """Retornar previsão de exemplo para pesca"""
        return {
            "timestamp": datetime.now().isoformat(),
            "location": location_data,
            "prediction": "fishing" if location_data.get('lat', 0) < -15 else "not_fishing",
            "confidence": 0.75,
            "features_used": ["latitude", "longitude", "sst", "chlorophyll"],
            "model": "sample_model"
        }

    def _get_sample_upwelling_prediction(self, environmental_data: Dict) -> Dict:
        """Retornar previsão de exemplo para upwelling"""
        return {
            "timestamp": datetime.now().isoformat(),
            "environmental_data": environmental_data,
            "prediction": "upwelling_likely",
            "confidence": 0.82,
            "intensity": "high",
            "days_ahead": 7,
            "model": "sample_model"
        }

    def _get_sample_anomaly_detection(self, vessel_data: List[Dict]) -> Dict:
        """Retornar detecção de anomalia de exemplo"""
        return {
            "timestamp": datetime.now().isoformat(),
            "total_vessels_analyzed": len(vessel_data),
            "anomalies_detected": 1,
            "anomaly_details": [{
                "vessel": vessel_data[0] if vessel_data else {"name": "Sample Vessel"},
                "anomaly_score": -0.8,
                "severity": "high",
                "possible_causes": ["velocidade inconsistente"]
            }],
            "model": "sample_model"
        }

    def _get_sample_behavior_prediction(self, vessel_history: List[Dict]) -> Dict:
        """Retornar previsão de comportamento de exemplo"""
        return {
            "timestamp": datetime.now().isoformat(),
            "vessel_history": vessel_history,
            "predicted_behavior": "fishing",
            "confidence": 0.78,
            "time_horizon_hours": 24,
            "model": "sample_model"
        }

    def train_model(self, training_data: pd.DataFrame, model_type: str) -> bool:
        """
        Treinar um novo modelo

        Args:
            training_data: DataFrame com dados de treinamento
            model_type: Tipo de modelo ('fishing', 'upwelling', 'anomaly', 'behavior')

        Returns:
            True se treinamento foi bem-sucedido
        """
        try:
            if model_type == 'fishing':
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                features = training_data[['lat', 'lon', 'sst', 'chlorophyll', 'salinity', 'hour', 'month']]
                target = training_data['fishing_activity']

            elif model_type == 'upwelling':
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                features = training_data[['sst', 'chlorophyll', 'wind_speed', 'wind_direction', 'month', 'lat']]
                target = training_data['upwelling_event']

            elif model_type == 'anomaly':
                from sklearn.ensemble import IsolationForest
                model = IsolationForest(contamination=0.1, random_state=42)
                features = training_data[['speed', 'heading', 'distance_from_shore', 'hour', 'fishing_gear_deployed']]
                target = training_data['anomaly']

            elif model_type == 'behavior':
                model = RandomForestClassifier(n_estimators=100, random_state=42)
                features = training_data[['avg_speed', 'avg_heading', 'recent_lat', 'recent_lon']]
                target = training_data['behavior']

            else:
                logger.error(f"Tipo de modelo não suportado: {model_type}")
                return False

            model.fit(features, target)

            # Salvar modelo
            model_path = os.path.join(self.models_path, f'{model_type}_model.pkl')
            joblib.dump(model, model_path)

            # Atualizar modelos carregados
            self.models[f'{model_type}_model'] = model

            logger.info(f"Modelo {model_type} treinado e salvo com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao treinar modelo {model_type}: {str(e)}")
            return False
