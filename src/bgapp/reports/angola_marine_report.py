"""
Sistema de Relatórios Automatizados para Ecossistema Marinho Angolano
Gera relatórios científicos periódicos sobre biodiversidade e estado dos recursos marinhos
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.backends.backend_pdf import PdfPages
import numpy as np


class AngolaMarineReportGenerator:
    """Gerador de relatórios científicos para o ecossistema marinho angolano"""
    
    def __init__(self, data_dir: str = "data", output_dir: str = "reports"):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurar matplotlib para português
        plt.rcParams['font.size'] = 10
        plt.rcParams['axes.labelsize'] = 12
        plt.rcParams['axes.titlesize'] = 14
        plt.rcParams['legend.fontsize'] = 10
        plt.rcParams['figure.titlesize'] = 16
        
        # Cores para diferentes grupos
        self.colors = {
            'marine': '#1e3c72',
            'birds': '#2ecc71', 
            'reptiles': '#9b59b6',
            'endemic': '#f39c12',
            'commercial': '#e74c3c'
        }
    
    def calculate_biodiversity_metrics(self, data: List[Dict]) -> Dict[str, float]:
        """Calcular métricas de biodiversidade"""
        if not data:
            return {}
        
        # Contar espécies e indivíduos
        species_count = {}
        total_individuals = 0
        
        for record in data:
            species = record.get('scientific_name', 'Unknown')
            count = record.get('individual_count', 1)
            species_count[species] = species_count.get(species, 0) + count
            total_individuals += count
        
        S = len(species_count)  # Riqueza específica
        
        if S <= 1:
            return {
                'species_richness': S,
                'shannon_diversity': 0.0,
                'simpson_diversity': 0.0,
                'evenness': 0.0,
                'margalef_richness': 0.0
            }
        
        # Índice de Shannon
        shannon = 0
        for count in species_count.values():
            if count > 0:
                p = count / total_individuals
                shannon -= p * np.log(p)
        
        # Índice de Simpson
        simpson = sum((count / total_individuals) ** 2 for count in species_count.values())
        simpson_diversity = 1 - simpson
        
        # Equitabilidade de Pielou
        evenness = shannon / np.log(S) if S > 1 else 0
        
        # Riqueza de Margalef
        margalef = (S - 1) / np.log(total_individuals) if total_individuals > 1 else 0
        
        return {
            'species_richness': S,
            'shannon_diversity': round(shannon, 3),
            'simpson_diversity': round(simpson_diversity, 3),
            'evenness': round(evenness, 3),
            'margalef_richness': round(margalef, 3),
            'total_individuals': total_individuals
        }
    
    def analyze_temporal_trends(self, data: List[Dict]) -> Dict[str, Any]:
        """Analisar tendências temporais"""
        if not data:
            return {}
        
        # Converter para DataFrame
        df = pd.DataFrame(data)
        if 'date' not in df.columns:
            return {}
        
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        
        if df.empty:
            return {}
        
        # Análise por mês
        df['month'] = df['date'].dt.month
        df['year'] = df['date'].dt.year
        
        monthly_counts = df.groupby('month').size()
        yearly_counts = df.groupby('year').size() if len(df['year'].unique()) > 1 else None
        
        # Sazonalidade
        peak_months = monthly_counts.nlargest(3).index.tolist()
        low_months = monthly_counts.nsmallest(3).index.tolist()
        
        month_names = {
            1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
            5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
            9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
        }
        
        return {
            'date_range': {
                'start': df['date'].min().strftime('%Y-%m-%d'),
                'end': df['date'].max().strftime('%Y-%m-%d')
            },
            'monthly_distribution': monthly_counts.to_dict(),
            'peak_months': [month_names[m] for m in peak_months],
            'low_months': [month_names[m] for m in low_months],
            'yearly_trend': yearly_counts.to_dict() if yearly_counts is not None else None
        }
    
    def analyze_spatial_distribution(self, data: List[Dict]) -> Dict[str, Any]:
        """Analisar distribuição espacial"""
        if not data:
            return {}
        
        latitudes = [r.get('latitude') for r in data if r.get('latitude')]
        longitudes = [r.get('longitude') for r in data if r.get('longitude')]
        
        if not latitudes or not longitudes:
            return {}
        
        # Estatísticas espaciais
        lat_stats = {
            'min': round(min(latitudes), 4),
            'max': round(max(latitudes), 4),
            'mean': round(np.mean(latitudes), 4),
            'std': round(np.std(latitudes), 4)
        }
        
        lon_stats = {
            'min': round(min(longitudes), 4),
            'max': round(max(longitudes), 4),
            'mean': round(np.mean(longitudes), 4),
            'std': round(np.std(longitudes), 4)
        }
        
        # Zonas geográficas aproximadas
        zones = {'norte': 0, 'centro': 0, 'sul': 0}
        for lat in latitudes:
            if lat > -8:
                zones['norte'] += 1
            elif lat > -14:
                zones['centro'] += 1
            else:
                zones['sul'] += 1
        
        return {
            'latitude_stats': lat_stats,
            'longitude_stats': lon_stats,
            'geographic_zones': zones,
            'total_locations': len(latitudes)
        }
    
    def create_visualizations(self, data: List[Dict], report_path: str):
        """Criar visualizações para o relatório"""
        if not data:
            return
        
        df = pd.DataFrame(data)
        
        # Configurar estilo
        sns.set_style("whitegrid")
        
        with PdfPages(report_path) as pdf:
            # Página 1: Distribuição Taxonômica
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
            fig.suptitle('Relatório de Biodiversidade Marinha - Angola', fontsize=16, fontweight='bold')
            
            # Gráfico 1: Distribuição por grupos
            if 'group' in df.columns:
                group_counts = df['group'].value_counts()
                ax1.pie(group_counts.values, labels=group_counts.index, autopct='%1.1f%%',
                       colors=[self.colors.get(g, '#cccccc') for g in group_counts.index])
                ax1.set_title('Distribuição por Grupos Taxonômicos')
            
            # Gráfico 2: Espécies mais frequentes
            if 'scientific_name' in df.columns:
                top_species = df['scientific_name'].value_counts().head(10)
                ax2.barh(range(len(top_species)), top_species.values)
                ax2.set_yticks(range(len(top_species)))
                ax2.set_yticklabels(top_species.index, fontsize=8)
                ax2.set_title('Top 10 Espécies Mais Registadas')
                ax2.set_xlabel('Número de Registos')
            
            # Gráfico 3: Distribuição temporal
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                df_dated = df.dropna(subset=['date'])
                if not df_dated.empty:
                    monthly = df_dated.groupby(df_dated['date'].dt.month).size()
                    ax3.plot(monthly.index, monthly.values, marker='o', color=self.colors['marine'])
                    ax3.set_title('Distribuição Temporal (Mensal)')
                    ax3.set_xlabel('Mês')
                    ax3.set_ylabel('Número de Registos')
                    ax3.set_xticks(range(1, 13))
            
            # Gráfico 4: Distribuição por profundidade
            if 'depth' in df.columns:
                depths = pd.to_numeric(df['depth'], errors='coerce').dropna()
                if not depths.empty:
                    ax4.hist(depths, bins=20, alpha=0.7, color=self.colors['marine'])
                    ax4.set_title('Distribuição por Profundidade')
                    ax4.set_xlabel('Profundidade (m)')
                    ax4.set_ylabel('Frequência')
            
            plt.tight_layout()
            pdf.savefig(fig, bbox_inches='tight')
            plt.close()
            
            # Página 2: Mapa de distribuição espacial
            if 'latitude' in df.columns and 'longitude' in df.columns:
                fig, ax = plt.subplots(1, 1, figsize=(10, 8))
                
                lats = pd.to_numeric(df['latitude'], errors='coerce')
                lons = pd.to_numeric(df['longitude'], errors='coerce')
                
                valid_coords = ~(lats.isna() | lons.isna())
                lats = lats[valid_coords]
                lons = lons[valid_coords]
                
                if not lats.empty and not lons.empty:
                    scatter = ax.scatter(lons, lats, alpha=0.6, s=30, c=self.colors['marine'])
                    ax.set_title('Distribuição Espacial dos Registos - Costa Angolana')
                    ax.set_xlabel('Longitude')
                    ax.set_ylabel('Latitude')
                    
                    # Adicionar contorno aproximado da costa angolana
                    angola_coast_lat = [-4.4, -18.5, -18.5, -4.4, -4.4]
                    angola_coast_lon = [11.4, 11.4, 16.8, 16.8, 11.4]
                    ax.plot(angola_coast_lon, angola_coast_lat, 'r--', alpha=0.5, label='ZEE Angola')
                    ax.legend()
                    
                    ax.grid(True, alpha=0.3)
                
                pdf.savefig(fig, bbox_inches='tight')
                plt.close()
    
    def generate_summary_report(
        self,
        data: List[Dict],
        report_title: str = "Relatório de Biodiversidade Marinha de Angola",
        period: str = None
    ) -> str:
        """Gerar relatório resumo em texto"""
        
        if not period:
            period = datetime.now().strftime("%B %Y")
        
        # Calcular métricas
        biodiversity = self.calculate_biodiversity_metrics(data)
        temporal = self.analyze_temporal_trends(data)
        spatial = self.analyze_spatial_distribution(data)
        
        # Análise por grupos
        groups = {}
        for record in data:
            group = record.get('group', 'unknown')
            if group not in groups:
                groups[group] = []
            groups[group].append(record)
        
        # Espécies endémicas
        endemic_species = [r for r in data if r.get('status') == 'endemic']
        commercial_species = [r for r in data if r.get('commercial_importance') in ['high', 'very_high']]
        
        report = f"""
# {report_title}
**Período:** {period}
**Data de Geração:** {datetime.now().strftime("%d/%m/%Y às %H:%M")}
**Sistema:** BGAPP - Plataforma de Biodiversidade Angola

---

## Resumo Executivo

Este relatório apresenta uma análise abrangente da biodiversidade marinha na Zona Econômica Exclusiva de Angola, baseado em {len(data)} registos científicos.

### Principais Indicadores

- **Riqueza Específica:** {biodiversity.get('species_richness', 0)} espécies registadas
- **Índice de Shannon:** {biodiversity.get('shannon_diversity', 0)} (diversidade)
- **Índice de Simpson:** {biodiversity.get('simpson_diversity', 0)} (dominância)
- **Equitabilidade:** {biodiversity.get('evenness', 0)} (distribuição uniforme)

---

## Análise por Grupos Taxonômicos

"""
        
        for group, records in groups.items():
            if group != 'unknown':
                group_metrics = self.calculate_biodiversity_metrics(records)
                report += f"""
### {group.title()}
- Registos: {len(records)}
- Espécies: {group_metrics.get('species_richness', 0)}
- Diversidade Shannon: {group_metrics.get('shannon_diversity', 0)}
"""
        
        report += f"""

---

## Distribuição Espacial

- **Área de Estudo:** Zona Econômica Exclusiva de Angola
- **Localizações Únicas:** {spatial.get('total_locations', 0)}
- **Latitude:** {spatial.get('latitude_stats', {}).get('min', 0)}° a {spatial.get('latitude_stats', {}).get('max', 0)}°
- **Longitude:** {spatial.get('longitude_stats', {}).get('min', 0)}° a {spatial.get('longitude_stats', {}).get('max', 0)}°

### Distribuição por Zonas:
- **Norte (Cabinda a Luanda):** {spatial.get('geographic_zones', {}).get('norte', 0)} registos
- **Centro (Luanda a Lobito):** {spatial.get('geographic_zones', {}).get('centro', 0)} registos  
- **Sul (Lobito a Cunene):** {spatial.get('geographic_zones', {}).get('sul', 0)} registos

---

## Análise Temporal

"""
        
        if temporal:
            report += f"""
- **Período dos Dados:** {temporal.get('date_range', {}).get('start', 'N/A')} a {temporal.get('date_range', {}).get('end', 'N/A')}
- **Meses de Maior Atividade:** {', '.join(temporal.get('peak_months', []))}
- **Meses de Menor Atividade:** {', '.join(temporal.get('low_months', []))}
"""
        
        report += f"""

---

## Espécies de Interesse Especial

### Espécies Endémicas
{len(endemic_species)} registos de espécies endémicas identificados.

### Espécies de Importância Comercial  
{len(commercial_species)} registos de espécies de alta importância comercial.

---

## Recomendações Científicas

1. **Conservação:** Priorizar proteção das espécies endémicas identificadas
2. **Monitorização:** Intensificar amostragem nas zonas de menor cobertura
3. **Gestão Pesqueira:** Considerar sazonalidade nas regulamentações
4. **Investigação:** Aprofundar estudos sobre espécies comerciais importantes

---

## Qualidade dos Dados

- **Total de Registos:** {len(data)}
- **Registos com Coordenadas:** {spatial.get('total_locations', 0)}
- **Registos com Data:** {len([r for r in data if r.get('date')])}
- **Fonte Principal:** Integração OBIS, GBIF e fontes nacionais

---

*Relatório gerado automaticamente pelo sistema BGAPP*
*Para mais informações: bgapp@uan.ao*
        """
        
        return report.strip()
    
    def generate_full_report(
        self,
        data_file: str,
        output_name: Optional[str] = None
    ) -> str:
        """Gerar relatório completo (texto + visualizações)"""
        
        # Carregar dados
        if not os.path.exists(data_file):
            raise FileNotFoundError(f"Arquivo de dados não encontrado: {data_file}")
        
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            data = data.get('features', data.get('data', []))
        
        # Nome do arquivo de saída
        if not output_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M")
            output_name = f"relatorio_marinho_angola_{timestamp}"
        
        # Gerar relatório de texto
        text_report = self.generate_summary_report(data)
        text_file = self.output_dir / f"{output_name}.md"
        
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(text_report)
        
        # Gerar visualizações
        pdf_file = self.output_dir / f"{output_name}_graficos.pdf"
        self.create_visualizations(data, str(pdf_file))
        
        print(f"✅ Relatório gerado:")
        print(f"   📄 Texto: {text_file}")
        print(f"   📊 Gráficos: {pdf_file}")
        
        return str(text_file)


def main():
    """Função principal para execução via linha de comando"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Gerador de Relatórios Científicos - Biodiversidade Marinha Angola"
    )
    parser.add_argument("data_file", help="Arquivo JSON com dados de biodiversidade")
    parser.add_argument("--output", help="Nome base dos arquivos de saída")
    parser.add_argument("--title", default="Relatório de Biodiversidade Marinha de Angola", 
                       help="Título do relatório")
    
    args = parser.parse_args()
    
    generator = AngolaMarineReportGenerator()
    generator.generate_full_report(args.data_file, args.output)


if __name__ == "__main__":
    main()
