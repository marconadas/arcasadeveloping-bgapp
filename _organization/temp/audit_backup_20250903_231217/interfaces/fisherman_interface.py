#!/usr/bin/env python3
"""
BGAPP Fisherman Interface - Interface Prática para Pescadores
Interface simplificada e prática para pescadores angolanos com informações
essenciais: condições do mar, zonas de pesca, previsões e regulamentações.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
from dataclasses import dataclass
from enum import Enum

# Configurar logging
logger = logging.getLogger(__name__)


class SeaCondition(Enum):
    """Condições do mar"""
    CALM = "calmo"
    SLIGHT = "ligeiramente agitado"
    MODERATE = "moderadamente agitado"
    ROUGH = "agitado"
    VERY_ROUGH = "muito agitado"
    HIGH = "mar alto"
    VERY_HIGH = "mar muito alto"


class WeatherCondition(Enum):
    """Condições meteorológicas"""
    CLEAR = "céu limpo"
    PARTLY_CLOUDY = "parcialmente nublado"
    CLOUDY = "nublado"
    LIGHT_RAIN = "chuva fraca"
    MODERATE_RAIN = "chuva moderada"
    HEAVY_RAIN = "chuva forte"
    THUNDERSTORM = "trovoada"
    FOG = "nevoeiro"


class FishingRecommendation(Enum):
    """Recomendações de pesca"""
    EXCELLENT = "excelente"
    GOOD = "bom"
    FAIR = "razoável"
    POOR = "fraco"
    NOT_RECOMMENDED = "não recomendado"


@dataclass
class FishingZoneInfo:
    """Informações da zona de pesca"""
    name: str
    description: str
    coordinates: Tuple[float, float, float, float]  # (south, north, west, east)
    depth_range: Tuple[int, int]
    main_species: List[str]
    best_season: List[str]
    fishing_methods: List[str]
    ports: List[str]
    regulations: List[str]


@dataclass
class SeaConditions:
    """Condições atuais do mar"""
    wave_height: float
    wave_period: float
    wind_speed: float
    wind_direction: str
    sea_condition: SeaCondition
    weather: WeatherCondition
    visibility: float
    temperature: float
    recommendation: FishingRecommendation


class FishermanInterface:
    """
    🎣 Interface Prática para Pescadores
    
    Interface simplificada com informações essenciais para pescadores:
    condições do mar, zonas de pesca, previsões meteorológicas e regulamentações.
    """
    
    def __init__(self):
        """Inicializar interface para pescadores"""
        
        # Zonas de pesca de Angola
        self.fishing_zones = {
            'norte': FishingZoneInfo(
                name="Zona Norte",
                description="Cabinda até Luanda - Rica em atuns e pelágicos",
                coordinates=(-8.8, -4.2, 8.5, 13.5),
                depth_range=(10, 2000),
                main_species=[
                    "Atum-amarelo", "Gaiado", "Sardinha", "Cavala",
                    "Dourado", "Espadarte", "Bonito"
                ],
                best_season=["Dezembro", "Janeiro", "Fevereiro", "Março"],
                fishing_methods=[
                    "Palangre de superfície", "Cerco", "Linha de mão",
                    "Rede de emalhar", "Arrasto pelágico"
                ],
                ports=["Cabinda", "Soyo", "Luanda"],
                regulations=[
                    "Licença de pesca obrigatória",
                    "Tamanho mínimo atum: 60cm",
                    "Proibição de pesca com explosivos",
                    "Respeitar áreas de proteção marinha"
                ]
            ),
            'centro': FishingZoneInfo(
                name="Zona Centro",
                description="Luanda até Lobito - Diversidade de espécies costeiras",
                coordinates=(-12.8, -8.8, 8.5, 14.0),
                depth_range=(5, 500),
                main_species=[
                    "Sardinha", "Anchova", "Cavala", "Chicharro",
                    "Pargo", "Robalo", "Linguado"
                ],
                best_season=["Maio", "Junho", "Julho", "Agosto"],
                fishing_methods=[
                    "Cerco", "Arrasto costeiro", "Rede de emalhar",
                    "Armadilhas", "Linha de mão"
                ],
                ports=["Luanda", "Ambriz", "Lobito"],
                regulations=[
                    "Período de defeso da sardinha: Set-Nov",
                    "Malha mínima redes: 25mm",
                    "Limite diário sardinha: 50kg por pescador",
                    "Proibido pescar a menos de 3 milhas da costa"
                ]
            ),
            'sul': FishingZoneInfo(
                name="Zona Sul",
                description="Lobito até Cunene - Upwelling e pescada",
                coordinates=(-18.2, -12.8, 8.5, 15.0),
                depth_range=(20, 800),
                main_species=[
                    "Pescada", "Chicharro", "Sardinha", "Anchova",
                    "Linguado", "Carapau", "Peixe-espada"
                ],
                best_season=["Abril", "Maio", "Junho", "Julho", "Agosto"],
                fishing_methods=[
                    "Arrasto de fundo", "Palangre de fundo",
                    "Rede de emalhar", "Cerco", "Armadilhas"
                ],
                ports=["Lobito", "Benguela", "Namibe", "Tombwa"],
                regulations=[
                    "Pescada mínima: 30cm",
                    "Período de defeso: Out-Dez",
                    "Limite arrasto: 6 milhas da costa",
                    "Obrigatório VMS em embarcações >12m"
                ]
            )
        }
        
        # Portos e suas características
        self.ports_info = {
            'Luanda': {
                'coordinates': (-8.8390, 13.2894),
                'type': 'principal',
                'services': ['Combustível', 'Gelo', 'Reparações', 'Mercado', 'Capitania'],
                'depth': 12,
                'protection': 'excelente',
                'contact': 'VHF Canal 16'
            },
            'Lobito': {
                'coordinates': (-12.3486, 13.5472),
                'type': 'principal',
                'services': ['Combustível', 'Gelo', 'Reparações', 'Mercado'],
                'depth': 10,
                'protection': 'boa',
                'contact': 'VHF Canal 12'
            },
            'Benguela': {
                'coordinates': (-12.5763, 13.4055),
                'type': 'secundário',
                'services': ['Combustível', 'Gelo', 'Mercado'],
                'depth': 8,
                'protection': 'moderada',
                'contact': 'VHF Canal 16'
            },
            'Namibe': {
                'coordinates': (-15.1961, 12.1522),
                'type': 'secundário',
                'services': ['Combustível', 'Gelo', 'Reparações'],
                'depth': 6,
                'protection': 'boa',
                'contact': 'VHF Canal 14'
            },
            'Cabinda': {
                'coordinates': (-5.5550, 12.2022),
                'type': 'principal',
                'services': ['Combustível', 'Gelo', 'Reparações', 'Mercado'],
                'depth': 15,
                'protection': 'excelente',
                'contact': 'VHF Canal 16'
            },
            'Soyo': {
                'coordinates': (-6.1358, 12.3689),
                'type': 'secundário',
                'services': ['Combustível', 'Gelo'],
                'depth': 7,
                'protection': 'moderada',
                'contact': 'VHF Canal 12'
            }
        }
        
        # Espécies comerciais e suas características
        self.commercial_species = {
            'Atum-amarelo': {
                'scientific_name': 'Thunnus albacares',
                'min_size': 60,  # cm
                'closed_season': [],
                'best_depth': (0, 200),
                'best_time': 'madrugada',
                'bait': ['lulas', 'sardinhas', 'iscas artificiais'],
                'market_value': 'alto'
            },
            'Sardinha': {
                'scientific_name': 'Sardina pilchardus',
                'min_size': 11,
                'closed_season': ['Setembro', 'Outubro', 'Novembro'],
                'best_depth': (10, 80),
                'best_time': 'noite',
                'bait': ['plâncton'],
                'market_value': 'médio'
            },
            'Pescada': {
                'scientific_name': 'Merluccius capensis',
                'min_size': 30,
                'closed_season': ['Outubro', 'Novembro', 'Dezembro'],
                'best_depth': (50, 400),
                'best_time': 'noite',
                'bait': ['lulas', 'peixes pequenos'],
                'market_value': 'alto'
            },
            'Cavala': {
                'scientific_name': 'Scomber japonicus',
                'min_size': 20,
                'closed_season': [],
                'best_depth': (20, 150),
                'best_time': 'manhã',
                'bait': ['sardinhas', 'anchovas'],
                'market_value': 'médio'
            }
        }
        
        # Códigos de segurança marítima
        self.safety_codes = {
            'vhf_channels': {
                16: 'Canal de emergência internacional',
                12: 'Porto e tráfego local',
                14: 'Porto alternativo',
                6: 'Segurança e coordenação'
            },
            'emergency_contacts': {
                'Guarda Costeira': 'VHF 16 / Tel: 222-000-000',
                'Capitania Luanda': 'VHF 16 / Tel: 222-000-001',
                'Emergência Médica': 'Tel: 112',
                'Salvamento Marítimo': 'VHF 16 / Tel: 222-000-002'
            },
            'weather_warnings': {
                'verde': 'Condições normais',
                'amarelo': 'Cuidado - condições adversas possíveis',
                'laranja': 'Perigo - condições adversas prováveis',
                'vermelho': 'Perigo extremo - não sair para o mar'
            }
        }
    
    def get_current_sea_conditions(self, 
                                 zone: str = "centro",
                                 location: Optional[Tuple[float, float]] = None) -> SeaConditions:
        """
        🌊 Obter condições atuais do mar
        
        Args:
            zone: Zona de pesca ('norte', 'centro', 'sul')
            location: Coordenadas específicas (lat, lon)
            
        Returns:
            Condições atuais do mar
        """
        
        # Simular dados baseados na zona (seria substituído por dados reais)
        np.random.seed(int(datetime.now().timestamp()) % 100)
        
        if zone == "norte":
            # Águas mais calmas, menos vento
            wave_height = np.random.uniform(0.5, 2.0)
            wind_speed = np.random.uniform(5, 15)
        elif zone == "centro":
            # Condições moderadas
            wave_height = np.random.uniform(1.0, 2.5)
            wind_speed = np.random.uniform(8, 18)
        else:  # sul
            # Mais agitado devido ao upwelling
            wave_height = np.random.uniform(1.5, 3.5)
            wind_speed = np.random.uniform(10, 25)
        
        # Determinar condição do mar baseada na altura das ondas
        if wave_height < 0.5:
            sea_condition = SeaCondition.CALM
        elif wave_height < 1.25:
            sea_condition = SeaCondition.SLIGHT
        elif wave_height < 2.5:
            sea_condition = SeaCondition.MODERATE
        elif wave_height < 4.0:
            sea_condition = SeaCondition.ROUGH
        else:
            sea_condition = SeaCondition.VERY_ROUGH
        
        # Condições meteorológicas
        weather_options = [WeatherCondition.CLEAR, WeatherCondition.PARTLY_CLOUDY, 
                          WeatherCondition.CLOUDY, WeatherCondition.LIGHT_RAIN]
        weather = np.random.choice(weather_options)
        
        # Recomendação de pesca
        if wave_height < 1.5 and wind_speed < 15:
            recommendation = FishingRecommendation.EXCELLENT
        elif wave_height < 2.5 and wind_speed < 20:
            recommendation = FishingRecommendation.GOOD
        elif wave_height < 3.5 and wind_speed < 25:
            recommendation = FishingRecommendation.FAIR
        else:
            recommendation = FishingRecommendation.NOT_RECOMMENDED
        
        return SeaConditions(
            wave_height=round(wave_height, 1),
            wave_period=round(np.random.uniform(4, 12), 1),
            wind_speed=round(wind_speed, 1),
            wind_direction=np.random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
            sea_condition=sea_condition,
            weather=weather,
            visibility=round(np.random.uniform(2, 20), 1),
            temperature=round(np.random.uniform(20, 28), 1),
            recommendation=recommendation
        )
    
    def create_fisherman_dashboard(self, 
                                 zone: str = "centro",
                                 user_location: Optional[str] = None) -> str:
        """
        🎣 Criar dashboard para pescadores
        
        Args:
            zone: Zona de pesca preferida
            user_location: Porto base do pescador
            
        Returns:
            Dashboard HTML completo
        """
        
        # Obter condições atuais
        conditions = self.get_current_sea_conditions(zone)
        zone_info = self.fishing_zones[zone]
        
        # Previsão para próximos dias
        forecast = self._generate_fishing_forecast(zone, 5)
        
        # Recomendações de espécies
        species_recommendations = self._get_species_recommendations(zone, datetime.now())
        
        dashboard_html = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard do Pescador - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
                    color: #333;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                .conditions-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .condition-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    border-left: 5px solid #0ea5e9;
                }}
                .condition-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #1e3a8a;
                    margin: 10px 0;
                }}
                .condition-label {{
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }}
                .recommendation {{
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: center;
                    font-size: 1.2em;
                    font-weight: bold;
                }}
                .excellent {{ background: #dcfce7; color: #166534; border: 2px solid #16a34a; }}
                .good {{ background: #dbeafe; color: #1d4ed8; border: 2px solid #3b82f6; }}
                .fair {{ background: #fef3c7; color: #92400e; border: 2px solid #f59e0b; }}
                .poor {{ background: #fee2e2; color: #dc2626; border: 2px solid #ef4444; }}
                .not-recommended {{ background: #fecaca; color: #991b1b; border: 2px solid #dc2626; }}
                .species-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .species-card {{
                    background: white;
                    border-radius: 10px;
                    padding: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .forecast-table {{
                    width: 100%;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin: 20px 0;
                }}
                .forecast-table th, .forecast-table td {{
                    padding: 12px;
                    text-align: center;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .forecast-table th {{
                    background: #1e3a8a;
                    color: white;
                }}
                .safety-section {{
                    background: #fef3c7;
                    border: 2px solid #f59e0b;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .port-info {{
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .regulation {{
                    background: #fef2f2;
                    border-left: 4px solid #ef4444;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                }}
                .icon {{
                    font-size: 2em;
                    margin-bottom: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="icon">🐟</div>
                <h1>MARÍTIMO ANGOLA</h1>
                <h2>Dashboard do Pescador</h2>
                <p>{zone_info.name} - {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>
            
            <!-- Condições Atuais do Mar -->
            <h2>🌊 Condições Atuais do Mar</h2>
            <div class="conditions-grid">
                <div class="condition-card">
                    <div class="condition-label">Altura das Ondas</div>
                    <div class="condition-value">{conditions.wave_height}m</div>
                    <div>{conditions.sea_condition.value.title()}</div>
                </div>
                <div class="condition-card">
                    <div class="condition-label">Vento</div>
                    <div class="condition-value">{conditions.wind_speed} km/h</div>
                    <div>Direção: {conditions.wind_direction}</div>
                </div>
                <div class="condition-card">
                    <div class="condition-label">Tempo</div>
                    <div class="condition-value">{conditions.temperature}°C</div>
                    <div>{conditions.weather.value.title()}</div>
                </div>
                <div class="condition-card">
                    <div class="condition-label">Visibilidade</div>
                    <div class="condition-value">{conditions.visibility} km</div>
                    <div>{'Boa' if conditions.visibility > 10 else 'Limitada' if conditions.visibility > 5 else 'Má'}</div>
                </div>
            </div>
            
            <!-- Recomendação de Pesca -->
            <div class="recommendation {conditions.recommendation.value.replace(' ', '-')}">
                🎣 Condições para Pesca: {conditions.recommendation.value.upper()}
                {self._get_recommendation_advice(conditions.recommendation)}
            </div>
        """
        
        # Adicionar previsão
        dashboard_html += """
            <h2>📅 Previsão para os Próximos Dias</h2>
            <table class="forecast-table">
                <tr>
                    <th>Data</th>
                    <th>Ondas (m)</th>
                    <th>Vento (km/h)</th>
                    <th>Tempo</th>
                    <th>Recomendação</th>
                </tr>
        """
        
        for day_forecast in forecast:
            rec_class = day_forecast['recommendation'].value.replace(' ', '-')
            dashboard_html += f"""
                <tr>
                    <td>{day_forecast['date'].strftime('%d/%m')}</td>
                    <td>{day_forecast['wave_height']}m</td>
                    <td>{day_forecast['wind_speed']} km/h</td>
                    <td>{day_forecast['weather'].value.title()}</td>
                    <td><span class="recommendation {rec_class}" style="padding: 5px 10px; border-radius: 5px; font-size: 0.8em;">
                        {day_forecast['recommendation'].value.title()}
                    </span></td>
                </tr>
            """
        
        dashboard_html += "</table>"
        
        # Espécies recomendadas
        dashboard_html += f"""
            <h2>🐠 Espécies Recomendadas para {zone_info.name}</h2>
            <div class="species-grid">
        """
        
        for species in species_recommendations:
            species_info = self.commercial_species.get(species, {})
            dashboard_html += f"""
                <div class="species-card">
                    <h4>{species}</h4>
                    <p><strong>Tamanho mínimo:</strong> {species_info.get('min_size', 'N/A')} cm</p>
                    <p><strong>Melhor profundidade:</strong> {species_info.get('best_depth', (0, 0))[0]}-{species_info.get('best_depth', (0, 0))[1]} m</p>
                    <p><strong>Melhor hora:</strong> {species_info.get('best_time', 'N/A')}</p>
                    <p><strong>Iscas:</strong> {', '.join(species_info.get('bait', []))}</p>
                    <p><strong>Valor de mercado:</strong> {species_info.get('market_value', 'N/A')}</p>
                </div>
            """
        
        dashboard_html += "</div>"
        
        # Informações do porto
        if user_location and user_location in self.ports_info:
            port_info = self.ports_info[user_location]
            dashboard_html += f"""
                <div class="port-info">
                    <h3>🏠 Porto Base: {user_location}</h3>
                    <p><strong>Tipo:</strong> {port_info['type'].title()}</p>
                    <p><strong>Profundidade:</strong> {port_info['depth']} metros</p>
                    <p><strong>Proteção:</strong> {port_info['protection'].title()}</p>
                    <p><strong>Contacto:</strong> {port_info['contact']}</p>
                    <p><strong>Serviços disponíveis:</strong> {', '.join(port_info['services'])}</p>
                </div>
            """
        
        # Regulamentações
        dashboard_html += f"""
            <h2>⚖️ Regulamentações da {zone_info.name}</h2>
        """
        
        for regulation in zone_info.regulations:
            dashboard_html += f'<div class="regulation">⚠️ {regulation}</div>'
        
        # Segurança marítima
        dashboard_html += f"""
            <div class="safety-section">
                <h3>🚨 Segurança Marítima</h3>
                <p><strong>Emergência:</strong> VHF Canal 16</p>
                <p><strong>Guarda Costeira:</strong> {self.safety_codes['emergency_contacts']['Guarda Costeira']}</p>
                <p><strong>Emergência Médica:</strong> {self.safety_codes['emergency_contacts']['Emergência Médica']}</p>
                <p><strong>⚠️ Lembre-se sempre:</strong></p>
                <ul>
                    <li>Verificar equipamentos de segurança antes de sair</li>
                    <li>Informar plano de navegação a familiares</li>
                    <li>Manter VHF ligado no canal 16</li>
                    <li>Respeitar limites de pesca e tamanhos mínimos</li>
                </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: white; padding: 20px; border-radius: 10px;">
                <p><em>Dashboard atualizado automaticamente pelo sistema BGAPP</em></p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Pesca Responsável e Segura</p>
                <p>Zona Económica Exclusiva: 518.000 km² - Pesca Sustentável</p>
            </div>
        </body>
        </html>
        """
        
        return dashboard_html
    
    def _get_recommendation_advice(self, recommendation: FishingRecommendation) -> str:
        """Obter conselho baseado na recomendação"""
        
        advice = {
            FishingRecommendation.EXCELLENT: " - Condições ideais para pesca!",
            FishingRecommendation.GOOD: " - Boas condições, pesca recomendada",
            FishingRecommendation.FAIR: " - Condições aceitáveis, cuidado extra necessário",
            FishingRecommendation.POOR: " - Condições difíceis, considere adiar",
            FishingRecommendation.NOT_RECOMMENDED: " - Condições perigosas, NÃO sair para o mar!"
        }
        
        return advice.get(recommendation, "")
    
    def _generate_fishing_forecast(self, zone: str, days: int) -> List[Dict[str, Any]]:
        """Gerar previsão de pesca para próximos dias"""
        
        forecast = []
        base_date = datetime.now()
        
        for i in range(1, days + 1):
            forecast_date = base_date + timedelta(days=i)
            
            # Simular condições (seria substituído por dados reais)
            np.random.seed(int(forecast_date.timestamp()) % 100)
            
            if zone == "norte":
                wave_height = np.random.uniform(0.8, 2.2)
                wind_speed = np.random.uniform(6, 16)
            elif zone == "centro":
                wave_height = np.random.uniform(1.2, 2.8)
                wind_speed = np.random.uniform(9, 19)
            else:  # sul
                wave_height = np.random.uniform(1.8, 3.8)
                wind_speed = np.random.uniform(12, 26)
            
            # Determinar recomendação
            if wave_height < 1.5 and wind_speed < 15:
                recommendation = FishingRecommendation.EXCELLENT
            elif wave_height < 2.5 and wind_speed < 20:
                recommendation = FishingRecommendation.GOOD
            elif wave_height < 3.5 and wind_speed < 25:
                recommendation = FishingRecommendation.FAIR
            else:
                recommendation = FishingRecommendation.NOT_RECOMMENDED
            
            weather_options = [WeatherCondition.CLEAR, WeatherCondition.PARTLY_CLOUDY, 
                              WeatherCondition.CLOUDY, WeatherCondition.LIGHT_RAIN]
            weather = np.random.choice(weather_options)
            
            forecast.append({
                'date': forecast_date,
                'wave_height': round(wave_height, 1),
                'wind_speed': round(wind_speed, 1),
                'weather': weather,
                'recommendation': recommendation
            })
        
        return forecast
    
    def _get_species_recommendations(self, zone: str, current_date: datetime) -> List[str]:
        """Obter recomendações de espécies baseadas na zona e época"""
        
        current_month = current_date.strftime('%B')
        month_mapping = {
            'January': 'Janeiro', 'February': 'Fevereiro', 'March': 'Março',
            'April': 'Abril', 'May': 'Maio', 'June': 'Junho',
            'July': 'Julho', 'August': 'Agosto', 'September': 'Setembro',
            'October': 'Outubro', 'November': 'Novembro', 'December': 'Dezembro'
        }
        current_month_pt = month_mapping.get(current_month, current_month)
        
        zone_info = self.fishing_zones[zone]
        recommended_species = []
        
        for species_name, species_info in self.commercial_species.items():
            # Verificar se não está em período de defeso
            if current_month_pt not in species_info['closed_season']:
                # Verificar se a espécie é comum na zona
                if species_name in zone_info.main_species:
                    recommended_species.append(species_name)
        
        return recommended_species[:6]  # Limitar a 6 espécies
    
    def generate_fishing_log_template(self, zone: str = "centro") -> str:
        """
        📝 Gerar template de diário de pesca
        
        Args:
            zone: Zona de pesca
            
        Returns:
            Template HTML do diário de pesca
        """
        
        zone_info = self.fishing_zones[zone]
        
        log_template = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Diário de Pesca - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                }}
                .header {{
                    background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .form-section {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    margin: 20px 0;
                    padding: 20px;
                }}
                .form-row {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 15px 0;
                }}
                .form-group {{
                    margin: 10px 0;
                }}
                .form-group label {{
                    display: block;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #1e3a8a;
                }}
                .form-group input, .form-group select, .form-group textarea {{
                    width: 100%;
                    padding: 8px;
                    border: 2px solid #d1d5db;
                    border-radius: 5px;
                    font-size: 14px;
                }}
                .catch-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }}
                .catch-table th, .catch-table td {{
                    border: 1px solid #d1d5db;
                    padding: 8px;
                    text-align: left;
                }}
                .catch-table th {{
                    background: #f3f4f6;
                    font-weight: bold;
                }}
                .species-list {{
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 15px;
                    margin: 15px 0;
                }}
                .print-btn {{
                    background: #1e3a8a;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px 5px;
                }}
                .print-btn:hover {{
                    background: #1e40af;
                }}
                @media print {{
                    .print-btn {{ display: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐟 MARÍTIMO ANGOLA</h1>
                <h2>Diário de Pesca</h2>
                <p>{zone_info.name} - Template de Registo</p>
            </div>
            
            <div class="form-section">
                <h3>📅 Informações da Viagem</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="data">Data da Pesca:</label>
                        <input type="date" id="data" name="data" value="{datetime.now().strftime('%Y-%m-%d')}">
                    </div>
                    <div class="form-group">
                        <label for="pescador">Nome do Pescador:</label>
                        <input type="text" id="pescador" name="pescador" placeholder="Seu nome completo">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="embarcacao">Nome da Embarcação:</label>
                        <input type="text" id="embarcacao" name="embarcacao" placeholder="Nome da embarcação">
                    </div>
                    <div class="form-group">
                        <label for="licenca">Número da Licença:</label>
                        <input type="text" id="licenca" name="licenca" placeholder="Número da licença de pesca">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>🗺️ Localização e Condições</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="porto_saida">Porto de Saída:</label>
                        <select id="porto_saida" name="porto_saida">
                            <option value="">Selecione o porto</option>
        """
        
        for port in zone_info.ports:
            log_template += f'<option value="{port}">{port}</option>'
        
        log_template += f"""
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="zona_pesca">Zona de Pesca:</label>
                        <input type="text" id="zona_pesca" name="zona_pesca" value="{zone_info.name}" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="latitude">Latitude (GPS):</label>
                        <input type="text" id="latitude" name="latitude" placeholder="Ex: -12.5763">
                    </div>
                    <div class="form-group">
                        <label for="longitude">Longitude (GPS):</label>
                        <input type="text" id="longitude" name="longitude" placeholder="Ex: 13.4055">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="profundidade">Profundidade (m):</label>
                        <input type="number" id="profundidade" name="profundidade" placeholder="Profundidade em metros">
                    </div>
                    <div class="form-group">
                        <label for="metodo_pesca">Método de Pesca:</label>
                        <select id="metodo_pesca" name="metodo_pesca">
                            <option value="">Selecione o método</option>
        """
        
        for method in zone_info.fishing_methods:
            log_template += f'<option value="{method}">{method}</option>'
        
        log_template += f"""
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>🌊 Condições Ambientais</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="altura_ondas">Altura das Ondas (m):</label>
                        <input type="number" step="0.1" id="altura_ondas" name="altura_ondas" placeholder="Ex: 1.5">
                    </div>
                    <div class="form-group">
                        <label for="vento">Velocidade do Vento (km/h):</label>
                        <input type="number" id="vento" name="vento" placeholder="Ex: 15">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="temperatura">Temperatura da Água (°C):</label>
                        <input type="number" id="temperatura" name="temperatura" placeholder="Ex: 24">
                    </div>
                    <div class="form-group">
                        <label for="visibilidade">Visibilidade (km):</label>
                        <input type="number" id="visibilidade" name="visibilidade" placeholder="Ex: 10">
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3>🐠 Registo de Capturas</h3>
                <div class="species-list">
                    <h4>Espécies Comuns na {zone_info.name}:</h4>
                    <p>{', '.join(zone_info.main_species)}</p>
                </div>
                
                <table class="catch-table">
                    <tr>
                        <th>Espécie</th>
                        <th>Quantidade</th>
                        <th>Peso Total (kg)</th>
                        <th>Tamanho Médio (cm)</th>
                        <th>Observações</th>
                    </tr>
        """
        
        # Adicionar linhas vazias para preenchimento
        for i in range(8):
            log_template += """
                    <tr>
                        <td style="height: 30px;"></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
            """
        
        log_template += f"""
                </table>
            </div>
            
            <div class="form-section">
                <h3>📝 Observações Gerais</h3>
                <div class="form-group">
                    <label for="observacoes">Observações sobre a pescaria:</label>
                    <textarea id="observacoes" name="observacoes" rows="4" 
                              placeholder="Descreva condições especiais, avistamentos de outras espécies, problemas técnicos, etc."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="hora_saida">Hora de Saída:</label>
                        <input type="time" id="hora_saida" name="hora_saida">
                    </div>
                    <div class="form-group">
                        <label for="hora_chegada">Hora de Chegada:</label>
                        <input type="time" id="hora_chegada" name="hora_chegada">
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <button class="print-btn" onclick="window.print()">🖨️ Imprimir Diário</button>
                <button class="print-btn" onclick="saveData()">💾 Guardar Dados</button>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><strong>⚖️ Lembrete Legal:</strong></p>
                <p>Este diário deve ser mantido durante pelo menos 2 anos conforme regulamentação pesqueira.</p>
                <p><strong>MARÍTIMO ANGOLA</strong> - Pesca Responsável e Documentada</p>
            </div>
            
            <script>
                function saveData() {{
                    // Função para guardar dados (implementar conforme necessário)
                    alert('Funcionalidade de guardar dados em desenvolvimento');
                }}
            </script>
        </body>
        </html>
        """
        
        return log_template
    
    def create_safety_guide(self) -> str:
        """
        🚨 Criar guia de segurança marítima
        
        Returns:
            Guia de segurança em HTML
        """
        
        safety_guide = f"""
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>Guia de Segurança Marítima - MARÍTIMO ANGOLA</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                }}
                .header {{
                    background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }}
                .emergency-section {{
                    background: #fecaca;
                    border: 3px solid #dc2626;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                .safety-section {{
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    margin: 20px 0;
                    padding: 20px;
                }}
                .equipment-list {{
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 15px;
                    margin: 15px 0;
                }}
                .warning {{
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 15px;
                    margin: 15px 0;
                }}
                .checklist {{
                    list-style-type: none;
                    padding: 0;
                }}
                .checklist li {{
                    padding: 5px 0;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .checklist li:before {{
                    content: "☐ ";
                    font-weight: bold;
                    color: #1e3a8a;
                }}
                .emergency-contact {{
                    background: #dc2626;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                    text-align: center;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚨 MARÍTIMO ANGOLA</h1>
                <h2>Guia de Segurança Marítima</h2>
                <p>Pesca Segura - Regresso Garantido</p>
            </div>
            
            <div class="emergency-section">
                <h2>🆘 CONTACTOS DE EMERGÊNCIA</h2>
                <div class="emergency-contact">
                    📻 VHF CANAL 16 - EMERGÊNCIA INTERNACIONAL
                </div>
        """
        
        for contact, info in self.safety_codes['emergency_contacts'].items():
            safety_guide += f'<div class="emergency-contact">{contact}: {info}</div>'
        
        safety_guide += f"""
            </div>
            
            <div class="safety-section">
                <h3>⚓ Equipamentos de Segurança Obrigatórios</h3>
                <div class="equipment-list">
                    <h4>Lista de Verificação Antes de Sair:</h4>
                    <ul class="checklist">
                        <li>Coletes salva-vidas (1 por pessoa + 10% extra)</li>
                        <li>Rádio VHF em funcionamento</li>
                        <li>Bóias salva-vidas</li>
                        <li>Sinalizadores pirotécnicos (mínimo 6)</li>
                        <li>Lanterna estanque com pilhas extra</li>
                        <li>Apito de emergência</li>
                        <li>Espelho de sinalização</li>
                        <li>Kit de primeiros socorros</li>
                        <li>Âncora e cabo adequados</li>
                        <li>Bomba de esgoto manual</li>
                        <li>Extintor de incêndio</li>
                        <li>GPS ou bússola</li>
                        <li>Combustível extra (reserva 25%)</li>
                        <li>Água potável (4L por pessoa/dia)</li>
                        <li>Alimentos de emergência</li>
                    </ul>
                </div>
            </div>
            
            <div class="safety-section">
                <h3>📡 Comunicações de Segurança</h3>
                <h4>Canais VHF Importantes:</h4>
                <ul>
        """
        
        for channel, description in self.safety_codes['vhf_channels'].items():
            safety_guide += f'<li><strong>Canal {channel}:</strong> {description}</li>'
        
        safety_guide += f"""
                </ul>
                
                <div class="warning">
                    <h4>⚠️ Procedimento de Emergência:</h4>
                    <ol>
                        <li><strong>MAYDAY, MAYDAY, MAYDAY</strong> (emergência com perigo de vida)</li>
                        <li>Identificar a embarcação</li>
                        <li>Dar posição GPS</li>
                        <li>Descrever a emergência</li>
                        <li>Número de pessoas a bordo</li>
                        <li>Aguardar resposta no Canal 16</li>
                    </ol>
                </div>
            </div>
            
            <div class="safety-section">
                <h3>🌊 Condições de Mar - Códigos de Alerta</h3>
                <ul>
        """
        
        for color, description in self.safety_codes['weather_warnings'].items():
            safety_guide += f'<li><strong style="color: {color};">●</strong> <strong>{color.upper()}:</strong> {description}</li>'
        
        safety_guide += f"""
                </ul>
            </div>
            
            <div class="safety-section">
                <h3>🎯 Regras de Segurança Fundamentais</h3>
                <ol>
                    <li><strong>Sempre informar o plano de navegação</strong> a familiares ou autoridades portuárias</li>
                    <li><strong>Verificar previsão meteorológica</strong> antes de sair</li>
                    <li><strong>Nunca pescar sozinho</strong> - mínimo 2 pessoas</li>
                    <li><strong>Manter VHF ligado</strong> no canal 16 durante toda a viagem</li>
                    <li><strong>Usar sempre colete salva-vidas</strong></li>
                    <li><strong>Não exceder capacidade da embarcação</strong></li>
                    <li><strong>Manter distância de outras embarcações</strong></li>
                    <li><strong>Respeitar sinalizações marítimas</strong></li>
                    <li><strong>Ter combustível para regresso + reserva</strong></li>
                    <li><strong>Em caso de dúvida, regressar ao porto</strong></li>
                </ol>
            </div>
            
            <div class="safety-section">
                <h3>🏥 Primeiros Socorros Básicos</h3>
                <div class="warning">
                    <h4>Situações Comuns no Mar:</h4>
                    <ul>
                        <li><strong>Cortes com anzóis:</strong> Não tentar remover, estancar sangramento, procurar ajuda médica</li>
                        <li><strong>Queimaduras solares:</strong> Manter hidratado, aplicar compressas frias</li>
                        <li><strong>Enjoo marítimo:</strong> Manter-se no convés, olhar horizonte, beber água</li>
                        <li><strong>Hipotermia:</strong> Retirar da água, aquecer gradualmente, procurar ajuda</li>
                        <li><strong>Desidratação:</strong> Beber água regularmente, procurar sombra</li>
                    </ul>
                </div>
            </div>
            
            <div class="safety-section">
                <h3>⚖️ Responsabilidades Legais</h3>
                <ul>
                    <li>Licença de pesca válida</li>
                    <li>Registo da embarcação atualizado</li>
                    <li>Certificado de segurança da embarcação</li>
                    <li>Seguro de responsabilidade civil</li>
                    <li>Respeitar quotas e tamanhos mínimos</li>
                    <li>Não pescar em áreas protegidas</li>
                    <li>Manter diário de pesca atualizado</li>
                </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; background: #f8fafc; padding: 20px; border-radius: 10px;">
                <h3>📞 LEMBRE-SE SEMPRE</h3>
                <p style="font-size: 1.2em; color: #dc2626; font-weight: bold;">
                    EM CASO DE EMERGÊNCIA: VHF CANAL 16
                </p>
                <p><strong>MARÍTIMO ANGOLA</strong> - A sua segurança é a nossa prioridade</p>
                <p><em>"Melhor um dia perdido em terra que uma vida perdida no mar"</em></p>
            </div>
        </body>
        </html>
        """
        
        return safety_guide


# Instância global da interface para pescadores
fisherman_interface = FishermanInterface()
