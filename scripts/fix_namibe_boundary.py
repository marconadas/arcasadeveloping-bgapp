#!/usr/bin/env python3
"""
Corrigir fronteira sul de Angola no Rio Cunene (fronteira com Namíbia)
MANTER: Qualidade da linha + Cabinda como ENCLAVE
"""

import json
from pathlib import Path

def fix_namibe_boundary():
    """Corrigir limite sul no Rio Cunene"""
    print("🔍 AUDIT: Fronteira Angola-Namíbia...")
    
    # FRONTEIRA OFICIAL: Rio Cunene
    RIO_CUNENE_LAT = -17.266113  # Fronteira oficial
    RIO_CUNENE_LON = 11.751820   # Costa no Rio Cunene
    
    print(f"🇦🇴 Limite oficial Angola: {RIO_CUNENE_LAT}°S, {RIO_CUNENE_LON}°E")
    
    # CABINDA (ENCLAVE) - MANTÉM INALTERADO ✅
    cabinda_corrected = [
        [-4.2610419, 11.4559051], [-4.5693745, 11.8026933], [-4.6277413, 11.8253767], 
        [-4.6674986, 11.7816635], [-4.7586072, 11.8530786], [-4.7878434, 11.8243991], 
        [-5.2157171, 12.1402804], [-5.5186752, 12.2329437], [-5.5632888, 12.2277172]
    ]
    
    # ANGOLA CONTINENTAL - CORRIGIR LIMITE SUL
    angola_mainland_corrected = [
        # Costa Norte (após gap RDC)
        [-6.0221909, 12.4036959],   # Fronteira norte (após RDC)
        [-6.994221, 12.829412],     # Costa Norte
        [-7.266207, 12.853081],     # Região Luanda
        [-8.387412, 13.392435],     # Luanda
        [-8.748862, 13.396121],     # Luanda Sul
        [-9.347036, 13.157238],     # Costa Central
        [-9.979582, 13.311519],     # Central
        [-10.671465, 13.775745],    # Benguela Norte
        [-11.016307, 13.865443],    # Benguela
        [-11.811188, 13.794773],    # Benguela Sul
        [-12.244371, 13.652239],    # Costa Sul Central
        [-12.518141, 13.466596],    # Sul Central
        [-13.419154, 12.531063],    # Namibe Norte
        [-13.846509, 12.528636],    # Namibe Centro
        [-14.059402, 12.361465],    # Namibe
        [-14.412332, 12.355035],    # Namibe Sul
        [-15.112814, 12.117442],    # Costa Sul
        [-15.630326, 11.996153],    # Região Sul
        [-16.019957, 11.806269],    # Extremo Sul Norte
        [-16.498178, 11.824207],    # Extremo Sul
        [-17.266113, 11.751820]     # RIO CUNENE - FRONTEIRA (PARAR AQUI) ⚠️
    ]
    
    print(f"✅ Cabinda (enclave): {len(cabinda_corrected)} pontos")
    print(f"✅ Angola Continental: {len(angola_mainland_corrected)} pontos")
    print(f"🛑 PARA no Rio Cunene: {RIO_CUNENE_LAT}°S")
    
    # Criar ZEE corrigidas
    cabinda_zee_corrected = [
        *cabinda_corrected,
        # Limite oceânico Cabinda (200 milhas náuticas)
        [-5.5632888, 8.9277172], [-5.2157171, 8.8402804], [-4.7878434, 8.5243991], 
        [-4.2610419, 8.1559051], [-4.2610419, 11.4559051]
    ]
    
    angola_zee_corrected = [
        *angola_mainland_corrected,
        # Limite oceânico (PARAR no Rio Cunene)
        [-17.266113, 8.451820],     # Rio Cunene oceânico
        [-16.498178, 8.524207], [-16.019957, 8.506269], [-15.630326, 8.696153], 
        [-15.112814, 8.817442], [-14.412332, 9.055035], [-14.059402, 9.061465], 
        [-13.846509, 9.228636], [-13.419154, 9.231063], [-12.518141, 10.166596], 
        [-12.244371, 10.352239], [-11.811188, 10.494773], [-11.016307, 10.565443], 
        [-10.671465, 10.475745], [-9.979582, 10.011519], [-9.347036, 9.857238], 
        [-8.748862, 10.096121], [-8.387412, 10.092435], [-7.266207, 9.553081], 
        [-6.994221, 9.529412], [-6.0221909, 9.1036959], [-6.0221909, 12.4036959]
    ]
    
    # Gerar código JavaScript FINAL
    js_final = f"""
// === LINHAS DE COSTA FINAIS - FRONTEIRAS RESPEITADAS ===
// ✅ Cabinda: ENCLAVE separado
// ✅ Angola: PARA no Rio Cunene (fronteira Namíbia)
// 🚫 SEM costa da RDC ou Namíbia

// CABINDA (Enclave Norte) - {len(cabinda_corrected)} pontos
const cabindaCoastlineFinal = {json.dumps(cabinda_corrected, indent=2)};

// ANGOLA CONTINENTAL - {len(angola_mainland_corrected)} pontos (até Rio Cunene)
const angolaMainlandFinal = {json.dumps(angola_mainland_corrected, indent=2)};

// === ZEE FINAIS ===

// ZEE de Cabinda (Enclave) - {len(cabinda_zee_corrected)} pontos
const cabindaZEEFinal = {json.dumps(cabinda_zee_corrected, indent=2)};

// ZEE de Angola Continental (até Rio Cunene) - {len(angola_zee_corrected)} pontos
const angolaZEEFinal = {json.dumps(angola_zee_corrected, indent=2)};

console.log('✅ Fronteiras respeitadas:');
console.log('  🏛️ Cabinda: Enclave separado');
console.log('  🇦🇴 Angola: até Rio Cunene');
console.log('  🚫 Sem RDC ou Namíbia');
"""
    
    # Salvar código final
    final_file = Path("../qgis_data/final_angola_coastlines.js")
    with open(final_file, 'w') as f:
        f.write(js_final)
    
    print(f"📝 JavaScript FINAL: {final_file}")
    
    return {
        'cabinda': cabinda_corrected,
        'angola': angola_mainland_corrected,
        'cabinda_zee': cabinda_zee_corrected,
        'angola_zee': angola_zee_corrected,
        'js_file': str(final_file)
    }

if __name__ == "__main__":
    results = fix_namibe_boundary()
    
    print(f"\n🎯 CORREÇÃO FINAL COMPLETA!")
    print(f"   📊 Cabinda: {len(results['cabinda'])} pontos")
    print(f"   📊 Angola: {len(results['angola'])} pontos") 
    print(f"   🛑 Limite: Rio Cunene (-17.266°S)")
    print(f"   🏛️ Status: Cabinda = ENCLAVE")
