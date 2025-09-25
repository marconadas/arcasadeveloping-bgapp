# 📚 Tutorial Completo - Funcionalidades QGIS BGAPP

## 🎯 Visão Geral

Este tutorial abrangente guia você através de todas as funcionalidades QGIS integradas na plataforma BGAPP, desde análises básicas até exportação de mapas interativos avançados.

## 📖 Índice

1. [Introdução e Configuração](#1-introdução-e-configuração)
2. [Dashboard Interativo](#2-dashboard-interativo)
3. [Análises Espaciais](#3-análises-espaciais)
4. [Análises Temporais](#4-análises-temporais)
5. [Cálculos de Biomassa](#5-cálculos-de-biomassa)
6. [Análises de Migração](#6-análises-de-migração)
7. [Relatórios Automáticos](#7-relatórios-automáticos)
8. [Análise Multicritério (MCDA)](#8-análise-multicritério-mcda)
9. [Exportação de Mapas](#9-exportação-de-mapas)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Introdução e Configuração

### 🚀 Primeiros Passos

#### Acessando o Sistema
1. Abra seu navegador e acesse: `http://localhost:8085/admin.html`
2. Na sidebar, clique em **"Interfaces BGAPP"**
3. Selecione **"Dashboard QGIS Interativo"**

#### Verificando Status do Sistema
```bash
# Verificar se todos os serviços estão funcionando
curl http://localhost:8000/qgis/status
```

### 🎛️ Interface Principal

O dashboard QGIS é dividido em duas áreas principais:
- **Sidebar (Esquerda)**: Controles e configurações
- **Mapa Principal (Direita)**: Visualização interativa

---

## 2. Dashboard Interativo

### 🗺️ Navegação Básica

#### Controles do Mapa
- **Zoom**: Use a roda do mouse ou os botões +/-
- **Pan**: Clique e arraste para mover o mapa
- **Camadas Base**: Escolha entre OpenStreetMap, Satélite, ou Oceano

#### Gerenciamento de Camadas
```javascript
// Exemplo de controle via JavaScript
toggleLayer('fishing', true);  // Ativar camada de pesca
setLayerOpacity('zee', 0.5);   // Definir opacidade da ZEE
```

### 🎚️ Controles Temporais

#### Slider Temporal
1. **Período**: Defina datas de início e fim
2. **Variável**: Escolha entre clorofila-a, temperatura, biomassa, etc.
3. **Animação**: Use o botão play para animação automática
4. **Velocidade**: Ajuste a velocidade da animação (1-10)

#### Exemplo Prático - Análise Sazonal
```python
# Via API
import requests

response = requests.post('http://localhost:8000/qgis/temporal/slider-config', json={
    "variable": "chlorophyll_a",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "region": "angola_waters"
})
```

---

## 3. Análises Espaciais

### 🎯 Identificação de Hotspots

#### Passo a Passo
1. **Selecionar Ferramenta**: Vá para "Ferramentas de Análise"
2. **Escolher Tipo**: Selecione "Identificar Hotspots"
3. **Definir Região**: Escolha a área de interesse
4. **Executar**: Clique em "Executar Análise"

#### Via API
```python
import requests

# Dados de exemplo
point_data = [
    {"coordinates": [13.2317, -8.8383], "biomass": 150.5},
    {"coordinates": [13.4049, -12.5756], "biomass": 200.3},
    {"coordinates": [12.8086, -5.7269], "biomass": 175.8}
]

response = requests.post('http://localhost:8000/qgis/spatial/hotspots', json={
    "point_data": point_data,
    "analysis_field": "biomass",
    "method": "kernel_density"
})

print(f"Hotspots encontrados: {response.json()['hotspots_count']}")
```

### 🔗 Análise de Conectividade

#### Conceito
Avalia como diferentes habitats estão conectados considerando a mobilidade das espécies.

#### Exemplo Prático
```python
# Definir habitats
habitats = [
    {"type": "Point", "coordinates": [13.2317, -8.8383], "habitat_type": "coral_reef"},
    {"type": "Point", "coordinates": [13.4049, -12.5756], "habitat_type": "seagrass"},
    {"type": "Point", "coordinates": [12.8086, -5.7269], "habitat_type": "mangrove"}
]

# Executar análise
response = requests.post('http://localhost:8000/qgis/spatial/connectivity-analysis', json={
    "habitats": habitats,
    "species_mobility": 50.0,  # km
    "barrier_features": []
})

connectivity_matrix = response.json()['connectivity_matrix']
```

### 🛡️ Zonas Buffer

#### Quando Usar
- Criar áreas de proteção ao redor de pontos importantes
- Análise de impacto de atividades humanas
- Planejamento de conservação

#### Implementação
```python
# Definir geometrias
geometries = [
    {"type": "Point", "coordinates": [13.2317, -8.8383]},  # Porto de Luanda
    {"type": "Point", "coordinates": [13.4049, -12.5756]}  # Porto de Benguela
]

# Criar buffers de 5km
response = requests.post('http://localhost:8000/qgis/spatial/buffer-zones', json={
    "geometries": geometries,
    "buffer_distance": 5000  # metros
})

buffer_zones = response.json()['buffer_zones']
```

---

## 4. Análises Temporais

### 📊 Estatísticas Temporais

#### Obter Estatísticas de Variável
```python
# Estatísticas de clorofila-a
response = requests.get(
    'http://localhost:8000/qgis/temporal/statistics/chlorophyll_a',
    params={
        'start_date': '2024-01-01',
        'end_date': '2024-12-31',
        'region': 'angola_waters'
    }
)

stats = response.json()
print(f"Média anual: {stats['mean']:.2f} mg/m³")
print(f"Tendência: {stats['trend']}")
```

### 🎬 Animações Multi-Variáveis

#### Criar Animação Combinada
```python
# Animação de clorofila-a e temperatura
response = requests.post('http://localhost:8000/qgis/temporal/multi-variable', json={
    "variables": ["chlorophyll_a", "sea_surface_temperature"],
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "region": "angola_waters",
    "animation_speed": 3
})

animation_url = response.json()['animation_url']
```

### 🐟 Animação de Migração

#### Visualizar Padrões Migratórios
```python
# Animação de migração de atuns
response = requests.post('http://localhost:8000/qgis/temporal/migration-animation', json={
    "species": "tuna",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "region": "angola_waters"
})

migration_data = response.json()['migration_tracks']
```

---

## 5. Cálculos de Biomassa

### 🌱 Biomassa Terrestre

#### Cálculo por Região
```python
# Definir área de interesse
region_bounds = {
    "north": -5.0,
    "south": -18.0,
    "east": 24.0,
    "west": 11.0
}

# Calcular biomassa terrestre
response = requests.post('http://localhost:8000/qgis/biomass/terrestrial', json={
    "region_bounds": region_bounds,
    "vegetation_type": "mixed",
    "calculation_date": "2024-06-15"
})

biomass_result = response.json()
print(f"Biomassa total: {biomass_result['total_biomass']:.2f} Mg")
print(f"Densidade média: {biomass_result['mean_density']:.2f} Mg/ha")
```

### 🌊 Biomassa Marinha (Fitoplâncton)

#### Análise de Produtividade Primária
```python
# Calcular biomassa de fitoplâncton
response = requests.post('http://localhost:8000/qgis/biomass/marine-phytoplankton', json={
    "region_bounds": region_bounds,
    "depth_range": [0, 50],  # metros
    "season": "summer"
})

marine_biomass = response.json()
print(f"Produtividade primária: {marine_biomass['primary_productivity']:.2f} gC/m²/day")
```

### 📊 Avaliação Completa de Angola

#### Relatório Integrado
```python
# Avaliação completa do país
response = requests.get('http://localhost:8000/qgis/biomass/angola-assessment')

assessment = response.json()
print(f"Biomassa terrestre total: {assessment['terrestrial_total']:.0f} Mg")
print(f"Biomassa marinha total: {assessment['marine_total']:.0f} Mg")
print(f"Índice de sustentabilidade: {assessment['sustainability_index']:.2f}")
```

---

## 6. Análises de Migração

### 📡 Carregamento de Trajetórias

#### Dados de Rastreamento
```python
# Carregar trajetórias de espécies
response = requests.post('http://localhost:8000/qgis/migration/load-trajectories', json={
    "species": "tuna",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "data_source": "movebank"
})

trajectories = response.json()['trajectories']
print(f"Trajetórias carregadas: {len(trajectories)}")
```

### 🎣 Migração vs Pesca

#### Análise de Sobreposição
```python
# Análise completa migração x pesca
response = requests.get('http://localhost:8000/qgis/migration/fishing-analysis')

analysis = response.json()
print(f"Zonas de conflito: {analysis['conflict_zones']}")
print(f"Recomendações: {analysis['recommendations']}")
```

### 🗺️ Mapeamento de Corredores

#### Identificar Corredores Migratórios
```python
# Identificar corredores principais
corridors = []
for trajectory in trajectories:
    if trajectory['frequency'] > 0.7:  # 70% das migrações
        corridors.append({
            'path': trajectory['path'],
            'species': trajectory['species'],
            'importance': trajectory['frequency']
        })

print(f"Corredores identificados: {len(corridors)}")
```

---

## 7. Relatórios Automáticos

### 📄 Geração de Relatórios

#### Relatório Personalizado
```python
# Gerar relatório customizado
response = requests.post('http://localhost:8000/qgis/reports/generate', json={
    "report_type": "biomass_assessment",
    "output_filename": "relatorio_biomassa_angola_2024.pdf",
    "custom_sections": [
        "executive_summary",
        "biomass_analysis",
        "temporal_trends",
        "recommendations"
    ],
    "include_maps": True,
    "include_charts": True
})

report_url = response.json()['report_url']
print(f"Relatório disponível em: {report_url}")
```

#### Relatório Mensal Automático
```python
# Gerar relatório mensal
response = requests.get('http://localhost:8000/qgis/reports/monthly/2024/6')

monthly_report = response.json()
print(f"Status: {monthly_report['status']}")
print(f"Arquivo: {monthly_report['filename']}")
```

### 📊 Conteúdo dos Relatórios

#### Seções Padrão
1. **Sumário Executivo**
   - Principais descobertas
   - Métricas chave
   - Recomendações

2. **Análise de Biomassa**
   - Distribuição espacial
   - Tendências temporais
   - Comparação com anos anteriores

3. **Análise de Migração**
   - Rotas principais
   - Sazonalidade
   - Impactos da pesca

4. **Recomendações de Gestão**
   - Áreas prioritárias
   - Medidas de conservação
   - Monitoramento contínuo

---

## 8. Análise Multicritério (MCDA)

### 🏛️ Áreas Marinhas Protegidas

#### Análise para AMPs
```python
# Análise MCDA para AMPs
response = requests.post('http://localhost:8000/qgis/mcda/marine-protected-areas', json={
    "criteria": {
        "biodiversity": 0.35,
        "vulnerability": 0.25,
        "connectivity": 0.20,
        "socioeconomic": 0.20
    },
    "constraints": {
        "min_area": 1000,  # km²
        "max_distance_to_coast": 50  # km
    }
})

amp_recommendations = response.json()
print(f"Áreas recomendadas: {len(amp_recommendations['priority_areas'])}")
```

### 🐟 Zonas de Pesca Sustentável

#### Identificação de Zonas Ótimas
```python
# Análise para zonas de pesca sustentável
response = requests.post('http://localhost:8000/qgis/mcda/sustainable-fishing-zones', json={
    "criteria_weights": {
        "fish_abundance": 0.40,
        "accessibility": 0.25,
        "environmental_impact": 0.20,
        "economic_viability": 0.15
    },
    "fishing_type": "artisanal",
    "target_species": ["tuna", "sardine", "mackerel"]
})

fishing_zones = response.json()
print(f"Zonas sustentáveis identificadas: {len(fishing_zones['zones'])}")
```

### 🎯 Análise Personalizada

#### Critérios Customizados
```python
# MCDA com critérios personalizados
response = requests.post('http://localhost:8000/qgis/mcda/custom-analysis', json={
    "zone_type": "aquaculture",
    "criteria_weights": {
        "water_quality": 0.30,
        "depth": 0.25,
        "wave_exposure": 0.20,
        "distance_to_port": 0.15,
        "environmental_sensitivity": 0.10
    },
    "method": "weighted_sum",
    "normalization": "min_max"
})

aquaculture_zones = response.json()
```

---

## 9. Exportação de Mapas

### 🗺️ Mapas Interativos

#### Exportação Básica
```python
# Exportar mapa interativo
response = requests.post('http://localhost:8000/qgis2web/export-map', json={
    "map_type": "comprehensive",
    "filename": "mapa_angola_completo.html",
    "include_fishing": True,
    "include_migration": True,
    "include_environmental": True,
    "include_temporal": True
})

map_url = response.json()['url']
print(f"Mapa disponível em: {map_url}")
```

#### Mapa Personalizado
```python
# Criar mapa personalizado
response = requests.post('http://localhost:8000/qgis2web/custom-map', json={
    "title": "Infraestruturas Pesqueiras de Angola",
    "center_lat": -11.5,
    "center_lon": 17.5,
    "zoom_level": 6,
    "layers": ["fishing_infrastructure", "marine_boundaries"],
    "filename": "mapa_pesca_angola.html"
})

custom_map = response.json()
```

### 📊 Formatos de Exportação

#### Disponíveis
- **HTML Interativo**: Mapas web com Leaflet
- **PNG/JPG**: Imagens estáticas
- **PDF**: Relatórios com mapas
- **GeoJSON**: Dados geoespaciais
- **CSV**: Dados tabulares

#### Exemplo Multi-formato
```python
# Exportar em múltiplos formatos
formats = ['interactive_map', 'static_image', 'geojson']

for format_type in formats:
    response = requests.post('http://localhost:8000/qgis/export', json={
        "format": format_type,
        "filename": f"angola_analysis_{format_type}",
        "layers": ["fishing", "zee", "migration"]
    })
    
    print(f"Exportado: {response.json()['filename']}")
```

---

## 10. Solução de Problemas

### 🚨 Problemas Comuns

#### 1. Mapa Não Carrega
```bash
# Verificar status dos serviços
curl http://localhost:8000/qgis/status

# Verificar logs
tail -f logs/scheduler.log
```

**Soluções:**
- Reiniciar serviços: `docker-compose restart`
- Verificar conexão com banco de dados
- Limpar cache do navegador

#### 2. Análises Lentas
```python
# Verificar performance
response = requests.get('http://localhost:8000/qgis/health/status')
performance = response.json()

if performance['memory_usage'] > 80:
    print("⚠️ Alto uso de memória detectado")
    # Implementar otimizações
```

**Otimizações:**
- Reduzir resolução temporal/espacial
- Usar cache quando disponível
- Processar dados em chunks

#### 3. Dados Não Aparecem
```python
# Verificar disponibilidade dos dados
response = requests.get('http://localhost:5080/collections')
collections = response.json()

for collection in collections['collections']:
    print(f"Coleção: {collection['id']} - Items: {collection.get('itemType', 'N/A')}")
```

**Verificações:**
- Dados foram ingeridos corretamente
- Serviços OGC estão funcionando
- Permissões de acesso

### 🔧 Comandos Úteis

#### Reinicialização Completa
```bash
# Parar todos os serviços
docker-compose down

# Limpar volumes (cuidado!)
docker-compose down -v

# Reiniciar
docker-compose up -d
```

#### Limpeza de Cache
```bash
# Limpar cache Redis
redis-cli FLUSHDB

# Limpar cache em disco
rm -rf data/cache/*
```

#### Monitoramento
```bash
# Verificar uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f admin-api
```

### 📞 Suporte

#### Canais de Ajuda
- **Logs do Sistema**: `logs/scheduler.log`
- **Status da API**: `http://localhost:8000/qgis/health/status`
- **Documentação**: `http://localhost:8085/docs/`

#### Informações para Suporte
Ao reportar problemas, inclua:
1. Versão do sistema
2. Logs relevantes
3. Passos para reproduzir
4. Configuração do ambiente

---

## 🎉 Conclusão

Este tutorial cobriu todas as funcionalidades principais do sistema QGIS integrado ao BGAPP. Com essas ferramentas, você pode:

- ✅ Realizar análises espaciais avançadas
- ✅ Visualizar dados temporais interativamente
- ✅ Calcular biomassa terrestre e marinha
- ✅ Analisar padrões de migração animal
- ✅ Gerar relatórios automáticos
- ✅ Exportar mapas interativos
- ✅ Aplicar análises multicritério

### 📚 Próximos Passos

1. **Explore os Exemplos**: Teste todos os códigos fornecidos
2. **Personalize Análises**: Adapte os parâmetros para seus dados
3. **Automatize Workflows**: Use a API para criar pipelines
4. **Monitore Performance**: Acompanhe métricas regularmente

### 🚀 Recursos Avançados

Para usuários avançados, explore:
- Integração com QGIS Desktop
- Desenvolvimento de plugins customizados
- APIs de terceiros (Copernicus, MODIS)
- Análises de machine learning

---

**📧 Feedback**: Seus comentários são importantes para melhorarmos este tutorial!

**🔄 Última Atualização**: Dezembro 2024
