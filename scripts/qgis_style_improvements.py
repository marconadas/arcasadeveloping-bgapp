#!/usr/bin/env python3
"""
Melhorias estilo QGIS para linha de costa de Angola
Implementa funcionalidades de análise espacial e validação
"""

import json
import math
import requests
from pathlib import Path
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class QGISStyleProcessor:
    """Processador que simula funcionalidades QGIS"""
    
    def __init__(self):
        self.tolerance = 0.001  # ~100m de tolerância para simplificação
    
    def douglas_peucker_simplify(self, points: List[Tuple[float, float]], tolerance: float) -> List[Tuple[float, float]]:
        """Implementa algoritmo Douglas-Peucker para simplificação de linha"""
        if len(points) <= 2:
            return points
        
        # Encontrar ponto mais distante da linha entre primeiro e último ponto
        max_distance = 0
        max_index = 0
        
        start = points[0]
        end = points[-1]
        
        for i in range(1, len(points) - 1):
            distance = self._point_to_line_distance(points[i], start, end)
            if distance > max_distance:
                max_distance = distance
                max_index = i
        
        # Se a distância máxima é maior que tolerância, dividir recursivamente
        if max_distance > tolerance:
            left_points = self.douglas_peucker_simplify(points[:max_index + 1], tolerance)
            right_points = self.douglas_peucker_simplify(points[max_index:], tolerance)
            
            # Combinar resultados removendo ponto duplicado
            return left_points[:-1] + right_points
        else:
            return [start, end]
    
    def _point_to_line_distance(self, point: Tuple[float, float], line_start: Tuple[float, float], line_end: Tuple[float, float]) -> float:
        """Calcular distância perpendicular de ponto para linha"""
        x0, y0 = point
        x1, y1 = line_start
        x2, y2 = line_end
        
        # Fórmula da distância ponto-linha
        numerator = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        denominator = math.sqrt((y2 - y1)**2 + (x2 - x1)**2)
        
        return numerator / denominator if denominator != 0 else 0
    
    def validate_topology(self, coordinates: List[List[float]]) -> Dict[str, any]:
        """Validar topologia da linha de costa"""
        issues = []
        
        # Verificar auto-intersecções
        self_intersections = self._check_self_intersections(coordinates)
        if self_intersections:
            issues.extend(self_intersections)
        
        # Verificar orientação
        orientation = self._check_orientation(coordinates)
        
        # Verificar densidade de pontos
        density_issues = self._check_point_density(coordinates)
        if density_issues:
            issues.extend(density_issues)
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'orientation': orientation,
            'total_points': len(coordinates)
        }
    
    def _check_self_intersections(self, coordinates: List[List[float]]) -> List[str]:
        """Verificar auto-intersecções na linha"""
        issues = []
        
        # Implementação simplificada - verifica segmentos próximos
        for i in range(len(coordinates) - 3):
            for j in range(i + 2, len(coordinates) - 1):
                if self._segments_intersect(coordinates[i], coordinates[i+1], coordinates[j], coordinates[j+1]):
                    issues.append(f"Auto-intersecção entre segmentos {i}-{i+1} e {j}-{j+1}")
        
        return issues
    
    def _segments_intersect(self, p1: List[float], p2: List[float], p3: List[float], p4: List[float]) -> bool:
        """Verificar se dois segmentos se intersectam"""
        def ccw(A, B, C):
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
        
        return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)
    
    def _check_orientation(self, coordinates: List[List[float]]) -> str:
        """Verificar orientação da linha (horário/anti-horário)"""
        # Para linha de costa, deve seguir orientação específica
        signed_area = 0
        for i in range(len(coordinates) - 1):
            x1, y1 = coordinates[i]
            x2, y2 = coordinates[i + 1]
            signed_area += (x2 - x1) * (y2 + y1)
        
        return "clockwise" if signed_area > 0 else "counter_clockwise"
    
    def _check_point_density(self, coordinates: List[List[float]]) -> List[str]:
        """Verificar densidade adequada de pontos"""
        issues = []
        
        min_distance = 0.01  # ~1km mínimo
        max_distance = 1.0   # ~100km máximo
        
        for i in range(len(coordinates) - 1):
            lon1, lat1 = coordinates[i]
            lon2, lat2 = coordinates[i + 1]
            
            distance = math.sqrt((lon2 - lon1)**2 + (lat2 - lat1)**2)
            
            if distance < min_distance:
                issues.append(f"Pontos {i}-{i+1} muito próximos: {distance:.4f}°")
            elif distance > max_distance:
                issues.append(f"Gap muito grande entre pontos {i}-{i+1}: {distance:.4f}°")
        
        return issues
    
    def create_buffer_zone(self, coordinates: List[List[float]], distance_km: float) -> List[List[float]]:
        """Criar zona de buffer (simulando buffer do QGIS)"""
        # Conversão aproximada: 1° ≈ 111km na latitude de Angola
        distance_degrees = distance_km / 111.0
        
        buffer_points = []
        
        # Criar pontos de buffer para o lado oceânico (oeste)
        for coord in coordinates:
            lon, lat = coord
            # Mover para oeste (oceano)
            buffer_lon = lon - distance_degrees
            buffer_points.append([buffer_lon, lat])
        
        # Fechar o polígono conectando de volta à costa
        buffer_points.extend(reversed(coordinates))
        buffer_points.append(buffer_points[0])  # Fechar polígono
        
        return buffer_points
    
    def enhance_coastline_precision(self, input_file: str, output_file: str):
        """Melhorar precisão da linha de costa usando técnicas QGIS"""
        logger.info("🔧 Aplicando melhorias estilo QGIS...")
        
        # Carregar dados
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        original_coords = data['features'][0]['geometry']['coordinates']
        
        # 1. Validar topologia
        topology_result = self.validate_topology(original_coords)
        logger.info(f"📊 Validação topológica: {topology_result['valid']}")
        
        if topology_result['issues']:
            for issue in topology_result['issues']:
                logger.warning(f"⚠️ {issue}")
        
        # 2. Aplicar simplificação Douglas-Peucker
        simplified_coords = self.douglas_peucker_simplify(
            [(coord[0], coord[1]) for coord in original_coords], 
            self.tolerance
        )
        simplified_coords = [[coord[0], coord[1]] for coord in simplified_coords]
        
        logger.info(f"📉 Simplificação: {len(original_coords)} → {len(simplified_coords)} pontos")
        
        # 3. Adicionar pontos de alta precisão para cidades importantes
        enhanced_coords = self._add_precision_points(simplified_coords)
        
        # 4. Criar dados melhorados
        enhanced_data = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Angola Coastline Enhanced",
                    "source": "QGIS-style processing",
                    "original_points": len(original_coords),
                    "enhanced_points": len(enhanced_coords),
                    "topology_valid": topology_result['valid'],
                    "processing_date": "2025-01-31"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": enhanced_coords
                }
            }]
        }
        
        # 5. Criar ZEE melhorada
        zee_buffer = self.create_buffer_zone(enhanced_coords, 370)  # 200 milhas náuticas
        
        zee_data = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "name": "Angola ZEE Enhanced",
                    "area_km2": 518433,
                    "distance_nm": 200,
                    "method": "QGIS-style buffer",
                    "precision": "enhanced"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [zee_buffer]
                }
            }]
        }
        
        # Salvar arquivos
        coastline_output = Path(output_file)
        with open(coastline_output, 'w') as f:
            json.dump(enhanced_data, f, indent=2)
        
        zee_output = coastline_output.parent / "angola_zee_enhanced.geojson"
        with open(zee_output, 'w') as f:
            json.dump(zee_data, f, indent=2)
        
        logger.info(f"✅ Linha de costa melhorada salva: {coastline_output}")
        logger.info(f"✅ ZEE melhorada salva: {zee_output}")
        
        return {
            'coastline_file': str(coastline_output),
            'zee_file': str(zee_output),
            'original_points': len(original_coords),
            'enhanced_points': len(enhanced_coords),
            'topology_valid': topology_result['valid']
        }
    
    def _add_precision_points(self, coordinates: List[List[float]]) -> List[List[float]]:
        """Adicionar pontos de alta precisão próximos a cidades importantes"""
        # Coordenadas precisas das cidades costeiras
        city_coords = {
            'Cabinda': [12.20, -5.55],
            'Luanda': [13.23, -8.83],    # Corrigido para ficar mais próximo da costa
            'Benguela': [13.41, -12.58],
            'Namibe': [12.15, -15.16]    # Corrigido para ficar mais próximo da costa
        }
        
        enhanced = coordinates.copy()
        
        # Inserir pontos precisos das cidades
        for city, city_coord in city_coords.items():
            # Encontrar posição para inserir
            best_position = 0
            min_distance = float('inf')
            
            for i in range(len(enhanced) - 1):
                # Calcular onde inserir o ponto da cidade
                lat_range = (enhanced[i][1], enhanced[i+1][1])
                if min(lat_range) <= city_coord[1] <= max(lat_range):
                    # Inserir ponto ajustado para a costa
                    coastal_point = [city_coord[0] - 0.08, city_coord[1]]  # Ajustar para costa
                    enhanced.insert(i + 1, coastal_point)
                    logger.info(f"📍 Adicionado ponto preciso para {city}: {coastal_point}")
                    break
        
        return enhanced

def main():
    """Função principal"""
    processor = QGISStyleProcessor()
    
    # Processar linha de costa melhorada
    input_file = "../qgis_data/angola_coastline_improved.geojson"
    output_file = "../qgis_data/angola_coastline_qgis_enhanced.geojson"
    
    if not Path(input_file).exists():
        logger.error(f"❌ Arquivo não encontrado: {input_file}")
        return
    
    results = processor.enhance_coastline_precision(input_file, output_file)
    
    print("\n🎯 Melhorias QGIS aplicadas:")
    print(f"  📊 Pontos originais: {results['original_points']}")
    print(f"  📈 Pontos melhorados: {results['enhanced_points']}")
    print(f"  ✅ Topologia válida: {results['topology_valid']}")
    print(f"  📁 Arquivos gerados:")
    print(f"    • {results['coastline_file']}")
    print(f"    • {results['zee_file']}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
