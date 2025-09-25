#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Script de Configuração dos Novos Serviços - BGAPP
===================================================

Este script configura e instala todos os novos serviços implementados:
- Verifica dependências
- Cria estrutura de diretórios
- Configura ficheiros de configuração
- Executa testes básicos

Autor: Sistema BGAPP
Data: Janeiro 2025
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

def print_header(title: str):
    """Imprimir cabeçalho formatado"""
    print("\n" + "="*60)
    print(f"🚀 {title}")
    print("="*60)

def print_step(step: str):
    """Imprimir passo"""
    print(f"\n📋 {step}")

def print_success(message: str):
    """Imprimir mensagem de sucesso"""
    print(f"✅ {message}")

def print_warning(message: str):
    """Imprimir aviso"""
    print(f"⚠️ {message}")

def print_error(message: str):
    """Imprimir erro"""
    print(f"❌ {message}")

def check_python_version():
    """Verificar versão do Python"""
    print_step("Verificando versão do Python...")
    
    if sys.version_info < (3, 8):
        print_error(f"Python 3.8+ necessário. Versão atual: {sys.version}")
        return False
    
    print_success(f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def install_dependencies():
    """Instalar dependências"""
    print_step("Instalando dependências...")
    
    requirements_file = Path("requirements-new-services.txt")
    
    if not requirements_file.exists():
        print_error(f"Ficheiro {requirements_file} não encontrado")
        return False
    
    try:
        # Instalar dependências
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, capture_output=True, text=True)
        
        print_success("Dependências instaladas com sucesso")
        return True
        
    except subprocess.CalledProcessError as e:
        print_error(f"Erro ao instalar dependências: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False

def create_directory_structure():
    """Criar estrutura de diretórios"""
    print_step("Criando estrutura de diretórios...")
    
    directories = [
        "data/maxent",
        "data/boundaries", 
        "data/coastal",
        "data/mcda",
        "data/satellite",
        "models/maxent",
        "outputs/maxent",
        "outputs/boundaries",
        "outputs/coastal", 
        "outputs/mcda",
        "cache/boundaries",
        "logs/services"
    ]
    
    created_count = 0
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            created_count += 1
    
    print_success(f"Criados {created_count} diretórios")
    return True

def create_config_files():
    """Criar ficheiros de configuração"""
    print_step("Criando ficheiros de configuração...")
    
    configs_dir = Path("configs")
    configs_dir.mkdir(exist_ok=True)
    
    # Configuração MaxEnt
    maxent_config = {
        "data_dir": "data/maxent",
        "models_dir": "models/maxent", 
        "output_dir": "outputs/maxent",
        "gbif_api_url": "https://api.gbif.org/v1",
        "obis_api_url": "https://api.obis.org/v3",
        "max_occurrences": 10000,
        "test_size": 0.2,
        "random_state": 42,
        "n_background_points": 10000,
        "angola_bounds": {
            "min_lat": -18.0,
            "max_lat": -4.0,
            "min_lon": 8.0,
            "max_lon": 24.0
        }
    }
    
    with open(configs_dir / "maxent_config.json", "w", encoding="utf-8") as f:
        json.dump(maxent_config, f, indent=2, ensure_ascii=False)
    
    # Configuração Boundaries
    boundaries_config = {
        "data_dir": "data/boundaries",
        "output_dir": "outputs/boundaries",
        "cache_dir": "cache/boundaries",
        "natural_earth_url": "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download",
        "angola_bounds": {
            "min_lat": -18.0,
            "max_lat": -4.0,
            "min_lon": 8.0,
            "max_lon": 24.0
        },
        "buffer_distance_nm": 200,
        "simplification_tolerance": 0.001,
        "validation_tolerance": 0.0001
    }
    
    with open(configs_dir / "boundaries_config.json", "w", encoding="utf-8") as f:
        json.dump(boundaries_config, f, indent=2, ensure_ascii=False)
    
    # Configuração Coastal
    coastal_config = {
        "data_dir": "data/coastal",
        "output_dir": "outputs/coastal",
        "satellite_dir": "data/satellite",
        "angola_coastline": {
            "north_lat": -4.0,
            "south_lat": -18.0,
            "west_lon": 11.5,
            "east_lon": 13.5
        },
        "segment_length_km": 5.0,
        "change_detection_threshold_m": 10.0,
        "monitoring_interval_days": 30,
        "vulnerability_weights": {
            "physical": 0.4,
            "socioeconomic": 0.3,
            "adaptive_capacity": 0.3
        }
    }
    
    with open(configs_dir / "coastal_config.json", "w", encoding="utf-8") as f:
        json.dump(coastal_config, f, indent=2, ensure_ascii=False)
    
    # Configuração MCDA
    mcda_config = {
        "data_dir": "data/mcda",
        "output_dir": "outputs/mcda",
        "angola_marine_area": {
            "min_lat": -18.0,
            "max_lat": -4.0,
            "min_lon": 8.0,
            "max_lon": 16.0
        },
        "grid_resolution_km": 10,
        "consistency_threshold": 0.1,
        "sensitivity_steps": 20
    }
    
    with open(configs_dir / "mcda_config.json", "w", encoding="utf-8") as f:
        json.dump(mcda_config, f, indent=2, ensure_ascii=False)
    
    print_success("Ficheiros de configuração criados")
    return True

def create_init_files():
    """Criar ficheiros __init__.py"""
    print_step("Criando ficheiros __init__.py...")
    
    init_files = [
        "src/bgapp/services/__init__.py",
        "src/bgapp/services/biodiversity/__init__.py",
        "src/bgapp/services/spatial_analysis/__init__.py",
        "src/bgapp/services/marine_planning/__init__.py"
    ]
    
    for init_file in init_files:
        init_path = Path(init_file)
        init_path.parent.mkdir(parents=True, exist_ok=True)
        
        if not init_path.exists():
            with open(init_path, "w", encoding="utf-8") as f:
                f.write('"""Serviços BGAPP"""\n')
    
    print_success("Ficheiros __init__.py criados")
    return True

def test_imports():
    """Testar importações dos novos módulos"""
    print_step("Testando importações...")
    
    try:
        # Adicionar src ao path
        sys.path.insert(0, str(Path("src")))
        
        # Testar importações
        from bgapp.services.biodiversity.maxent_service import MaxEntService
        from bgapp.services.spatial_analysis.boundary_processor import BoundaryProcessor
        from bgapp.services.spatial_analysis.coastal_analysis import CoastalAnalysisService
        from bgapp.services.marine_planning.mcda_service import MCDAService
        
        print_success("Todas as importações funcionaram")
        return True
        
    except ImportError as e:
        print_error(f"Erro na importação: {e}")
        return False

def create_documentation():
    """Criar documentação básica"""
    print_step("Criando documentação...")
    
    docs_dir = Path("docs/new_services")
    docs_dir.mkdir(parents=True, exist_ok=True)
    
    readme_content = f"""# 🌊 Novos Serviços BGAPP

## 📋 Serviços Implementados

### 🧠 MaxEnt Service
- **Localização**: `src/bgapp/services/biodiversity/maxent_service.py`
- **Função**: Modelação de distribuição de espécies
- **Configuração**: `configs/maxent_config.json`

### 🌍 Boundary Processor  
- **Localização**: `src/bgapp/services/spatial_analysis/boundary_processor.py`
- **Função**: Processamento de fronteiras marítimas
- **Configuração**: `configs/boundaries_config.json`

### 🌊 Coastal Analysis Service
- **Localização**: `src/bgapp/services/spatial_analysis/coastal_analysis.py`
- **Função**: Análise avançada de linha costeira
- **Configuração**: `configs/coastal_config.json`

### 🎯 MCDA Service
- **Localização**: `src/bgapp/services/marine_planning/mcda_service.py`
- **Função**: Análise multi-critério para planeamento
- **Configuração**: `configs/mcda_config.json`

## 🚀 Como Usar

### Teste Rápido
```bash
python test_new_services.py
```

### Exemplo MaxEnt
```python
from bgapp.services.biodiversity.maxent_service import MaxEntService

maxent = MaxEntService()
result = await maxent.train_maxent_model("Sardinella aurita")
```

### Exemplo MCDA
```python
from bgapp.services.marine_planning.mcda_service import MCDAService, PlanningObjective

mcda = MCDAService()
alternatives = mcda.create_spatial_grid()
alternatives = mcda.populate_criteria_values(alternatives, PlanningObjective.AQUACULTURE)
```

## 📊 Estrutura de Diretórios

```
data/
├── maxent/          # Dados de espécies
├── boundaries/      # Dados de fronteiras
├── coastal/         # Dados costeiros
├── mcda/           # Dados MCDA
└── satellite/      # Imagens satelitais

outputs/
├── maxent/         # Resultados MaxEnt
├── boundaries/     # Mapas de fronteiras
├── coastal/        # Análises costeiras
└── mcda/          # Resultados MCDA

models/
└── maxent/        # Modelos treinados
```

## 🔧 Configuração

Todos os serviços podem ser configurados através dos ficheiros JSON em `configs/`.

## 📝 Logs

Os logs dos serviços são armazenados em `logs/services/`.

---

**Data de Criação**: {datetime.now().strftime('%d/%m/%Y %H:%M')}
**Versão**: 1.0.0
"""
    
    with open(docs_dir / "README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    print_success("Documentação criada")
    return True

def main():
    """Função principal"""
    print_header("CONFIGURAÇÃO DOS NOVOS SERVIÇOS BGAPP")
    
    # Lista de verificações
    checks = [
        ("Verificar Python", check_python_version),
        ("Instalar Dependências", install_dependencies),
        ("Criar Diretórios", create_directory_structure),
        ("Criar Configurações", create_config_files),
        ("Criar __init__.py", create_init_files),
        ("Testar Importações", test_imports),
        ("Criar Documentação", create_documentation)
    ]
    
    success_count = 0
    total_checks = len(checks)
    
    for check_name, check_function in checks:
        try:
            if check_function():
                success_count += 1
            else:
                print_warning(f"Falha em: {check_name}")
        except Exception as e:
            print_error(f"Erro em {check_name}: {str(e)}")
    
    # Resumo
    print_header("RESUMO DA CONFIGURAÇÃO")
    print(f"📊 Verificações: {success_count}/{total_checks}")
    
    if success_count == total_checks:
        print_success("🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!")
        print("\n📋 Próximos passos:")
        print("   1. Execute: python test_new_services.py")
        print("   2. Verifique a documentação em docs/new_services/")
        print("   3. Configure os ficheiros em configs/ conforme necessário")
        print("   4. Integre os novos serviços na aplicação principal")
        
        return True
    else:
        print_warning("⚠️ Configuração incompleta. Verifique os erros acima.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
