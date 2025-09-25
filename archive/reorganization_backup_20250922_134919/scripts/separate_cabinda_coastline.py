#!/usr/bin/env python3
"""
Separar linha de costa de Cabinda (enclave) da Angola Continental
Corrigir problema de incluir costa da RDC entre os dois territórios
"""

import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CabindaCoastlineSeparator:
    """Separador de linha de costa entre Cabinda e Angola Continental"""
    
    def __init__(self):
        # Fronteiras aproximadas de Cabinda (enclave)
        self.cabinda_bounds = {
            'north': -4.2,   # Fronteira norte com RDC
            'south': -5.8,   # Fronteira sul com RDC  
            'west': 11.4,    # Costa atlântica
            'east': 12.5     # Fronteira terrestre com RDC
        }
        
        # Fronteiras de Angola Continental
        self.angola_mainland_bounds = {
            'north': -6.0,   # Fronteira com RDC (após gap)
            'south': -18.5,  # Fronteira com Namíbia
            'west': 11.5,    # Costa atlântica
            'east': 13.5     # Interior (para ZEE)
        }
    
    def separate_coastlines(self, detailed_coastline_file):
        """Separar linhas de costa de Cabinda e Angola Continental"""
        logger.info("✂️ Separando linha de costa de Cabinda da Angola Continental...")
        
        # Carregar linha de costa detalhada
        with open(detailed_coastline_file, 'r') as f:
            data = json.load(f)
        
        all_coordinates = data['features'][0]['geometry']['coordinates']
        
        cabinda_coords = []
        angola_mainland_coords = []
        
        # Separar coordenadas por território
        for coord in all_coordinates:
            lon, lat = coord
            
            # Verificar se está em Cabinda
            if (self.cabinda_bounds['south'] <= lat <= self.cabinda_bounds['north'] and
                self.cabinda_bounds['west'] <= lon <= self.cabinda_bounds['east']):
                cabinda_coords.append(coord)
            
            # Verificar se está em Angola Continental
            elif (self.angola_mainland_bounds['south'] <= lat <= self.angola_mainland_bounds['north'] and
                  self.angola_mainland_bounds['west'] <= lon <= self.angola_mainland_bounds['east']):
                angola_mainland_coords.append(coord)
            
            # Coordenadas entre -6.0 e -5.8 são da RDC (ignorar)
        
        logger.info(f"📍 Cabinda: {len(cabinda_coords)} pontos")
        logger.info(f"📍 Angola Continental: {len(angola_mainland_coords)} pontos")
        
        return cabinda_coords, angola_mainland_coords
    
    def create_separated_geojson(self, cabinda_coords, angola_coords):
        """Criar ficheiros GeoJSON separados"""
        
        # Cabinda GeoJSON
        cabinda_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Cabinda Coastline",
                    "territory": "Cabinda Enclave",
                    "country": "Angola",
                    "status": "enclave",
                    "points": len(cabinda_coords)
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": cabinda_coords
                }
            }]
        }
        
        # Angola Continental GeoJSON
        angola_geojson = {
            "type": "FeatureCollection", 
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Angola Mainland Coastline",
                    "territory": "Angola Continental",
                    "country": "Angola", 
                    "status": "mainland",
                    "points": len(angola_coords)
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": angola_coords
                }
            }]
        }
        
        return cabinda_geojson, angola_geojson
    
    def create_web_coordinates(self, cabinda_coords, angola_coords):
        """Criar coordenadas para JavaScript (formato Leaflet)"""
        
        # Converter para formato Leaflet [lat, lon]
        cabinda_leaflet = [[coord[1], coord[0]] for coord in cabinda_coords]
        angola_leaflet = [[coord[1], coord[0]] for coord in angola_coords]
        
        # Criar código JavaScript
        js_code = f"""
// === LINHA DE COSTA SEPARADA - CABINDA E ANGOLA ===
// Corrigido para não incluir costa da RDC

// CABINDA (Enclave Norte) - {len(cabinda_coords)} pontos
const cabindaCoastline = {json.dumps(cabinda_leaflet, indent=2)};

// ANGOLA CONTINENTAL (Território Principal) - {len(angola_coords)} pontos  
const angolaMainlandCoastline = {json.dumps(angola_leaflet, indent=2)};

console.log('📍 Cabinda:', cabindaCoastline.length, 'pontos');
console.log('📍 Angola Continental:', angolaMainlandCoastline.length, 'pontos');
"""
        
        return js_code
    
    def process_separation(self):
        """Processar separação completa"""
        logger.info("🚀 Iniciando separação de Cabinda e Angola Continental...")
        
        # Ficheiro de entrada
        input_file = "../qgis_data/angola_coastline_detailed.geojson"
        
        if not Path(input_file).exists():
            logger.error(f"❌ Ficheiro não encontrado: {input_file}")
            return None
        
        # 1. Separar coordenadas
        cabinda_coords, angola_coords = self.separate_coastlines(input_file)
        
        if not cabinda_coords:
            logger.warning("⚠️ Nenhuma coordenada encontrada para Cabinda")
        if not angola_coords:
            logger.warning("⚠️ Nenhuma coordenada encontrada para Angola Continental")
        
        # 2. Criar GeoJSON separados
        cabinda_geojson, angola_geojson = self.create_separated_geojson(cabinda_coords, angola_coords)
        
        # 3. Salvar ficheiros
        cabinda_file = Path("../qgis_data/cabinda_coastline_separated.geojson")
        angola_file = Path("../qgis_data/angola_mainland_coastline_separated.geojson")
        
        with open(cabinda_file, 'w') as f:
            json.dump(cabinda_geojson, f, indent=2)
        
        with open(angola_file, 'w') as f:
            json.dump(angola_geojson, f, indent=2)
        
        # 4. Criar código JavaScript
        js_code = self.create_web_coordinates(cabinda_coords, angola_coords)
        js_file = Path("../qgis_data/separated_coastlines_web.js")
        
        with open(js_file, 'w') as f:
            f.write(js_code)
        
        logger.info("✅ Separação completa!")
        
        return {
            'cabinda_file': str(cabinda_file),
            'angola_file': str(angola_file),
            'js_file': str(js_file),
            'cabinda_points': len(cabinda_coords),
            'angola_points': len(angola_coords)
        }

def main():
    """Função principal"""
    separator = CabindaCoastlineSeparator()
    results = separator.process_separation()
    
    if results:
        print("\n🎯 Separação de Cabinda concluída!")
        print(f"📁 Cabinda: {results['cabinda_file']} ({results['cabinda_points']} pontos)")
        print(f"📁 Angola: {results['angola_file']} ({results['angola_points']} pontos)")
        print(f"📝 JavaScript: {results['js_file']}")
        print("\n⚠️ IMPORTANTE:")
        print("   • Cabinda é um ENCLAVE separado")
        print("   • Costa entre Cabinda e Angola Continental pertence à RDC")
        print("   • Agora temos linhas de costa corretas para cada território")

if __name__ == "__main__":
    main()
