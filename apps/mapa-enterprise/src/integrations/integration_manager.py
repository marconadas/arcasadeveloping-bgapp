"""
Gerenciador de integrações - Coordena todas as APIs
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from config.settings import get_config

from .copernicus import CopernicusIntegration
from .gfw import GFWIntegration
from .machine_learning import MachineLearningIntegration
from .qgis import QGISIntegration

logger = logging.getLogger(__name__)

class IntegrationManager:
    """Classe principal para gerenciar todas as integrações"""

    def __init__(self):
        self.config = get_config()
        self.copernicus = None
        self.gfw = None
        self.ml = None
        self.qgis = None

        self._initialize_integrations()

    def _initialize_integrations(self):
        """Inicializar todas as integrações"""
        try:
            self.copernicus = CopernicusIntegration()
            logger.info("Integração Copernicus inicializada")
        except Exception as e:
            logger.error(f"Erro ao inicializar Copernicus: {str(e)}")

        try:
            self.gfw = GFWIntegration()
            logger.info("Integração GFW inicializada")
        except Exception as e:
            logger.error(f"Erro ao inicializar GFW: {str(e)}")

        try:
            self.ml = MachineLearningIntegration()
            logger.info("Integração ML inicializada")
        except Exception as e:
            logger.error(f"Erro ao inicializar ML: {str(e)}")

        try:
            self.qgis = QGISIntegration()
            logger.info("Integração QGIS inicializada")
        except Exception as e:
            logger.error(f"Erro ao inicializar QGIS: {str(e)}")

    def get_all_data(self, bbox: List[float] = None) -> Dict[str, Any]:
        """
        Obter dados de todas as integrações

        Args:
            bbox: [min_lon, min_lat, max_lon, max_lat]

        Returns:
            Dict com dados de todas as fontes
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "bbox": bbox,
            "integrations": {}
        }

        # Dados do Copernicus
        if self.copernicus:
            try:
                ocean_data = self.copernicus.get_ocean_data(bbox)
                wind_data = self.copernicus.get_wind_data(bbox)
                upwelling_data = self.copernicus.get_upwelling_data(bbox)

                result["integrations"]["copernicus"] = {
                    "status": "success",
                    "ocean_data": ocean_data,
                    "wind_data": wind_data,
                    "upwelling_data": upwelling_data
                }
                logger.info("Dados Copernicus obtidos com sucesso")
            except Exception as e:
                result["integrations"]["copernicus"] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Erro ao obter dados Copernicus: {str(e)}")

        # Dados do GFW
        if self.gfw:
            try:
                vessel_data = self.gfw.get_vessel_data(bbox)
                fishing_effort = self.gfw.get_fishing_effort(bbox)
                encounters = self.gfw.get_encounters(bbox)
                loitering = self.gfw.get_loitering_events(bbox)

                result["integrations"]["gfw"] = {
                    "status": "success",
                    "vessel_data": vessel_data,
                    "fishing_effort": fishing_effort,
                    "encounters": encounters,
                    "loitering": loitering
                }
                logger.info("Dados GFW obtidos com sucesso")
            except Exception as e:
                result["integrations"]["gfw"] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Erro ao obter dados GFW: {str(e)}")

        # Dados de Machine Learning
        if self.ml:
            try:
                # Preparar dados para ML
                location_data = {"lat": -11.2027, "lon": 17.8739}  # Angola
                environmental_data = {
                    "sst": 22.1,
                    "chlorophyll": 4.2,
                    "salinity": 35.0,
                    "wind_speed": 8.5,
                    "wind_direction": 225
                }

                fishing_prediction = self.ml.predict_fishing_activity(location_data, environmental_data)
                upwelling_prediction = self.ml.predict_upwelling(environmental_data)
                anomaly_detection = self.ml.detect_anomalies([{
                    "name": "Sample Vessel",
                    "speed": 2.5,
                    "heading": 180,
                    "distance_from_shore": 25
                }])

                result["integrations"]["machine_learning"] = {
                    "status": "success",
                    "fishing_prediction": fishing_prediction,
                    "upwelling_prediction": upwelling_prediction,
                    "anomaly_detection": anomaly_detection
                }
                logger.info("Dados ML obtidos com sucesso")
            except Exception as e:
                result["integrations"]["machine_learning"] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Erro ao obter dados ML: {str(e)}")

        # Dados do QGIS
        if self.qgis:
            try:
                layers_info = self.qgis.get_all_layers_info()
                fishing_stats = self.qgis.get_fishing_statistics()

                result["integrations"]["qgis"] = {
                    "status": "success",
                    "layers_info": layers_info,
                    "fishing_statistics": fishing_stats
                }
                logger.info("Dados QGIS obtidos com sucesso")
            except Exception as e:
                result["integrations"]["qgis"] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"Erro ao obter dados QGIS: {str(e)}")

        return result

    def analyze_vessel(self, vessel_data: Dict) -> Dict:
        """
        Análise completa de uma embarcação usando todas as integrações

        Args:
            vessel_data: Dados da embarcação

        Returns:
            Dict com análise completa
        """
        analysis = {
            "timestamp": datetime.now().isoformat(),
            "vessel": vessel_data,
            "analysis": {}
        }

        # Análise QGIS (conformidade)
        if self.qgis:
            try:
                compliance_analysis = self.qgis.analyze_vessel_compliance(vessel_data)
                analysis["analysis"]["qgis_compliance"] = compliance_analysis
            except Exception as e:
                analysis["analysis"]["qgis_compliance"] = {"error": str(e)}

        # Análise ML (comportamento)
        if self.ml:
            try:
                anomaly_analysis = self.ml.detect_anomalies([vessel_data])
                analysis["analysis"]["ml_anomaly"] = anomaly_analysis
            except Exception as e:
                analysis["analysis"]["ml_anomaly"] = {"error": str(e)}

        # Verificar Copernicus (dados ambientais)
        if self.copernicus:
            try:
                ocean_data = self.copernicus.get_ocean_data()
                if ocean_data and 'data' in ocean_data:
                    # Encontrar dados mais próximos da embarcação
                    vessel_point = (vessel_data.get('lat', 0), vessel_data.get('lon', 0))
                    closest_data = min(
                        ocean_data['data'],
                        key=lambda x: ((x['lat'] - vessel_point[0])**2 + (x['lon'] - vessel_point[1])**2)
                    )
                    analysis["analysis"]["copernicus_environmental"] = closest_data
            except Exception as e:
                analysis["analysis"]["copernicus_environmental"] = {"error": str(e)}

        # Verificar GFW (atividade de pesca)
        if self.gfw:
            try:
                # Verificar se a embarcação está em área de pesca
                fishing_effort = self.gfw.get_fishing_effort()
                if fishing_effort:
                    analysis["analysis"]["gfw_fishing_effort"] = fishing_effort
            except Exception as e:
                analysis["analysis"]["gfw_fishing_effort"] = {"error": str(e)}

        return analysis

    def get_real_time_updates(self) -> Dict[str, Any]:
        """
        Obter atualizações em tempo real de todas as integrações

        Returns:
            Dict com dados de real-time
        """
        realtime_data = {
            "timestamp": datetime.now().isoformat(),
            "updates": {}
        }

        # Atualizações Copernicus (dados mais recentes)
        if self.copernicus:
            try:
                connection_status = self.copernicus.check_connection()
                realtime_data["updates"]["copernicus"] = {
                    "status": "connected" if connection_status else "disconnected",
                    "last_update": datetime.now().isoformat()
                }
            except:
                realtime_data["updates"]["copernicus"] = {"status": "error"}

        # Atualizações GFW
        if self.gfw:
            try:
                connection_status = self.gfw.check_connection()
                realtime_data["updates"]["gfw"] = {
                    "status": "connected" if connection_status else "disconnected",
                    "last_update": datetime.now().isoformat()
                }
            except:
                realtime_data["updates"]["gfw"] = {"status": "error"}

        # Status dos modelos ML
        if self.ml:
            try:
                model_count = len(self.ml.models)
                realtime_data["updates"]["ml"] = {
                    "status": "active",
                    "models_loaded": model_count,
                    "last_prediction": datetime.now().isoformat()
                }
            except:
                realtime_data["updates"]["ml"] = {"status": "error"}

        # Status QGIS
        if self.qgis:
            try:
                layers_info = self.qgis.get_all_layers_info()
                realtime_data["updates"]["qgis"] = {
                    "status": "active",
                    "layers_loaded": len(layers_info),
                    "last_update": datetime.now().isoformat()
                }
            except:
                realtime_data["updates"]["qgis"] = {"status": "error"}

        return realtime_data

    def get_status_summary(self) -> Dict[str, Any]:
        """
        Obter resumo do status de todas as integrações

        Returns:
            Dict com status de todas as integrações
        """
        status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "operational",
            "integrations": {}
        }

        integrations = [
            ("copernicus", self.copernicus),
            ("gfw", self.gfw),
            ("machine_learning", self.ml),
            ("qgis", self.qgis)
        ]

        all_operational = True

        for name, integration in integrations:
            if integration is None:
                status["integrations"][name] = {
                    "status": "not_initialized",
                    "error": "Integration not initialized"
                }
                all_operational = False
            elif hasattr(integration, 'check_connection') and integration.check_connection():
                status["integrations"][name] = {
                    "status": "operational",
                    "last_check": datetime.now().isoformat()
                }
            else:
                status["integrations"][name] = {
                    "status": "error",
                    "last_check": datetime.now().isoformat()
                }
                all_operational = False

        if not all_operational:
            status["overall_status"] = "degraded"

        return status
