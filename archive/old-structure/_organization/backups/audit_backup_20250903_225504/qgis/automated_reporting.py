#!/usr/bin/env python3
"""
Sistema de Relatórios Automáticos para QGIS BGAPP
Gera relatórios mensais, semanais e sob demanda com análises completas
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import logging
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import Color, HexColor
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import base64
import io
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutomatedReportGenerator:
    """Gerador automático de relatórios QGIS"""
    
    def __init__(self, 
                 output_dir: str = "reports/automated",
                 template_dir: str = "templates/reports",
                 email_config: Optional[Dict] = None):
        """
        Inicializa o gerador de relatórios
        
        Args:
            output_dir: Diretório para salvar relatórios
            template_dir: Diretório com templates
            email_config: Configurações de email
        """
        
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.template_dir = Path(template_dir)
        self.template_dir.mkdir(parents=True, exist_ok=True)
        
        # Configuração de email
        self.email_config = email_config or {}
        
        # Configuração de estilos
        self.setup_styles()
        
        # Métricas de relatórios
        self.report_metrics = {
            'generated': 0,
            'sent': 0,
            'errors': 0,
            'last_run': None
        }
        
        logger.info("✅ Gerador de relatórios automáticos inicializado")
    
    def setup_styles(self):
        """Configura estilos para relatórios"""
        
        # Cores do tema BGAPP
        self.colors = {
            'primary': HexColor('#2E8B57'),
            'secondary': HexColor('#40E0D0'),
            'accent': HexColor('#FF6B35'),
            'dark': HexColor('#1a1a1a'),
            'light': HexColor('#f8f9fa'),
            'success': HexColor('#28a745'),
            'warning': HexColor('#ffc107'),
            'danger': HexColor('#dc3545')
        }
        
        # Estilos de parágrafo
        self.styles = getSampleStyleSheet()
        
        # Estilo de título personalizado
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=self.colors['primary'],
            spaceAfter=30,
            alignment=1  # Centralizado
        ))
        
        # Estilo de subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=self.colors['dark'],
            spaceBefore=20,
            spaceAfter=12
        ))
        
        # Estilo de corpo
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=self.colors['dark'],
            spaceAfter=12,
            alignment=0  # Justificado
        ))
    
    async def generate_monthly_report(self, year: int, month: int) -> str:
        """Gera relatório mensal completo"""
        
        logger.info(f"Gerando relatório mensal: {month}/{year}")
        
        try:
            # Coletar dados do mês
            report_data = await self._collect_monthly_data(year, month)
            
            # Gerar gráficos
            charts_data = await self._generate_monthly_charts(report_data)
            
            # Criar documento PDF
            filename = f"relatorio_mensal_{year}_{month:02d}.pdf"
            filepath = self.output_dir / filename
            
            doc = SimpleDocTemplate(
                str(filepath),
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Conteúdo do relatório
            story = []
            
            # Cabeçalho
            story.extend(self._create_header(f"Relatório Mensal - {month:02d}/{year}"))
            
            # Sumário executivo
            story.extend(self._create_executive_summary(report_data))
            
            # Análise de biomassa
            story.extend(self._create_biomass_section(report_data, charts_data))
            
            # Análise de pesca
            story.extend(self._create_fishing_section(report_data, charts_data))
            
            # Análise temporal
            story.extend(self._create_temporal_section(report_data, charts_data))
            
            # Recomendações
            story.extend(self._create_recommendations_section(report_data))
            
            # Anexos
            story.extend(self._create_appendix_section(report_data))
            
            # Construir PDF
            doc.build(story)
            
            self.report_metrics['generated'] += 1
            self.report_metrics['last_run'] = datetime.now().isoformat()
            
            logger.info(f"✅ Relatório mensal gerado: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório mensal: {e}")
            self.report_metrics['errors'] += 1
            raise
    
    async def generate_weekly_report(self, year: int, week: int) -> str:
        """Gera relatório semanal"""
        
        logger.info(f"Gerando relatório semanal: semana {week}/{year}")
        
        try:
            # Coletar dados da semana
            report_data = await self._collect_weekly_data(year, week)
            
            # Criar documento
            filename = f"relatorio_semanal_{year}_S{week:02d}.pdf"
            filepath = self.output_dir / filename
            
            doc = SimpleDocTemplate(str(filepath), pagesize=A4)
            story = []
            
            # Cabeçalho
            story.extend(self._create_header(f"Relatório Semanal - Semana {week}/{year}"))
            
            # Resumo da semana
            story.extend(self._create_weekly_summary(report_data))
            
            # Alertas e notificações
            story.extend(self._create_alerts_section(report_data))
            
            # Métricas de performance
            story.extend(self._create_performance_section(report_data))
            
            # Construir PDF
            doc.build(story)
            
            self.report_metrics['generated'] += 1
            logger.info(f"✅ Relatório semanal gerado: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório semanal: {e}")
            self.report_metrics['errors'] += 1
            raise
    
    async def generate_custom_report(self, 
                                   report_type: str,
                                   parameters: Dict[str, Any]) -> str:
        """Gera relatório personalizado"""
        
        logger.info(f"Gerando relatório personalizado: {report_type}")
        
        try:
            # Coletar dados baseado nos parâmetros
            if report_type == "biomass_assessment":
                report_data = await self._collect_biomass_data(parameters)
                charts_data = await self._generate_biomass_charts(report_data)
                
            elif report_type == "fishing_analysis":
                report_data = await self._collect_fishing_data(parameters)
                charts_data = await self._generate_fishing_charts(report_data)
                
            elif report_type == "migration_study":
                report_data = await self._collect_migration_data(parameters)
                charts_data = await self._generate_migration_charts(report_data)
                
            elif report_type == "environmental_impact":
                report_data = await self._collect_environmental_data(parameters)
                charts_data = await self._generate_environmental_charts(report_data)
                
            else:
                raise ValueError(f"Tipo de relatório não suportado: {report_type}")
            
            # Criar documento
            filename = f"relatorio_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
            filepath = self.output_dir / filename
            
            doc = SimpleDocTemplate(str(filepath), pagesize=A4)
            story = []
            
            # Conteúdo baseado no tipo
            story.extend(self._create_custom_content(report_type, report_data, charts_data))
            
            # Construir PDF
            doc.build(story)
            
            self.report_metrics['generated'] += 1
            logger.info(f"✅ Relatório personalizado gerado: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório personalizado: {e}")
            self.report_metrics['errors'] += 1
            raise
    
    async def _collect_monthly_data(self, year: int, month: int) -> Dict[str, Any]:
        """Coleta dados para relatório mensal"""
        
        # Simular coleta de dados (substituir por APIs reais)
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Dados simulados (substituir por chamadas às APIs)
        data = {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days + 1
            },
            'biomass': {
                'terrestrial_total': 2500000 + month * 50000,  # Mg
                'marine_total': 1800000 + month * 30000,      # Mg
                'trend': 'increasing' if month > 6 else 'stable'
            },
            'fishing': {
                'total_catch': 15000 + month * 1200,          # toneladas
                'active_vessels': 450 + month * 20,
                'ports_activity': 85 + month * 2              # %
            },
            'environmental': {
                'avg_chlorophyll': 0.8 + month * 0.05,        # mg/m³
                'avg_temperature': 22 + month * 0.5,          # °C
                'water_quality_index': 75 + month * 1.5
            },
            'migration': {
                'tracked_species': 8,
                'active_routes': 12 + month,
                'seasonal_patterns': 'normal'
            },
            'alerts': {
                'overfishing_zones': max(0, 3 - month // 4),
                'environmental_warnings': max(0, 2 - month // 6),
                'system_issues': 0
            }
        }
        
        return data
    
    async def _collect_weekly_data(self, year: int, week: int) -> Dict[str, Any]:
        """Coleta dados para relatório semanal"""
        
        # Dados simulados para relatório semanal
        data = {
            'period': {
                'year': year,
                'week': week,
                'days': 7
            },
            'system_health': {
                'uptime': 99.2,
                'api_calls': 15420 + week * 200,
                'cache_hit_rate': 78.5,
                'avg_response_time': 245  # ms
            },
            'data_processing': {
                'datasets_processed': 28 + week,
                'analysis_completed': 156 + week * 8,
                'reports_generated': 12 + week // 2
            },
            'user_activity': {
                'active_users': 45 + week * 2,
                'map_exports': 23 + week,
                'api_requests': 8950 + week * 150
            },
            'alerts': [
                {
                    'type': 'info',
                    'message': 'Sistema funcionando normalmente',
                    'timestamp': datetime.now().isoformat()
                }
            ]
        }
        
        return data
    
    async def _generate_monthly_charts(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Gera gráficos para relatório mensal"""
        
        charts = {}
        
        try:
            # Gráfico de biomassa
            fig = make_subplots(
                rows=2, cols=2,
                subplot_titles=('Biomassa por Tipo', 'Tendência Temporal', 
                              'Atividade Pesqueira', 'Qualidade Ambiental'),
                specs=[[{"type": "bar"}, {"type": "scatter"}],
                       [{"type": "bar"}, {"type": "indicator"}]]
            )
            
            # Biomassa por tipo
            fig.add_trace(
                go.Bar(
                    x=['Terrestre', 'Marinha'],
                    y=[data['biomass']['terrestrial_total'], data['biomass']['marine_total']],
                    name='Biomassa (Mg)',
                    marker_color=['#2E8B57', '#40E0D0']
                ),
                row=1, col=1
            )
            
            # Tendência temporal (simulada)
            months = list(range(1, 13))
            terrestrial_trend = [2500000 + m * 50000 for m in months]
            marine_trend = [1800000 + m * 30000 for m in months]
            
            fig.add_trace(
                go.Scatter(
                    x=months,
                    y=terrestrial_trend,
                    mode='lines+markers',
                    name='Biomassa Terrestre',
                    line=dict(color='#2E8B57')
                ),
                row=1, col=2
            )
            
            fig.add_trace(
                go.Scatter(
                    x=months,
                    y=marine_trend,
                    mode='lines+markers',
                    name='Biomassa Marinha',
                    line=dict(color='#40E0D0')
                ),
                row=1, col=2
            )
            
            # Atividade pesqueira
            fig.add_trace(
                go.Bar(
                    x=['Captura Total', 'Embarcações Ativas'],
                    y=[data['fishing']['total_catch'], data['fishing']['active_vessels']],
                    name='Pesca',
                    marker_color='#FF6B35'
                ),
                row=2, col=1
            )
            
            # Indicador de qualidade ambiental
            fig.add_trace(
                go.Indicator(
                    mode="gauge+number",
                    value=data['environmental']['water_quality_index'],
                    domain={'x': [0, 1], 'y': [0, 1]},
                    title={'text': "Qualidade da Água"},
                    gauge={
                        'axis': {'range': [None, 100]},
                        'bar': {'color': "#2E8B57"},
                        'steps': [
                            {'range': [0, 50], 'color': "lightgray"},
                            {'range': [50, 80], 'color': "gray"}
                        ],
                        'threshold': {
                            'line': {'color': "red", 'width': 4},
                            'thickness': 0.75,
                            'value': 90
                        }
                    }
                ),
                row=2, col=2
            )
            
            fig.update_layout(
                height=800,
                title_text="Análise Mensal - Métricas Principais",
                showlegend=False
            )
            
            # Salvar como imagem
            img_buffer = io.BytesIO()
            fig.write_image(img_buffer, format='png', width=800, height=600)
            img_buffer.seek(0)
            
            # Codificar em base64
            charts['monthly_overview'] = base64.b64encode(img_buffer.getvalue()).decode()
            
            logger.info("✅ Gráficos mensais gerados")
            
        except Exception as e:
            logger.error(f"Erro ao gerar gráficos: {e}")
            charts['monthly_overview'] = None
        
        return charts
    
    def _create_header(self, title: str) -> List[Any]:
        """Cria cabeçalho do relatório"""
        
        story = []
        
        # Logo e título
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 12))
        
        # Informações do relatório
        info_data = [
            ['Data de Geração:', datetime.now().strftime('%d/%m/%Y %H:%M')],
            ['Sistema:', 'BGAPP - Plataforma de Análise Geoespacial'],
            ['Versão:', '2.0.0'],
            ['Região:', 'Angola']
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.colors['light']),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['dark']),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['primary'])
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_executive_summary(self, data: Dict[str, Any]) -> List[Any]:
        """Cria sumário executivo"""
        
        story = []
        
        story.append(Paragraph("Sumário Executivo", self.styles['CustomHeading']))
        
        # Principais métricas
        summary_text = f"""
        <para>
        Este relatório apresenta uma análise abrangente dos dados geoespaciais e ambientais 
        de Angola para o período de {data['period']['start']} a {data['period']['end']}.
        </para>
        
        <para>
        <b>Principais Descobertas:</b><br/>
        • Biomassa terrestre total: {data['biomass']['terrestrial_total']:,} Mg<br/>
        • Biomassa marinha total: {data['biomass']['marine_total']:,} Mg<br/>
        • Captura pesqueira: {data['fishing']['total_catch']:,} toneladas<br/>
        • Embarcações ativas: {data['fishing']['active_vessels']:,}<br/>
        • Índice de qualidade da água: {data['environmental']['water_quality_index']:.1f}/100
        </para>
        
        <para>
        <b>Tendências Observadas:</b><br/>
        A análise indica uma tendência {data['biomass']['trend']} na biomassa geral, 
        com atividade pesqueira mantendo-se dentro dos parâmetros sustentáveis.
        </para>
        """
        
        story.append(Paragraph(summary_text, self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_biomass_section(self, data: Dict[str, Any], charts: Dict[str, str]) -> List[Any]:
        """Cria seção de análise de biomassa"""
        
        story = []
        
        story.append(Paragraph("Análise de Biomassa", self.styles['CustomHeading']))
        
        # Tabela de biomassa
        biomass_data = [
            ['Tipo', 'Biomassa Total (Mg)', 'Densidade (Mg/km²)', 'Variação'],
            ['Terrestre', f"{data['biomass']['terrestrial_total']:,}", '4.83', '+2.1%'],
            ['Marinha', f"{data['biomass']['marine_total']:,}", '3.47', '+1.8%'],
            ['Total', f"{data['biomass']['terrestrial_total'] + data['biomass']['marine_total']:,}", '8.30', '+1.95%']
        ]
        
        biomass_table = Table(biomass_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1*inch])
        biomass_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['primary'])
        ]))
        
        story.append(biomass_table)
        story.append(Spacer(1, 15))
        
        # Análise textual
        analysis_text = f"""
        <para>
        A biomassa total registrada no período foi de {data['biomass']['terrestrial_total'] + data['biomass']['marine_total']:,} Mg,
        representando uma densidade média de 8.30 Mg/km² na área de estudo.
        </para>
        
        <para>
        <b>Biomassa Terrestre:</b> Representa {data['biomass']['terrestrial_total']/(data['biomass']['terrestrial_total'] + data['biomass']['marine_total'])*100:.1f}% 
        do total, concentrada principalmente nas regiões de floresta tropical ao norte do país.
        </para>
        
        <para>
        <b>Biomassa Marinha:</b> Corresponde a {data['biomass']['marine_total']/(data['biomass']['terrestrial_total'] + data['biomass']['marine_total'])*100:.1f}% 
        do total, com maior concentração nas águas costeiras devido à ressurgência.
        </para>
        """
        
        story.append(Paragraph(analysis_text, self.styles['CustomBody']))
        story.append(PageBreak())
        
        return story
    
    def _create_fishing_section(self, data: Dict[str, Any], charts: Dict[str, str]) -> List[Any]:
        """Cria seção de análise pesqueira"""
        
        story = []
        
        story.append(Paragraph("Análise da Atividade Pesqueira", self.styles['CustomHeading']))
        
        # Estatísticas pesqueiras
        fishing_text = f"""
        <para>
        Durante o período analisado, foram registradas {data['fishing']['total_catch']:,} toneladas 
        de captura pesqueira, envolvendo {data['fishing']['active_vessels']:,} embarcações ativas 
        em {data['fishing']['ports_activity']:.1f}% dos portos monitorados.
        </para>
        
        <para>
        <b>Distribuição por Zona:</b><br/>
        • Zona Norte (Cabinda-Luanda): 35% da captura total<br/>
        • Zona Centro (Luanda-Lobito): 40% da captura total<br/>
        • Zona Sul (Lobito-Cunene): 25% da captura total
        </para>
        
        <para>
        <b>Principais Espécies:</b><br/>
        • Sardinha: 45% da captura<br/>
        • Cavala: 25% da captura<br/>
        • Atum: 15% da captura<br/>
        • Outras espécies: 15% da captura
        </para>
        """
        
        story.append(Paragraph(fishing_text, self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_temporal_section(self, data: Dict[str, Any], charts: Dict[str, str]) -> List[Any]:
        """Cria seção de análise temporal"""
        
        story = []
        
        story.append(Paragraph("Análise Temporal e Ambiental", self.styles['CustomHeading']))
        
        temporal_text = f"""
        <para>
        <b>Parâmetros Ambientais Médios:</b><br/>
        • Concentração de Clorofila-a: {data['environmental']['avg_chlorophyll']:.2f} mg/m³<br/>
        • Temperatura Superficial do Mar: {data['environmental']['avg_temperature']:.1f}°C<br/>
        • Índice de Qualidade da Água: {data['environmental']['water_quality_index']:.1f}/100
        </para>
        
        <para>
        <b>Padrões Migratórios:</b><br/>
        • Espécies rastreadas: {data['migration']['tracked_species']}<br/>
        • Rotas ativas: {data['migration']['active_routes']}<br/>
        • Padrões sazonais: {data['migration']['seasonal_patterns']}
        </para>
        """
        
        story.append(Paragraph(temporal_text, self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_recommendations_section(self, data: Dict[str, Any]) -> List[Any]:
        """Cria seção de recomendações"""
        
        story = []
        
        story.append(Paragraph("Recomendações de Gestão", self.styles['CustomHeading']))
        
        recommendations = [
            "Manter monitoramento contínuo das zonas de alta biomassa",
            "Implementar medidas de proteção nas rotas migratórias identificadas",
            "Otimizar a distribuição da atividade pesqueira entre as zonas",
            "Intensificar o monitoramento da qualidade da água nas áreas costeiras",
            "Desenvolver planos de manejo adaptativos baseados nos dados coletados"
        ]
        
        rec_text = "<para><b>Recomendações Prioritárias:</b></para>"
        for i, rec in enumerate(recommendations, 1):
            rec_text += f"<para>{i}. {rec}</para>"
        
        story.append(Paragraph(rec_text, self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_appendix_section(self, data: Dict[str, Any]) -> List[Any]:
        """Cria seção de anexos"""
        
        story = []
        
        story.append(Paragraph("Anexos", self.styles['CustomHeading']))
        
        # Metodologia
        methodology_text = """
        <para>
        <b>Metodologia:</b><br/>
        Este relatório foi gerado automaticamente utilizando dados coletados através de:
        • Sensoriamento remoto (MODIS, Sentinel)
        • Dados oceanográficos (Copernicus Marine)
        • Rastreamento animal (Movebank)
        • Dados de pesca (Estatísticas oficiais)
        • Análises espaciais (QGIS/PostGIS)
        </para>
        
        <para>
        <b>Limitações:</b><br/>
        • Dados sujeitos à disponibilidade de cobertura de nuvens
        • Estimativas de biomassa baseadas em modelos
        • Dados de pesca podem apresentar subnotificação
        </para>
        
        <para>
        <b>Próxima Atualização:</b> {(datetime.now() + timedelta(days=30)).strftime('%d/%m/%Y')}
        </para>
        """
        
        story.append(Paragraph(methodology_text, self.styles['CustomBody']))
        
        return story
    
    def _create_weekly_summary(self, data: Dict[str, Any]) -> List[Any]:
        """Cria resumo semanal"""
        
        story = []
        
        story.append(Paragraph("Resumo da Semana", self.styles['CustomHeading']))
        
        summary_text = f"""
        <para>
        <b>Performance do Sistema:</b><br/>
        • Uptime: {data['system_health']['uptime']:.1f}%<br/>
        • Chamadas API: {data['system_health']['api_calls']:,}<br/>
        • Taxa de acerto do cache: {data['system_health']['cache_hit_rate']:.1f}%<br/>
        • Tempo médio de resposta: {data['system_health']['avg_response_time']}ms
        </para>
        
        <para>
        <b>Processamento de Dados:</b><br/>
        • Datasets processados: {data['data_processing']['datasets_processed']}<br/>
        • Análises completadas: {data['data_processing']['analysis_completed']}<br/>
        • Relatórios gerados: {data['data_processing']['reports_generated']}
        </para>
        
        <para>
        <b>Atividade dos Usuários:</b><br/>
        • Usuários ativos: {data['user_activity']['active_users']}<br/>
        • Mapas exportados: {data['user_activity']['map_exports']}<br/>
        • Requisições API: {data['user_activity']['api_requests']:,}
        </para>
        """
        
        story.append(Paragraph(summary_text, self.styles['CustomBody']))
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_alerts_section(self, data: Dict[str, Any]) -> List[Any]:
        """Cria seção de alertas"""
        
        story = []
        
        story.append(Paragraph("Alertas e Notificações", self.styles['CustomHeading']))
        
        if data['alerts']:
            for alert in data['alerts']:
                alert_color = {
                    'info': self.colors['primary'],
                    'warning': self.colors['warning'],
                    'danger': self.colors['danger']
                }.get(alert['type'], self.colors['dark'])
                
                alert_text = f"<para><font color='{alert_color}'>{alert['message']}</font></para>"
                story.append(Paragraph(alert_text, self.styles['CustomBody']))
        else:
            story.append(Paragraph("Nenhum alerta registrado nesta semana.", self.styles['CustomBody']))
        
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_performance_section(self, data: Dict[str, Any]) -> List[Any]:
        """Cria seção de performance"""
        
        story = []
        
        story.append(Paragraph("Métricas de Performance", self.styles['CustomHeading']))
        
        # Tabela de métricas
        metrics_data = [
            ['Métrica', 'Valor', 'Status'],
            ['Uptime do Sistema', f"{data['system_health']['uptime']:.1f}%", '✅ Excelente'],
            ['Taxa de Cache', f"{data['system_health']['cache_hit_rate']:.1f}%", '✅ Boa'],
            ['Tempo de Resposta', f"{data['system_health']['avg_response_time']}ms", '✅ Adequado'],
            ['Usuários Ativos', f"{data['user_activity']['active_users']}", '📈 Crescendo']
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['primary'])
        ]))
        
        story.append(metrics_table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _create_custom_content(self, report_type: str, data: Dict[str, Any], charts: Dict[str, str]) -> List[Any]:
        """Cria conteúdo para relatórios personalizados"""
        
        story = []
        
        # Cabeçalho personalizado
        title_map = {
            'biomass_assessment': 'Avaliação de Biomassa',
            'fishing_analysis': 'Análise Pesqueira',
            'migration_study': 'Estudo de Migração',
            'environmental_impact': 'Impacto Ambiental'
        }
        
        story.extend(self._create_header(title_map.get(report_type, 'Relatório Personalizado')))
        
        # Conteúdo específico baseado no tipo
        if report_type == 'biomass_assessment':
            story.extend(self._create_biomass_section(data, charts))
        elif report_type == 'fishing_analysis':
            story.extend(self._create_fishing_section(data, charts))
        # Adicionar outros tipos conforme necessário
        
        return story
    
    async def send_report_email(self, report_path: str, recipients: List[str], 
                               subject: str = None) -> bool:
        """Envia relatório por email"""
        
        if not self.email_config or not recipients:
            logger.warning("Configuração de email não disponível ou sem destinatários")
            return False
        
        try:
            # Configurar email
            msg = MIMEMultipart()
            msg['From'] = self.email_config.get('sender')
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject or f"Relatório BGAPP - {datetime.now().strftime('%d/%m/%Y')}"
            
            # Corpo do email
            body = """
            Segue em anexo o relatório automático gerado pela plataforma BGAPP.
            
            Este relatório contém análises geoespaciais e ambientais atualizadas para Angola.
            
            Atenciosamente,
            Sistema BGAPP
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Anexar relatório
            with open(report_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {Path(report_path).name}'
            )
            msg.attach(part)
            
            # Enviar email
            server = smtplib.SMTP(self.email_config.get('smtp_server'), self.email_config.get('smtp_port'))
            server.starttls()
            server.login(self.email_config.get('username'), self.email_config.get('password'))
            server.sendmail(msg['From'], recipients, msg.as_string())
            server.quit()
            
            self.report_metrics['sent'] += 1
            logger.info(f"✅ Relatório enviado por email para {len(recipients)} destinatários")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            self.report_metrics['errors'] += 1
            return False
    
    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas do sistema de relatórios"""
        
        return {
            'report_metrics': self.report_metrics,
            'output_directory': str(self.output_dir),
            'total_reports': len(list(self.output_dir.glob('*.pdf'))),
            'last_generated': self.report_metrics.get('last_run'),
            'email_configured': bool(self.email_config)
        }

class ReportScheduler:
    """Agendador de relatórios automáticos"""
    
    def __init__(self, generator: AutomatedReportGenerator):
        self.generator = generator
        self.is_running = False
    
    def setup_schedules(self):
        """Configura agendamentos automáticos"""
        
        # Relatório semanal - toda segunda-feira às 08:00
        schedule.every().monday.at("08:00").do(self._generate_weekly_report)
        
        # Relatório mensal - primeiro dia do mês às 09:00
        schedule.every().month.do(self._generate_monthly_report)
        
        logger.info("✅ Agendamentos configurados")
    
    def _generate_weekly_report(self):
        """Gera relatório semanal agendado"""
        try:
            now = datetime.now()
            year = now.year
            week = now.isocalendar()[1]
            
            asyncio.run(self.generator.generate_weekly_report(year, week))
            logger.info(f"✅ Relatório semanal automático gerado: {year}-W{week}")
        except Exception as e:
            logger.error(f"Erro no relatório semanal automático: {e}")
    
    def _generate_monthly_report(self):
        """Gera relatório mensal agendado"""
        try:
            now = datetime.now()
            # Relatório do mês anterior
            if now.month == 1:
                year = now.year - 1
                month = 12
            else:
                year = now.year
                month = now.month - 1
            
            asyncio.run(self.generator.generate_monthly_report(year, month))
            logger.info(f"✅ Relatório mensal automático gerado: {year}-{month:02d}")
        except Exception as e:
            logger.error(f"Erro no relatório mensal automático: {e}")
    
    def start(self):
        """Inicia o agendador"""
        self.is_running = True
        logger.info("🚀 Agendador de relatórios iniciado")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Verificar a cada minuto
    
    def stop(self):
        """Para o agendador"""
        self.is_running = False
        logger.info("⏹️ Agendador de relatórios parado")

# Exemplo de uso
async def main():
    """Exemplo de uso do sistema de relatórios"""
    
    # Configuração de email (opcional)
    email_config = {
        'sender': 'bgapp@example.com',
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'username': 'your_email@gmail.com',
        'password': 'your_password'
    }
    
    # Inicializar gerador
    generator = AutomatedReportGenerator(email_config=email_config)
    
    # Gerar relatório mensal
    print("📊 Gerando relatório mensal...")
    monthly_report = await generator.generate_monthly_report(2024, 12)
    print(f"✅ Relatório mensal: {monthly_report}")
    
    # Gerar relatório semanal
    print("📈 Gerando relatório semanal...")
    weekly_report = await generator.generate_weekly_report(2024, 50)
    print(f"✅ Relatório semanal: {weekly_report}")
    
    # Relatório personalizado
    print("🎯 Gerando relatório personalizado...")
    custom_report = await generator.generate_custom_report(
        'biomass_assessment',
        {'region': 'angola', 'analysis_type': 'comprehensive'}
    )
    print(f"✅ Relatório personalizado: {custom_report}")
    
    # Métricas
    metrics = generator.get_metrics()
    print(f"📊 Métricas: {metrics}")

if __name__ == "__main__":
    asyncio.run(main())
