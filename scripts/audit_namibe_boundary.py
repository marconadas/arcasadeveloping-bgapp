#!/usr/bin/env python3
"""
Audit da fronteira sul de Angola (Namibe) para corrigir linha de costa
"""

import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NamibeBoundaryAuditor:
    """Auditor da fronteira sul de Angola"""
    
    def __init__(self):
        # Fronteira oficial Angola-Namíbia
        self.angola_south_limit = {
            'latitude': -17.266113,  # Rio Cunene (fronteira oficial)
            'longitude_coast': 11.751820,  # Costa no Rio Cunene
            'longitude_zee': 8.451820   # Limite oceânico ZEE
        }
        
        # Limites de Namibe (cidade mais ao sul de Angola)
        self.namibe_limits = {
            'city_lat': -15.16,
            'city_lon': 12.15,
            'province_south': -17.27  # Limite sul da província do Namibe
        }
    
    def audit_current_coastline(self):
        """Auditar linha de costa atual"""
        logger.info("🔍 Auditando fronteira sul de Angola...")
        
        # Verificar ficheiros atuais
        files_to_check = [
            "../qgis_data/angola_coastline_detailed.geojson",
            "../qgis_data/angola_mainland_coastline_separated.geojson"
        ]
        
        issues = []
        
        for file_path in files_to_check:
            if Path(file_path).exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                coords = data['features'][0]['geometry']['coordinates']
                
                # Verificar pontos que ultrapassam a fronteira
                for i, coord in enumerate(coords):
                    lon, lat = coord
                    
                    if lat < self.angola_south_limit['latitude']:
                        issues.append({
                            'file': file_path,
                            'point': i,
                            'coordinates': [lon, lat],
                            'problem': f'Ponto ultrapassa fronteira (lat: {lat:.6f} < {self.angola_south_limit["latitude"]})'
                        })
        
        return issues
    
    def create_corrected_coastlines(self):
        """Criar linhas de costa corrigidas"""
        logger.info("🔧 Criando linhas de costa corrigidas...")
        
        # CABINDA (Enclave) - Mantém como está (correto)
        cabinda_corrected = [
            [-4.2610419, 11.4559051], [-4.5693745, 11.8026933], [-4.7878434, 11.8243991], 
            [-5.2157171, 12.1402804], [-5.5186752, 12.2329437], [-5.5632888, 12.2277172]
        ]
        
        # ANGOLA CONTINENTAL - Corrigir limite sul
        angola_mainland_corrected = [
            # Costa Norte (a partir da fronteira com RDC)
            [-6.0221909, 12.4036959],   # Início Angola Continental (após gap RDC)
            [-6.994221, 12.829412],     # Costa Norte
            [-8.387412, 13.392435],     # Luanda região
            [-9.347036, 13.157238],     # Costa Central
            [-10.671465, 13.775745],    # Região Central
            [-11.811188, 13.794773],    # Benguela região
            [-12.244371, 13.652239],    # Costa Sul Central
            [-12.518141, 13.466596],    # Benguela Sul
            [-13.419154, 12.531063],    # Costa Sul
            [-13.846509, 12.528636],    # Região Sul
            [-14.412332, 12.355035],    # Namibe Norte
            [-15.112814, 12.117442],    # Namibe Centro
            [-15.630326, 11.996153],    # Namibe Sul
            [-16.498178, 11.824207],    # Região extremo sul
            [-17.266113, 11.751820]     # RIO CUNENE - FRONTEIRA OFICIAL (PARAR AQUI)
        ]
        
        return cabinda_corrected, angola_mainland_corrected
    
    def create_corrected_zee(self, cabinda_coast, angola_coast):
        """Criar ZEE corrigidas"""
        
        # ZEE de Cabinda (enclave)
        cabinda_zee = [
            *[[coord[0], coord[1]] for coord in cabinda_coast],
            # Limite oceânico Cabinda
            [-5.5632888, 8.9277172], [-5.2157171, 8.8402804], [-4.7878434, 8.5243991], 
            [-4.2610419, 8.1559051], [-4.2610419, 11.4559051]
        ]
        
        # ZEE de Angola Continental (corrigida)
        angola_zee = [
            *[[coord[0], coord[1]] for coord in angola_coast],
            # Limite oceânico (PARAR no Rio Cunene)
            [-17.266113, 8.451820],    # Limite oceânico no Rio Cunene
            [-16.498178, 8.524207], [-15.630326, 8.696153], [-14.412332, 9.055035], 
            [-13.419154, 9.231063], [-12.518141, 10.166596], [-11.811188, 10.494773], 
            [-10.671465, 10.475745], [-9.347036, 9.857238], [-8.387412, 10.092435], 
            [-6.994221, 9.529412], [-6.0221909, 9.1036959], [-6.0221909, 12.4036959]
        ]
        
        return cabinda_zee, angola_zee
    
    def generate_corrected_javascript(self):
        """Gerar JavaScript corrigido"""
        
        cabinda_coast, angola_coast = self.create_corrected_coastlines()
        cabinda_zee, angola_zee = self.create_corrected_zee(cabinda_coast, angola_coast)
        
        js_code = f"""
// === LINHAS DE COSTA CORRIGIDAS - FRONTEIRAS RESPEITADAS ===
// ⚠️ IMPORTANTE: Cabinda é um ENCLAVE separado!
// 🚫 NÃO inclui costa da RDC entre Cabinda e Angola
// 🇳🇦 PARA no Rio Cunene (fronteira com Namíbia)

// CABINDA (Enclave Norte) - {len(cabinda_coast)} pontos
const cabindaCoastlineCorrected = {json.dumps(cabinda_coast, indent=2)};

// ANGOLA CONTINENTAL (Território Principal) - {len(angola_coast)} pontos
// TERMINA no Rio Cunene (-17.266113°, 11.751820°)
const angolaMainlandCorrected = {json.dumps(angola_coast, indent=2)};

// === ZEE CORRIGIDAS ===

// ZEE de Cabinda (Enclave) - {len(cabinda_zee)} pontos
const cabindaZEECorrected = {json.dumps(cabinda_zee, indent=2)};

// ZEE de Angola Continental (até Rio Cunene) - {len(angola_zee)} pontos
const angolaZEECorrected = {json.dumps(angola_zee, indent=2)};

console.log('✅ Linhas de costa corrigidas carregadas');
console.log('🏛️ Cabinda: ENCLAVE separado');
console.log('🇦🇴 Angola Continental: até Rio Cunene');
console.log('🚫 Sem costa da RDC ou Namíbia');
"""
        
        # Salvar código JavaScript corrigido
        js_file = Path("../qgis_data/final_corrected_coastlines.js")
        with open(js_file, 'w') as f:
            f.write(js_code)
        
        logger.info(f"📝 JavaScript corrigido salvo: {js_file}")
        
        return {
            'cabinda_points': len(cabinda_coast),
            'angola_points': len(angola_coast),
            'cabinda_zee_points': len(cabinda_zee),
            'angola_zee_points': len(angola_zee),
            'js_file': str(js_file)
        }

def main():
    """Função principal"""
    auditor = NamibeBoundaryAuditor()
    
    # 1. Audit dos problemas atuais
    issues = auditor.audit_current_coastline()
    
    if issues:
        print("⚠️ PROBLEMAS ENCONTRADOS:")
        for issue in issues:
            print(f"  📍 {issue['problem']}")
            print(f"     Ficheiro: {issue['file']}")
            print(f"     Coordenadas: {issue['coordinates']}")
    
    # 2. Criar correções
    results = auditor.generate_corrected_javascript()
    
    print(f"\n✅ CORREÇÕES APLICADAS:")
    print(f"🏛️ Cabinda (enclave): {results['cabinda_points']} pontos")
    print(f"🇦🇴 Angola Continental: {results['angola_points']} pontos")
    print(f"🌊 ZEE Cabinda: {results['cabinda_zee_points']} pontos")
    print(f"🌊 ZEE Angola: {results['angola_zee_points']} pontos")
    print(f"📝 JavaScript: {results['js_file']}")
    
    print(f"\n🎯 LIMITES RESPEITADOS:")
    print(f"   • Cabinda: ENCLAVE (-4.26° a -5.56°S)")
    print(f"   • Angola: até Rio Cunene (-17.266°S)")
    print(f"   • SEM costa da RDC ou Namíbia")

if __name__ == "__main__":
    main()
