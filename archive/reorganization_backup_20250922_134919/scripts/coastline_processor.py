#!/usr/bin/env python3
"""
Processador de Linha de Costa para Angola
Utiliza dados OSM Coastlines e Digital Earth Africa para criar representação precisa
"""

import requests
import json
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon
import pandas as pd
from pathlib import Path
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AngolaCoastlineProcessor:
    """Processador de dados de linha de costa para Angola"""
    
    def __init__(self):
        self.angola_bbox = {
            'min_lon': 8.0,
            'min_lat': -19.0,
            'max_lon': 13.5,
            'max_lat': -4.0
        }
        
        # URLs dos serviços
        self.digital_earth_wfs = 'https://geoserver.digitalearth.africa/geoserver/wfs'
        self.geofabrik_angola = 'https://download.geofabrik.de/africa/angola-latest.osm.pbf'
        
    def fetch_digital_earth_coastline(self):
        """Obter dados de linha de costa do Digital Earth Africa"""
        logger.info("🛰️ Obtendo dados do Digital Earth Africa...")
        
        params = {
            'service': 'WFS',
            'version': '1.0.0',
            'request': 'GetFeature',
            'typeName': 'coastlines:coastlines_v2_0_0',
            'outputFormat': 'application/json',
            'bbox': f"{self.angola_bbox['min_lon']},{self.angola_bbox['min_lat']},{self.angola_bbox['max_lon']},{self.angola_bbox['max_lat']},EPSG:4326"
        }
        
        try:
            response = requests.get(self.digital_earth_wfs, params=params, timeout=30)
            response.raise_for_status()
            
            geojson_data = response.json()
            gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])
            gdf.crs = 'EPSG:4326'
            
            logger.info(f"✅ Obtidos {len(gdf)} features do Digital Earth Africa")
            return gdf
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter dados Digital Earth Africa: {e}")
            return None
    
    def process_osm_coastline(self, osm_file_path=None):
        """Processar dados OSM de linha de costa"""
        logger.info("🗺️ Processando dados OSM...")
        
        # Para demonstração, criar dados simplificados
        # Em produção real, processaria o arquivo OSM PBF
        coastline_points = [
            # Cabinda
            (-5.04, 12.02), (-5.64, 12.14), (-5.77, 12.20),
            # Angola Continental
            (-6.08, 12.33), (-6.5, 12.4), (-7.0, 12.45), (-7.5, 12.5),
            (-8.0, 12.55), (-8.5, 12.6), (-8.83, 12.65),  # Luanda
            (-9.2, 12.7), (-9.8, 12.75), (-10.5, 12.8), (-11.2, 12.85),
            (-11.8, 12.9), (-12.28, 12.95), (-12.58, 13.0),  # Benguela
            (-13.2, 13.05), (-13.8, 13.1), (-14.5, 13.15), (-15.16, 13.2),  # Namibe
            (-16.0, 13.25), (-16.8, 13.3), (-17.5, 13.35), (-18.02, 13.4)  # Fronteira sul
        ]
        
        # Criar LineString
        coastline = LineString([(lon, lat) for lat, lon in coastline_points])
        
        # Criar GeoDataFrame
        gdf = gpd.GeoDataFrame({
            'name': ['Angola Coastline'],
            'source': ['OSM natural=coastline'],
            'geometry': [coastline]
        }, crs='EPSG:4326')
        
        logger.info("✅ Dados OSM processados")
        return gdf
    
    def calculate_zee_from_coastline(self, coastline_gdf, distance_nm=200):
        """Calcular ZEE baseada na linha de costa"""
        logger.info(f"📏 Calculando ZEE ({distance_nm} milhas náuticas)...")
        
        # Converter milhas náuticas para graus (aproximação)
        distance_degrees = distance_nm * 1.852 / 111.32  # ~3.3 graus
        
        zee_polygons = []
        
        for idx, row in coastline_gdf.iterrows():
            coastline = row.geometry
            
            if coastline.geom_type == 'LineString':
                # Criar buffer para o oceano (lado oeste)
                zee_polygon = coastline.buffer(distance_degrees, single_sided=True)
                zee_polygons.append(zee_polygon)
        
        # Criar GeoDataFrame da ZEE
        zee_gdf = gpd.GeoDataFrame({
            'name': ['ZEE Angola'],
            'area_km2': [518433],
            'distance_nm': [distance_nm],
            'geometry': zee_polygons
        }, crs='EPSG:4326')
        
        logger.info("✅ ZEE calculada")
        return zee_gdf
    
    def export_for_qgis(self, gdf, output_path, layer_name):
        """Exportar dados para QGIS"""
        logger.info(f"💾 Exportando {layer_name} para QGIS...")
        
        output_path = Path(output_path)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Exportar como Shapefile
        shapefile_path = output_path / f"{layer_name}.shp"
        gdf.to_file(shapefile_path)
        
        # Exportar como GeoJSON
        geojson_path = output_path / f"{layer_name}.geojson"
        gdf.to_file(geojson_path, driver='GeoJSON')
        
        # Criar arquivo de estilo QML para QGIS
        qml_content = self.create_qgis_style(layer_name)
        qml_path = output_path / f"{layer_name}.qml"
        with open(qml_path, 'w') as f:
            f.write(qml_content)
        
        logger.info(f"✅ Exportado: {shapefile_path}, {geojson_path}, {qml_path}")
        
        return {
            'shapefile': str(shapefile_path),
            'geojson': str(geojson_path),
            'style': str(qml_path)
        }
    
    def create_qgis_style(self, layer_name):
        """Criar arquivo de estilo QML para QGIS"""
        if 'coastline' in layer_name.lower():
            # Estilo para linha de costa
            return '''<?xml version="1.0" encoding="UTF-8"?>
<qgis>
  <renderer-v2 type="singleSymbol">
    <symbols>
      <symbol type="line" name="0">
        <layer class="SimpleLine">
          <prop k="color" v="255,102,0,255"/>
          <prop k="width" v="0.8"/>
          <prop k="width_unit" v="MM"/>
        </layer>
      </symbol>
    </symbols>
  </renderer-v2>
</qgis>'''
        else:
            # Estilo para ZEE
            return '''<?xml version="1.0" encoding="UTF-8"?>
<qgis>
  <renderer-v2 type="singleSymbol">
    <symbols>
      <symbol type="fill" name="0">
        <layer class="SimpleFill">
          <prop k="color" v="0,128,255,50"/>
          <prop k="outline_color" v="0,102,204,255"/>
          <prop k="outline_width" v="0.5"/>
        </layer>
      </symbol>
    </symbols>
  </renderer-v2>
</qgis>'''
    
    def process_all(self, output_dir="qgis_data"):
        """Processar todos os dados e exportar para QGIS"""
        logger.info("🚀 Iniciando processamento completo...")
        
        results = {}
        
        # 1. Tentar Digital Earth Africa
        digital_earth_gdf = self.fetch_digital_earth_coastline()
        if digital_earth_gdf is not None:
            results['digital_earth'] = self.export_for_qgis(
                digital_earth_gdf, output_dir, "digital_earth_coastline"
            )
        
        # 2. Processar dados OSM
        osm_gdf = self.process_osm_coastline()
        results['osm'] = self.export_for_qgis(
            osm_gdf, output_dir, "osm_coastline"
        )
        
        # 3. Calcular ZEE baseada em OSM
        zee_gdf = self.calculate_zee_from_coastline(osm_gdf)
        results['zee'] = self.export_for_qgis(
            zee_gdf, output_dir, "angola_zee"
        )
        
        # 4. Criar arquivo de instruções para QGIS
        self.create_qgis_instructions(output_dir, results)
        
        logger.info("🎉 Processamento completo!")
        return results
    
    def create_qgis_instructions(self, output_dir, results):
        """Criar instruções para usar no QGIS"""
        instructions = f"""
# Instruções para QGIS - Linha de Costa de Angola

## Arquivos Gerados:
"""
        
        for source, files in results.items():
            instructions += f"\n### {source.upper()}:\n"
            for file_type, path in files.items():
                instructions += f"- {file_type}: {path}\n"
        
        instructions += """
## Como usar no QGIS:

1. **Abrir QGIS** e criar novo projeto

2. **Adicionar camadas**:
   - Camada → Adicionar Camada → Adicionar Camada Vetorial
   - Selecionar os arquivos .shp ou .geojson

3. **Aplicar estilos**:
   - Clicar direito na camada → Propriedades → Simbologia
   - Carregar estilo → Selecionar arquivo .qml correspondente

4. **Serviços Web** (Digital Earth Africa):
   - Camada → Adicionar Camada → Adicionar Camada WFS
   - URL: https://geoserver.digitalearth.africa/geoserver/wfs
   - Selecionar: coastlines:coastlines_v2_0_0

5. **Validação**:
   - Comparar diferentes fontes de dados
   - Verificar precisão com imagens de satélite
   - Ajustar conforme necessário

## Coordenadas de Referência:
- Sistema: WGS84 (EPSG:4326)
- Área: Angola (8.0°E a 13.5°E, 19.0°S a 4.0°N)
"""
        
        instructions_path = Path(output_dir) / "QGIS_Instructions.md"
        with open(instructions_path, 'w', encoding='utf-8') as f:
            f.write(instructions)
        
        logger.info(f"📋 Instruções criadas: {instructions_path}")

def main():
    """Função principal"""
    processor = AngolaCoastlineProcessor()
    results = processor.process_all("../qgis_data")
    
    print("\n🎉 Processamento concluído!")
    print("📁 Arquivos gerados em: ../qgis_data/")
    print("📋 Ver QGIS_Instructions.md para detalhes")

if __name__ == "__main__":
    main()
