"""
Automated Report Generation System for BGAPP
Sistema de geração automática de relatórios com mapas e estatísticas
"""

import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_pdf import PdfPages
import seaborn as sns
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
import logging
from dataclasses import dataclass
from enum import Enum
import io
import base64

from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import Color, blue, red, green, black, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.platypus import PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.widgetbase import Widget

from .temporal_visualization import TemporalVisualization
from .spatial_analysis import SpatialAnalysisTools
from .biomass_calculator import AdvancedBiomassCalculator, BiomassType
from .migration_overlay import MigrationOverlaySystem

logger = logging.getLogger(__name__)


class ReportType(Enum):
    """Tipos de relatório disponíveis"""
    BIOMASS_ASSESSMENT = "biomass_assessment"
    MIGRATION_ANALYSIS = "migration_analysis"
    SPATIAL_PLANNING = "spatial_planning"
    ENVIRONMENTAL_STATUS = "environmental_status"
    FISHERIES_IMPACT = "fisheries_impact"
    CONSERVATION_SUMMARY = "conservation_summary"
    MONTHLY_MONITORING = "monthly_monitoring"
    ANNUAL_REPORT = "annual_report"


@dataclass
class ReportSection:
    """Seção individual de um relatório"""
    title: str
    content_type: str  # 'text', 'table', 'chart', 'map', 'image'
    content: Any
    metadata: Dict[str, Any]


@dataclass
class ReportTemplate:
    """Template de relatório"""
    report_type: ReportType
    title: str
    sections: List[str]  # Lista de seções a incluir
    layout: str  # 'standard', 'executive', 'technical'
    language: str  # 'pt', 'en'
    branding: Dict[str, Any]


class AutomatedReportGenerator:
    """
    Gerador automático de relatórios para BGAPP
    Cria relatórios em PDF com mapas, gráficos e análises
    """
    
    def __init__(self):
        # Configurar matplotlib para português
        plt.rcParams['font.size'] = 10
        plt.rcParams['axes.titlesize'] = 12
        plt.rcParams['axes.labelsize'] = 10
        plt.rcParams['xtick.labelsize'] = 9
        plt.rcParams['ytick.labelsize'] = 9
        plt.rcParams['legend.fontsize'] = 9
        
        # Inicializar módulos de análise
        self.temporal_viz = TemporalVisualization()
        self.spatial_tools = SpatialAnalysisTools()
        self.biomass_calc = AdvancedBiomassCalculator()
        self.migration_system = MigrationOverlaySystem()
        
        # Templates de relatório
        self.report_templates = {
            ReportType.BIOMASS_ASSESSMENT: ReportTemplate(
                report_type=ReportType.BIOMASS_ASSESSMENT,
                title="Avaliação de Biomassa - Angola",
                sections=['executive_summary', 'methodology', 'terrestrial_biomass', 
                         'marine_biomass', 'temporal_trends', 'spatial_distribution', 
                         'conclusions', 'recommendations'],
                layout='technical',
                language='pt',
                branding={'logo': 'bgapp_logo.png', 'color': '#1f4e79'}
            ),
            ReportType.MIGRATION_ANALYSIS: ReportTemplate(
                report_type=ReportType.MIGRATION_ANALYSIS,
                title="Análise de Migração e Interações Pesqueiras",
                sections=['executive_summary', 'species_overview', 'migration_patterns',
                         'fishing_interactions', 'risk_assessment', 'conservation_measures'],
                layout='technical',
                language='pt',
                branding={'logo': 'bgapp_logo.png', 'color': '#2d5d31'}
            ),
            ReportType.ENVIRONMENTAL_STATUS: ReportTemplate(
                report_type=ReportType.ENVIRONMENTAL_STATUS,
                title="Estado Ambiental da ZEE de Angola",
                sections=['executive_summary', 'oceanographic_conditions', 
                         'ecosystem_health', 'pollution_indicators', 'climate_trends',
                         'biodiversity_status', 'recommendations'],
                layout='standard',
                language='pt',
                branding={'logo': 'bgapp_logo.png', 'color': '#1e5d8b'}
            )
        }
        
        # Configurações de estilo
        self.styles = getSampleStyleSheet()
        self.custom_styles = self._create_custom_styles()
        
        # Configurações de cores para gráficos
        self.color_palettes = {
            'biomass': ['#2E8B57', '#32CD32', '#90EE90', '#98FB98'],
            'migration': ['#4169E1', '#6495ED', '#87CEEB', '#B0C4DE'],
            'risk': ['#DC143C', '#FF6347', '#FFA500', '#FFD700'],
            'environmental': ['#008B8B', '#20B2AA', '#48D1CC', '#AFEEEE']
        }
    
    def _create_custom_styles(self) -> Dict[str, ParagraphStyle]:
        """Criar estilos personalizados para o relatório"""
        styles = {}
        
        styles['CustomTitle'] = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Title'],
            fontSize=18,
            spaceAfter=20,
            textColor=colors.HexColor('#1f4e79'),
            alignment=1  # Centro
        )
        
        styles['SectionTitle'] = ParagraphStyle(
            'SectionTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.HexColor('#2d5d31'),
            borderWidth=1,
            borderColor=colors.HexColor('#2d5d31'),
            borderPadding=5
        )
        
        styles['SubsectionTitle'] = ParagraphStyle(
            'SubsectionTitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.HexColor('#1e5d8b')
        )
        
        styles['BodyText'] = ParagraphStyle(
            'BodyText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            alignment=4,  # Justificado
            textColor=colors.black
        )
        
        styles['Caption'] = ParagraphStyle(
            'Caption',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#666666'),
            alignment=1,  # Centro
            spaceAfter=10
        )
        
        return styles
    
    def generate_report(self, 
                       report_type: ReportType,
                       data: Dict[str, Any],
                       output_path: str,
                       custom_sections: Optional[List[str]] = None) -> bool:
        """
        Gerar relatório completo
        """
        try:
            # Obter template do relatório
            if report_type not in self.report_templates:
                logger.error(f"Tipo de relatório não suportado: {report_type}")
                return False
            
            template = self.report_templates[report_type]
            sections_to_include = custom_sections or template.sections
            
            # Criar documento PDF
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            doc = SimpleDocTemplate(
                str(output_file),
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            # Construir conteúdo do relatório
            story = []
            
            # Página de título
            story.extend(self._create_title_page(template, data))
            story.append(PageBreak())
            
            # Índice
            story.extend(self._create_table_of_contents(sections_to_include))
            story.append(PageBreak())
            
            # Gerar cada seção
            for section_name in sections_to_include:
                try:
                    section_content = self._generate_section(
                        section_name, report_type, data
                    )
                    story.extend(section_content)
                    story.append(Spacer(1, 20))
                except Exception as e:
                    logger.error(f"Erro ao gerar seção {section_name}: {e}")
                    continue
            
            # Construir PDF
            doc.build(story)
            
            logger.info(f"Relatório gerado com sucesso: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {e}")
            return False
    
    def _create_title_page(self, 
                          template: ReportTemplate, 
                          data: Dict[str, Any]) -> List[Any]:
        """Criar página de título"""
        story = []
        
        # Título principal
        title = Paragraph(template.title, self.custom_styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 30))
        
        # Subtítulo com período de análise
        if 'analysis_period' in data:
            period = data['analysis_period']
            subtitle = f"Período de Análise: {period.get('start', 'N/A')} - {period.get('end', 'N/A')}"
            story.append(Paragraph(subtitle, self.custom_styles['SubsectionTitle']))
            story.append(Spacer(1, 20))
        
        # Informações do relatório
        report_info = [
            f"<b>Data de Geração:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            f"<b>Versão:</b> {data.get('version', '1.0')}",
            f"<b>Região:</b> {data.get('region', 'ZEE de Angola')}",
            f"<b>Sistema:</b> BGAPP - Blue Growth Angola Platform"
        ]
        
        for info in report_info:
            story.append(Paragraph(info, self.custom_styles['BodyText']))
            story.append(Spacer(1, 8))
        
        story.append(Spacer(1, 50))
        
        # Resumo executivo se disponível
        if 'executive_summary' in data:
            story.append(Paragraph("Resumo Executivo", self.custom_styles['SectionTitle']))
            story.append(Spacer(1, 10))
            
            summary_text = data['executive_summary']
            if isinstance(summary_text, list):
                for point in summary_text:
                    story.append(Paragraph(f"• {point}", self.custom_styles['BodyText']))
            else:
                story.append(Paragraph(summary_text, self.custom_styles['BodyText']))
        
        return story
    
    def _create_table_of_contents(self, sections: List[str]) -> List[Any]:
        """Criar índice do relatório"""
        story = []
        
        story.append(Paragraph("Índice", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        # Mapear nomes das seções para títulos em português
        section_titles = {
            'executive_summary': '1. Resumo Executivo',
            'methodology': '2. Metodologia',
            'terrestrial_biomass': '3. Biomassa Terrestre',
            'marine_biomass': '4. Biomassa Marinha',
            'temporal_trends': '5. Tendências Temporais',
            'spatial_distribution': '6. Distribuição Espacial',
            'species_overview': '3. Panorama das Espécies',
            'migration_patterns': '4. Padrões Migratórios',
            'fishing_interactions': '5. Interações com a Pesca',
            'risk_assessment': '6. Avaliação de Risco',
            'conservation_measures': '7. Medidas de Conservação',
            'oceanographic_conditions': '3. Condições Oceanográficas',
            'ecosystem_health': '4. Saúde do Ecossistema',
            'pollution_indicators': '5. Indicadores de Poluição',
            'climate_trends': '6. Tendências Climáticas',
            'biodiversity_status': '7. Estado da Biodiversidade',
            'conclusions': '8. Conclusões',
            'recommendations': '9. Recomendações'
        }
        
        for section in sections:
            title = section_titles.get(section, section.replace('_', ' ').title())
            story.append(Paragraph(title, self.custom_styles['BodyText']))
            story.append(Spacer(1, 5))
        
        return story
    
    def _generate_section(self, 
                         section_name: str, 
                         report_type: ReportType, 
                         data: Dict[str, Any]) -> List[Any]:
        """Gerar conteúdo de uma seção específica"""
        
        if section_name == 'executive_summary':
            return self._generate_executive_summary(data)
        elif section_name == 'methodology':
            return self._generate_methodology_section(report_type, data)
        elif section_name == 'terrestrial_biomass':
            return self._generate_terrestrial_biomass_section(data)
        elif section_name == 'marine_biomass':
            return self._generate_marine_biomass_section(data)
        elif section_name == 'temporal_trends':
            return self._generate_temporal_trends_section(data)
        elif section_name == 'spatial_distribution':
            return self._generate_spatial_distribution_section(data)
        elif section_name == 'migration_patterns':
            return self._generate_migration_patterns_section(data)
        elif section_name == 'fishing_interactions':
            return self._generate_fishing_interactions_section(data)
        elif section_name == 'risk_assessment':
            return self._generate_risk_assessment_section(data)
        elif section_name == 'conclusions':
            return self._generate_conclusions_section(data)
        elif section_name == 'recommendations':
            return self._generate_recommendations_section(data)
        else:
            return self._generate_generic_section(section_name, data)
    
    def _generate_executive_summary(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar resumo executivo"""
        story = []
        
        story.append(Paragraph("1. Resumo Executivo", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        # Pontos principais do resumo
        if 'key_findings' in data:
            story.append(Paragraph("Principais Descobertas:", self.custom_styles['SubsectionTitle']))
            story.append(Spacer(1, 8))
            
            for finding in data['key_findings']:
                story.append(Paragraph(f"• {finding}", self.custom_styles['BodyText']))
                story.append(Spacer(1, 5))
        
        # Estatísticas principais
        if 'summary_statistics' in data:
            story.append(Spacer(1, 15))
            story.append(Paragraph("Estatísticas Principais:", self.custom_styles['SubsectionTitle']))
            story.append(Spacer(1, 8))
            
            stats = data['summary_statistics']
            stats_data = []
            
            for key, value in stats.items():
                formatted_key = key.replace('_', ' ').title()
                if isinstance(value, float):
                    formatted_value = f"{value:.2f}"
                else:
                    formatted_value = str(value)
                stats_data.append([formatted_key, formatted_value])
            
            if stats_data:
                table = Table(stats_data, colWidths=[8*cm, 4*cm])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E6E6E6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
        
        return story
    
    def _generate_methodology_section(self, 
                                    report_type: ReportType, 
                                    data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de metodologia"""
        story = []
        
        story.append(Paragraph("2. Metodologia", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        # Metodologia baseada no tipo de relatório
        if report_type == ReportType.BIOMASS_ASSESSMENT:
            methodology_text = """
            A avaliação de biomassa foi realizada utilizando dados de sensoriamento remoto e modelos 
            oceanográficos. Para a biomassa terrestre, utilizaram-se dados NDVI (Normalized Difference 
            Vegetation Index) do MODIS e Sentinel-2, aplicando modelos de regressão calibrados para 
            diferentes tipos de vegetação angolana.
            
            Para a biomassa marinha, foram utilizados dados de clorofila-a do Copernicus Marine Service, 
            convertidos em produtividade primária através do modelo de Behrenfeld & Falkowski (1997), 
            e posteriormente em biomassa de fitoplâncton e peixes através de eficiências de transferência 
            trófica específicas para o sistema de Benguela.
            """
        elif report_type == ReportType.MIGRATION_ANALYSIS:
            methodology_text = """
            A análise de migração baseou-se em dados de tracking satelital e GPS de espécies marinhas, 
            complementados por padrões migratórios conhecidos da literatura científica. As trajetórias 
            foram analisadas espacialmente para identificar interações com zonas de pesca, utilizando 
            análise de sobreposição geoespacial e cálculo de tempos de permanência.
            
            O nível de risco das interações foi calculado considerando o status de conservação das 
            espécies, tipo de atividade pesqueira e duração da interação.
            """
        else:
            methodology_text = """
            Este relatório foi gerado utilizando dados integrados de múltiplas fontes, incluindo 
            sensoriamento remoto, modelos oceanográficos e dados in-situ. A análise espacial foi 
            realizada utilizando ferramentas SIG avançadas e métodos estatísticos apropriados.
            """
        
        story.append(Paragraph(methodology_text, self.custom_styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # Fontes de dados
        if 'data_sources' in data:
            story.append(Paragraph("Fontes de Dados:", self.custom_styles['SubsectionTitle']))
            story.append(Spacer(1, 8))
            
            for source in data['data_sources']:
                story.append(Paragraph(f"• {source}", self.custom_styles['BodyText']))
                story.append(Spacer(1, 5))
        
        return story
    
    def _generate_terrestrial_biomass_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de biomassa terrestre"""
        story = []
        
        story.append(Paragraph("3. Biomassa Terrestre", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        # Texto introdutório
        intro_text = """
        A biomassa terrestre de Angola foi avaliada através de análise de dados NDVI, 
        considerando diferentes zonas ecológicas e tipos de vegetação. A análise abrangeu 
        florestas tropicais, savanas, zonas agrícolas e vegetação costeira.
        """
        story.append(Paragraph(intro_text, self.custom_styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # Resultados por zona ecológica
        if 'terrestrial_biomass' in data:
            biomass_data = data['terrestrial_biomass']
            
            if 'zones' in biomass_data:
                story.append(Paragraph("Biomassa por Zona Ecológica:", self.custom_styles['SubsectionTitle']))
                story.append(Spacer(1, 8))
                
                # Criar tabela com resultados
                table_data = [['Zona Ecológica', 'Biomassa Total (t)', 'Densidade (t/km²)', 'Área (km²)']]
                
                for zone in biomass_data['zones']:
                    zone_name = zone.get('zone_name', 'N/A')
                    biomass_result = zone.get('biomass_result', {})
                    total_biomass = biomass_result.get('total_biomass', 0)
                    area_km2 = biomass_result.get('area_km2', 0)
                    density = total_biomass / area_km2 if area_km2 > 0 else 0
                    
                    table_data.append([
                        zone_name,
                        f"{total_biomass:,.0f}",
                        f"{density:.1f}",
                        f"{area_km2:,.0f}"
                    ])
                
                table = Table(table_data, colWidths=[4*cm, 3*cm, 3*cm, 3*cm])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E8B57')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(table)
                story.append(Spacer(1, 15))
            
            # Gráfico de biomassa por zona (simulado)
            if len(biomass_data.get('zones', [])) > 0:
                chart_image = self._create_biomass_chart(biomass_data['zones'])
                if chart_image:
                    story.append(chart_image)
                    story.append(Paragraph(
                        "Figura 1: Distribuição de biomassa terrestre por zona ecológica",
                        self.custom_styles['Caption']
                    ))
        
        return story
    
    def _generate_marine_biomass_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de biomassa marinha"""
        story = []
        
        story.append(Paragraph("4. Biomassa Marinha", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        intro_text = """
        A biomassa marinha foi estimada através de dados de clorofila-a e modelos de produtividade 
        primária, considerando as diferentes zonas oceanográficas da ZEE angolana, incluindo o 
        sistema de upwelling de Benguela.
        """
        story.append(Paragraph(intro_text, self.custom_styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # Resultados de biomassa marinha
        if 'marine_biomass' in data:
            marine_data = data['marine_biomass']
            
            # Fitoplâncton
            if 'phytoplankton' in marine_data:
                story.append(Paragraph("Biomassa de Fitoplâncton:", self.custom_styles['SubsectionTitle']))
                story.append(Spacer(1, 8))
                
                phyto_total = marine_data['phytoplankton'].get('total_tons', 0)
                story.append(Paragraph(
                    f"Biomassa total estimada de fitoplâncton: {phyto_total:,.0f} toneladas",
                    self.custom_styles['BodyText']
                ))
                story.append(Spacer(1, 10))
            
            # Peixes
            if 'fish' in marine_data:
                story.append(Paragraph("Biomassa de Peixes:", self.custom_styles['SubsectionTitle']))
                story.append(Spacer(1, 8))
                
                fish_total = marine_data['fish'].get('total_tons', 0)
                story.append(Paragraph(
                    f"Biomassa total estimada de peixes: {fish_total:,.0f} toneladas",
                    self.custom_styles['BodyText']
                ))
                story.append(Spacer(1, 15))
        
        return story
    
    def _generate_temporal_trends_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de tendências temporais"""
        story = []
        
        story.append(Paragraph("5. Tendências Temporais", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        intro_text = """
        A análise temporal permite identificar padrões sazonais e tendências de longo prazo 
        nas variáveis ambientais e biológicas da ZEE angolana.
        """
        story.append(Paragraph(intro_text, self.custom_styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # Análise de tendências
        if 'temporal_analysis' in data:
            temporal_data = data['temporal_analysis']
            
            # Gráfico de séries temporais (simulado)
            time_series_image = self._create_time_series_chart(temporal_data)
            if time_series_image:
                story.append(time_series_image)
                story.append(Paragraph(
                    "Figura 2: Evolução temporal das principais variáveis",
                    self.custom_styles['Caption']
                ))
                story.append(Spacer(1, 15))
        
        return story
    
    def _generate_spatial_distribution_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de distribuição espacial"""
        story = []
        
        story.append(Paragraph("6. Distribuição Espacial", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        intro_text = """
        A análise espacial revela padrões de distribuição dos recursos marinhos e terrestres, 
        identificando áreas de alta produtividade e zonas críticas para conservação.
        """
        story.append(Paragraph(intro_text, self.custom_styles['BodyText']))
        story.append(Spacer(1, 15))
        
        # Mapa de distribuição espacial (placeholder)
        map_placeholder = self._create_map_placeholder()
        story.append(map_placeholder)
        story.append(Paragraph(
            "Figura 3: Distribuição espacial da biomassa na ZEE angolana",
            self.custom_styles['Caption']
        ))
        
        return story
    
    def _generate_migration_patterns_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de padrões migratórios"""
        story = []
        
        story.append(Paragraph("4. Padrões Migratórios", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        if 'trajectories' in data:
            trajectories = data['trajectories']
            
            story.append(Paragraph(f"Foram analisadas {len(trajectories)} trajetórias migratórias de diferentes espécies marinhas.", self.custom_styles['BodyText']))
            story.append(Spacer(1, 10))
            
            # Tabela com resumo das trajetórias
            table_data = [['Espécie', 'Indivíduos', 'Distância Média (km)', 'Duração Média (dias)']]
            
            species_summary = {}
            for traj in trajectories:
                species = traj.get('species', 'Unknown')
                if species not in species_summary:
                    species_summary[species] = {
                        'count': 0,
                        'total_distance': 0,
                        'total_duration': 0
                    }
                species_summary[species]['count'] += 1
                species_summary[species]['total_distance'] += traj.get('distance_km', 0)
                species_summary[species]['total_duration'] += traj.get('duration_days', 0)
            
            for species, summary in species_summary.items():
                count = summary['count']
                avg_distance = summary['total_distance'] / count if count > 0 else 0
                avg_duration = summary['total_duration'] / count if count > 0 else 0
                
                table_data.append([
                    species.replace('_', ' ').title(),
                    str(count),
                    f"{avg_distance:.0f}",
                    f"{avg_duration:.0f}"
                ])
            
            table = Table(table_data, colWidths=[4*cm, 2*cm, 3*cm, 3*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4169E1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(table)
        
        return story
    
    def _generate_fishing_interactions_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de interações com a pesca"""
        story = []
        
        story.append(Paragraph("5. Interações com a Pesca", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        if 'interactions' in data:
            interactions = data['interactions']
            
            story.append(Paragraph(f"Foram identificadas {len(interactions)} interações entre trajetórias migratórias e zonas de pesca.", self.custom_styles['BodyText']))
            story.append(Spacer(1, 10))
            
            # Análise por nível de risco
            risk_counts = {'high': 0, 'medium': 0, 'low': 0}
            for interaction in interactions:
                risk_level = interaction.get('risk_level', 'low')
                if risk_level in risk_counts:
                    risk_counts[risk_level] += 1
            
            risk_text = f"""
            Distribuição por nível de risco:
            • Alto risco: {risk_counts['high']} interações
            • Médio risco: {risk_counts['medium']} interações
            • Baixo risco: {risk_counts['low']} interações
            """
            story.append(Paragraph(risk_text, self.custom_styles['BodyText']))
        
        return story
    
    def _generate_risk_assessment_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de avaliação de risco"""
        story = []
        
        story.append(Paragraph("6. Avaliação de Risco", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        if 'risk_assessment' in data:
            risk_data = data['risk_assessment']
            
            # Gráfico de risco (simulado)
            risk_chart = self._create_risk_chart(risk_data)
            if risk_chart:
                story.append(risk_chart)
                story.append(Paragraph(
                    "Figura 4: Distribuição dos níveis de risco das interações",
                    self.custom_styles['Caption']
                ))
        
        return story
    
    def _generate_conclusions_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de conclusões"""
        story = []
        
        story.append(Paragraph("8. Conclusões", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        conclusions_text = """
        Com base na análise realizada, podem ser destacadas as seguintes conclusões principais:
        
        • A ZEE angolana apresenta alta diversidade de habitats marinhos e terrestres
        • O sistema de upwelling de Benguela é fundamental para a produtividade marinha
        • Existem interações significativas entre rotas migratórias e atividades pesqueiras
        • Medidas de gestão adaptativa são necessárias para conservação sustentável
        """
        
        if 'conclusions' in data:
            conclusions_text = data['conclusions']
        
        story.append(Paragraph(conclusions_text, self.custom_styles['BodyText']))
        
        return story
    
    def _generate_recommendations_section(self, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção de recomendações"""
        story = []
        
        story.append(Paragraph("9. Recomendações", self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        if 'conservation_recommendations' in data:
            recs = data['conservation_recommendations']
            
            # Zonas prioritárias
            if 'priority_zones' in recs and recs['priority_zones']:
                story.append(Paragraph("Zonas Prioritárias:", self.custom_styles['SubsectionTitle']))
                story.append(Spacer(1, 8))
                
                for zone in recs['priority_zones'][:3]:  # Top 3
                    zone_text = f"• {zone.get('zone_id', 'N/A')}: Pontuação de prioridade {zone.get('priority_score', 0)}"
                    story.append(Paragraph(zone_text, self.custom_styles['BodyText']))
                
                story.append(Spacer(1, 10))
            
            # Medidas de monitorização
            if 'monitoring_recommendations' in recs:
                story.append(Paragraph("Monitorização Recomendada:", self.custom_styles['SubsectionTitle']))
                story.append(Spacer(1, 8))
                
                for rec in recs['monitoring_recommendations']:
                    rec_text = f"• {rec.get('description', 'N/A')} (Prioridade: {rec.get('priority', 'N/A')})"
                    story.append(Paragraph(rec_text, self.custom_styles['BodyText']))
        else:
            default_recs = """
            Recomendações gerais para gestão sustentável:
            
            • Implementar sistema de monitorização contínua
            • Estabelecer áreas marinhas protegidas em zonas críticas
            • Desenvolver planos de gestão adaptativos
            • Fortalecer cooperação internacional
            • Investir em investigação científica
            """
            story.append(Paragraph(default_recs, self.custom_styles['BodyText']))
        
        return story
    
    def _generate_generic_section(self, section_name: str, data: Dict[str, Any]) -> List[Any]:
        """Gerar seção genérica"""
        story = []
        
        title = section_name.replace('_', ' ').title()
        story.append(Paragraph(title, self.custom_styles['SectionTitle']))
        story.append(Spacer(1, 15))
        
        # Tentar encontrar dados da seção
        if section_name in data:
            section_data = data[section_name]
            if isinstance(section_data, str):
                story.append(Paragraph(section_data, self.custom_styles['BodyText']))
            elif isinstance(section_data, list):
                for item in section_data:
                    story.append(Paragraph(f"• {item}", self.custom_styles['BodyText']))
            else:
                story.append(Paragraph(f"Dados da seção: {section_data}", self.custom_styles['BodyText']))
        else:
            story.append(Paragraph("Seção em desenvolvimento.", self.custom_styles['BodyText']))
        
        return story
    
    def _create_biomass_chart(self, zones_data: List[Dict[str, Any]]) -> Optional[Image]:
        """Criar gráfico de biomassa por zona"""
        try:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            zone_names = []
            biomass_values = []
            
            for zone in zones_data[:5]:  # Top 5 zonas
                zone_names.append(zone.get('zone_name', 'N/A')[:15])  # Truncar nomes longos
                biomass_result = zone.get('biomass_result', {})
                biomass_values.append(biomass_result.get('total_biomass', 0))
            
            bars = ax.bar(zone_names, biomass_values, color=self.color_palettes['biomass'])
            ax.set_ylabel('Biomassa (toneladas)')
            ax.set_title('Biomassa Total por Zona Ecológica')
            ax.tick_params(axis='x', rotation=45)
            
            # Adicionar valores nas barras
            for bar, value in zip(bars, biomass_values):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                       f'{value:,.0f}', ha='center', va='bottom', fontsize=9)
            
            plt.tight_layout()
            
            # Converter para imagem
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=15*cm, height=9*cm)
            plt.close()
            
            return img
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico de biomassa: {e}")
            return None
    
    def _create_time_series_chart(self, temporal_data: Dict[str, Any]) -> Optional[Image]:
        """Criar gráfico de séries temporais"""
        try:
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Dados simulados para demonstração
            months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            
            # Simular 3 variáveis
            ndvi_values = [0.3 + 0.2 * np.sin(2 * np.pi * i / 12) + np.random.normal(0, 0.02) for i in range(12)]
            chl_values = [2.0 + 1.5 * np.sin(2 * np.pi * (i + 3) / 12) + np.random.normal(0, 0.1) for i in range(12)]
            sst_values = [22 + 4 * np.sin(2 * np.pi * (i + 6) / 12) + np.random.normal(0, 0.3) for i in range(12)]
            
            ax.plot(months, ndvi_values, 'o-', label='NDVI', color='green', linewidth=2)
            ax2 = ax.twinx()
            ax2.plot(months, chl_values, 's-', label='Chl-a (mg/m³)', color='blue', linewidth=2)
            ax2.plot(months, sst_values, '^-', label='SST (°C)', color='red', linewidth=2)
            
            ax.set_ylabel('NDVI', color='green')
            ax2.set_ylabel('Chl-a / SST', color='blue')
            ax.set_xlabel('Mês')
            ax.set_title('Evolução Temporal das Variáveis Ambientais')
            
            # Combinar legendas
            lines1, labels1 = ax.get_legend_handles_labels()
            lines2, labels2 = ax2.get_legend_handles_labels()
            ax.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
            
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Converter para imagem
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=16*cm, height=9*cm)
            plt.close()
            
            return img
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico temporal: {e}")
            return None
    
    def _create_risk_chart(self, risk_data: Dict[str, Any]) -> Optional[Image]:
        """Criar gráfico de avaliação de risco"""
        try:
            fig, ax = plt.subplots(figsize=(8, 8))
            
            # Dados de risco
            risk_levels = ['Alto', 'Médio', 'Baixo']
            risk_counts = [
                risk_data.get('high_risk_interactions', 5),
                risk_data.get('medium_risk_interactions', 12),
                risk_data.get('low_risk_interactions', 8)
            ]
            
            colors = ['#DC143C', '#FFA500', '#32CD32']
            
            wedges, texts, autotexts = ax.pie(risk_counts, labels=risk_levels, colors=colors,
                                            autopct='%1.1f%%', startangle=90)
            
            ax.set_title('Distribuição de Interações por Nível de Risco', fontsize=12, pad=20)
            
            plt.tight_layout()
            
            # Converter para imagem
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=12*cm, height=12*cm)
            plt.close()
            
            return img
            
        except Exception as e:
            logger.error(f"Erro ao criar gráfico de risco: {e}")
            return None
    
    def _create_map_placeholder(self) -> Image:
        """Criar placeholder para mapa"""
        try:
            fig, ax = plt.subplots(figsize=(10, 8))
            
            # Simular contorno de Angola
            angola_lat = np.array([-4.2, -6, -8, -10, -12, -14, -16, -18, -18, -16, -14, -12, -10, -8, -6, -4.2])
            angola_lon = np.array([12, 12.5, 13, 13.5, 13.8, 13.5, 13, 12.5, 15, 16, 16.5, 17, 17.5, 17, 16, 14])
            
            ax.plot(angola_lon, angola_lat, 'k-', linewidth=2, label='Costa de Angola')
            ax.fill(angola_lon, angola_lat, alpha=0.3, color='lightblue')
            
            # Adicionar pontos simulados de biomassa
            np.random.seed(42)
            biomass_points_lat = np.random.uniform(-18, -4.2, 20)
            biomass_points_lon = np.random.uniform(12, 17, 20)
            biomass_values = np.random.uniform(10, 100, 20)
            
            scatter = ax.scatter(biomass_points_lon, biomass_points_lat, c=biomass_values,
                               cmap='viridis', s=60, alpha=0.7)
            
            ax.set_xlabel('Longitude')
            ax.set_ylabel('Latitude')
            ax.set_title('Distribuição Espacial da Biomassa - ZEE Angola')
            ax.grid(True, alpha=0.3)
            ax.legend()
            
            # Barra de cores
            cbar = plt.colorbar(scatter, ax=ax)
            cbar.set_label('Biomassa (t/km²)')
            
            plt.tight_layout()
            
            # Converter para imagem
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=15*cm, height=12*cm)
            plt.close()
            
            return img
            
        except Exception as e:
            logger.error(f"Erro ao criar mapa: {e}")
            # Retornar imagem vazia em caso de erro
            fig, ax = plt.subplots(figsize=(10, 8))
            ax.text(0.5, 0.5, 'Mapa não disponível', ha='center', va='center', transform=ax.transAxes)
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150)
            img_buffer.seek(0)
            img = Image(img_buffer, width=15*cm, height=12*cm)
            plt.close()
            return img
    
    def generate_monthly_report(self, 
                               month: int, 
                               year: int, 
                               output_dir: str) -> bool:
        """
        Gerar relatório mensal automático
        """
        try:
            # Simular dados mensais
            monthly_data = {
                'analysis_period': {
                    'start': f'{year}-{month:02d}-01',
                    'end': f'{year}-{month:02d}-28'
                },
                'executive_summary': [
                    f'Análise mensal para {month:02d}/{year}',
                    'Condições oceanográficas dentro da normalidade',
                    'Atividade pesqueira moderada',
                    'Sem eventos extremos registrados'
                ],
                'key_findings': [
                    'Temperatura superficial do mar estável',
                    'Concentração de clorofila-a sazonal',
                    'Migração de baleias jubarte detectada'
                ],
                'summary_statistics': {
                    'total_observations': 1250,
                    'average_sst': 24.5,
                    'max_chlorophyll': 8.2,
                    'fishing_vessels_tracked': 45
                },
                'data_sources': [
                    'Copernicus Marine Service',
                    'MODIS Aqua/Terra',
                    'Sentinel-2',
                    'VMS Fishing Vessels'
                ]
            }
            
            # Nome do arquivo
            filename = f'relatorio_mensal_{year}_{month:02d}.pdf'
            output_path = Path(output_dir) / filename
            
            # Gerar relatório
            success = self.generate_report(
                ReportType.MONTHLY_MONITORING,
                monthly_data,
                str(output_path)
            )
            
            if success:
                logger.info(f"Relatório mensal gerado: {output_path}")
            
            return success
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório mensal: {e}")
            return False


def create_biomass_assessment_report(output_path: str) -> bool:
    """
    Função utilitária para criar relatório de avaliação de biomassa
    """
    # Gerar dados de biomassa
    from .biomass_calculator import create_angola_biomass_assessment
    
    biomass_data = create_angola_biomass_assessment()
    
    # Preparar dados para o relatório
    report_data = {
        'analysis_period': {
            'start': '2020-01-01',
            'end': datetime.now().strftime('%Y-%m-%d')
        },
        'executive_summary': [
            'Avaliação completa da biomassa terrestre e marinha de Angola',
            'Análise baseada em dados de sensoriamento remoto e modelos oceanográficos',
            'Identificação de zonas de alta produtividade',
            'Recomendações para gestão sustentável'
        ],
        'key_findings': biomass_data['summary']['key_findings'],
        'summary_statistics': {
            'total_biomass_tons': biomass_data['summary']['total_biomass_tons'],
            'terrestrial_percentage': biomass_data['summary']['terrestrial_percentage'],
            'marine_percentage': biomass_data['summary']['marine_percentage']
        },
        'terrestrial_biomass': biomass_data['terrestrial_biomass'],
        'marine_biomass': biomass_data['marine_biomass'],
        'data_sources': [
            'MODIS NDVI',
            'Copernicus Marine - Clorofila-a',
            'Sentinel-2 MSI',
            'Modelos Oceanográficos Angola'
        ]
    }
    
    # Gerar relatório
    generator = AutomatedReportGenerator()
    return generator.generate_report(
        ReportType.BIOMASS_ASSESSMENT,
        report_data,
        output_path
    )


def create_migration_analysis_report(output_path: str) -> bool:
    """
    Função utilitária para criar relatório de análise de migração
    """
    # Gerar dados de migração
    from .migration_overlay import create_migration_fishing_analysis
    
    migration_data = create_migration_fishing_analysis()
    
    # Preparar dados para o relatório
    report_data = {
        'analysis_period': {
            'start': (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d'),
            'end': datetime.now().strftime('%Y-%m-%d')
        },
        'executive_summary': [
            'Análise de padrões migratórios e interações com atividades pesqueiras',
            f'{migration_data["analysis_summary"]["total_trajectories"]} trajetórias analisadas',
            f'{migration_data["analysis_summary"]["total_interactions"]} interações identificadas',
            'Avaliação de risco para espécies migratórias'
        ],
        'trajectories': migration_data['trajectories'],
        'interactions': migration_data['interactions'],
        'temporal_analysis': migration_data['temporal_analysis'],
        'conservation_recommendations': migration_data['conservation_recommendations'],
        'risk_assessment': migration_data['risk_assessment'],
        'key_findings': [
            f'Espécies analisadas: {", ".join(migration_data["analysis_summary"]["species_analyzed"])}',
            f'Zonas de pesca avaliadas: {migration_data["analysis_summary"]["fishing_zones"]}',
            f'Interações de alto risco: {migration_data["risk_assessment"]["high_risk_interactions"]}'
        ],
        'data_sources': [
            'Tracking Satelital',
            'Base de dados Movebank',
            'Registos VMS',
            'Literatura Científica'
        ]
    }
    
    # Gerar relatório
    generator = AutomatedReportGenerator()
    return generator.generate_report(
        ReportType.MIGRATION_ANALYSIS,
        report_data,
        output_path
    )
