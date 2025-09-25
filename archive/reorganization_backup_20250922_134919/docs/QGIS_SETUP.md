# QGIS Setup - BGAPP Angola

## URLs para QGIS

### OGC API Features (recomendado)
- **URL:** `http://localhost:5080`
- **Tipo:** OGC API - Features
- **Coleções:** `aoi`, `occurrences`, `mcda`

### Protegido (com autenticação)
- **URL:** `http://localhost:8086`
- **Nota:** Requer autenticação prévia no browser (demo/demo)

## Passos QGIS

1. **Data Source Manager** → **OGC API - Features**
2. **New Connection:**
   - Name: `BGAPP Angola`
   - URL: `http://localhost:5080`
3. **Connect** → Selecionar coleções:
   - `aoi` (Zona Econômica Especial Marítima de Angola)
   - `occurrences` (Fauna marinha angolana)
   - `mcda` (Mapas de adequação para conservação/pesca)
4. **Add** → **Close**

## Estilização Sugerida para Angola

### AOI (Zona Econômica Exclusiva)
- Estilo: Outline azul-marinho (#1e3c72), preenchimento transparente
- Largura: 3px
- Preenchimento: Azul claro com 10% transparência
- Etiquetas: Mostrar nome da zona

### Occurrences (Fauna Marinha)
- **Simbologia:** Categorizada por grupo taxonômico
- **Campo:** `group` ou `scientific_name`
- **Cores por grupo:**
  - Fauna Marinha: Azul (#3498db)
  - Aves Marinhas: Verde (#2ecc71)
  - Tartarugas: Roxo (#9b59b6)
  - Espécies Endémicas: Laranja (#f39c12)
  - Outras: Cinza (#95a5a6)
- **Tamanho:** 4-6px (variável por importância)

### MCDA (Adequação de Habitat)
- **Renderizador:** Categorizado ou Graduado
- **Campo:** `suitability_score` ou `class`
- **Cores:**
  - Muito Alta: Verde escuro (#27ae60)
  - Alta: Verde (#2ecc71)
  - Média: Amarelo (#f1c40f)
  - Baixa: Laranja (#e67e22)
  - Muito Baixa: Vermelho (#e74c3c)

## Sistema de Referência Espacial (CRS)

### CRS Recomendados para Angola:
- **Global:** EPSG:4326 (WGS84) - padrão do sistema
- **Nacional:** EPSG:22032 (Camacupa 1948 / UTM zone 32S) - Angola Sul
- **Nacional:** EPSG:22033 (Camacupa 1948 / UTM zone 33S) - Angola Norte
- **Marinho:** EPSG:4326 (WGS84) - recomendado para dados oceânicos

### Configuração no QGIS:
1. **Projeto → Propriedades → CRS**
2. Selecionar EPSG:4326 para compatibilidade
3. Para análises locais precisas, usar UTM apropriada

## Filtros Científicos Avançados

### Filtros Espaciais
- **Zona Norte:** Latitude > -8° (Cabinda a Luanda)
- **Zona Centro:** -8° > Latitude > -14° (Luanda a Lobito)
- **Zona Sul:** Latitude < -14° (Lobito a Cunene)
- **Águas Costeiras:** Distância < 50 km da costa
- **Águas Oceânicas:** Distância > 200 km da costa

### Filtros Temporais
- **Estação Seca:** Maio a Setembro
- **Estação Húmida:** Outubro a Abril
- **Período de Upwelling:** Junho a Setembro (costa sul)
- **Migração de Baleias:** Julho a Outubro

### Filtros Biológicos
```sql
-- Espécies comerciais importantes
"commercial_importance" IN ('high', 'very_high')

-- Espécies endémicas
"status" = 'endemic'

-- Fauna por profundidade
"depth" BETWEEN 0 AND 50  -- Zona costeira
"depth" BETWEEN 50 AND 200  -- Plataforma continental
"depth" > 200  -- Águas profundas
```

### Filtros de Qualidade
```sql
-- Dados de alta qualidade
"data_quality" = 'high' AND "coordinate_precision" < 1000

-- Registos recentes
"date" >= '2020-01-01'

-- Identificação taxonômica confirmada
"identification_status" = 'confirmed'
```

## Análises Espaciais Recomendadas

### 1. Densidade de Espécies
- **Ferramenta:** Heatmap ou Kernel Density
- **Parâmetros:** Raio 10-20 km para análise costeira
- **Aplicação:** Identificar hotspots de biodiversidade

### 2. Análise de Clusters
- **Ferramenta:** DBSCAN Clustering
- **Aplicação:** Identificar agrupamentos de espécies
- **Interpretação:** Áreas de importância ecológica

### 3. Análise de Conectividade
- **Ferramenta:** Network Analyst
- **Aplicação:** Corredores migratórios
- **Dados:** Trajetórias de telemetria

### 4. Modelação de Habitat
- **Ferramenta:** MaxEnt ou BIOCLIM
- **Variáveis:** Temperatura, profundidade, produtividade
- **Resultado:** Mapas de adequação de habitat

## Estilos Pré-configurados

### Carregar Estilos Automáticos
1. Baixar estilos: `styles/angola_marine_styles.xml`
2. **Layer → Properties → Symbology → Style → Load Style**
3. Aplicar estilo apropriado por tipo de dado

### Paletas de Cores Científicas
- **Biodiversidade:** Viridis, Plasma
- **Temperatura:** RdYlBu (invertida)
- **Profundidade:** Blues
- **Adequação:** RdYlGn

## Integração com Dados Nacionais

### Camadas Base Recomendadas
- Batimetria: GEBCO ou EMODnet
- Limites administrativos: OpenStreetMap Angola
- Portos e cidades: Natural Earth
- Áreas protegidas: WDPA (World Database on Protected Areas)

### Dados Complementares
- Correntes oceânicas: Copernicus Marine
- Temperatura superficial: MODIS/VIIRS
- Clorofila-a: CMEMS
- Ventos: ERA5

## Troubleshooting

### Problemas Comuns
1. **Conexão lenta:** Reduzir limite de features para 1000-5000
2. **Erro de CRS:** Verificar se todas as camadas estão em EPSG:4326
3. **Dados não aparecem:** Verificar bbox da consulta
4. **Símbolos não carregam:** Instalar plugin "Resource Sharing"

### Otimização de Performance
- Usar índices espaciais
- Filtrar dados antes de carregar
- Usar tiles vetoriais para grandes datasets
- Cache local para dados frequentes

---

*Guia atualizado para investigação marinha em Angola*  
*Versão 2.0 - Adaptado para ZEE angolana*
