# Integração QGIS - Linha de Costa Precisa de Angola

## 🎯 Objetivo
Obter dados precisos da linha de costa de Angola usando OSM Coastlines e Digital Earth Africa para melhorar a representação da ZEE marítima.

## 📊 Fontes de Dados Recomendadas

### 1. Digital Earth Africa Coastlines ⭐ (Recomendado)
- **Precisão**: Dados de satélite de alta resolução
- **Cobertura**: 20+ anos de monitorização costeira
- **Atualização**: Regular
- **Formato**: WFS/WMS

#### Como adicionar no QGIS:
```
1. Camada → Adicionar Camada → Adicionar Camada WFS
2. Criar nova conexão:
   - Nome: Digital Earth Africa
   - URL: https://geoserver.digitalearth.africa/geoserver/wfs
3. Conectar e selecionar: coastlines:coastlines_v2_0_0
4. Filtrar por BBOX: 8.0,-19.0,13.5,-4.0 (Angola)
```

### 2. OpenStreetMap Coastlines
- **Precisão**: Dados colaborativos natural=coastline
- **Atualização**: Contínua pela comunidade
- **Formato**: OSM PBF, Shapefile

#### Obter dados OSM:
```
1. Baixar de: https://download.geofabrik.de/africa/angola-latest.osm.pbf
2. No QGIS: Vetor → OpenStreetMap → Carregar dados
3. Filtrar por: natural=coastline
4. Exportar como GeoJSON/Shapefile
```

### 3. Natural Earth (Backup)
- **URL**: https://www.naturalearthdata.com/
- **Precisão**: Média, dados generalizados
- **Uso**: Referência e comparação

## 🛠️ Processamento Automático

### Script Python Incluído
```bash
# Executar o processador automático
cd scripts/
python coastline_processor.py
```

**O script irá:**
1. ✅ Obter dados do Digital Earth Africa via WFS
2. ✅ Processar dados OSM coastline
3. ✅ Calcular ZEE baseada na linha de costa real
4. ✅ Exportar Shapefiles, GeoJSON e estilos QML
5. ✅ Criar instruções detalhadas

### Arquivos Gerados:
```
qgis_data/
├── digital_earth_coastline.shp    # Linha de costa satélite
├── digital_earth_coastline.qml    # Estilo QGIS
├── osm_coastline.shp              # Linha de costa OSM
├── osm_coastline.qml              # Estilo QGIS
├── angola_zee.shp                 # ZEE calculada
├── angola_zee.qml                 # Estilo QGIS
└── QGIS_Instructions.md           # Instruções detalhadas
```

## 📋 Workflow Recomendado

### 1. Preparação no QGIS
```
1. Criar novo projeto QGIS
2. Definir SRC: WGS84 (EPSG:4326)
3. Adicionar base map (OpenStreetMap)
```

### 2. Adicionar Dados de Linha de Costa
```
1. Digital Earth Africa (WFS - mais preciso)
2. OSM Coastline (dados colaborativos)
3. Dados oficiais angolanos (se disponíveis)
```

### 3. Validação e Comparação
```
1. Sobrepor diferentes fontes
2. Comparar com imagens de satélite
3. Identificar discrepâncias
4. Escolher fonte mais precisa por região
```

### 4. Processamento da ZEE
```
1. Usar linha de costa validada
2. Criar buffer de 200 milhas náuticas (~370km)
3. Ajustar para seguir contorno da costa
4. Separar Cabinda do continente
```

### 5. Exportação Final
```
1. Exportar como GeoJSON para aplicação web
2. Criar arquivo de metadados
3. Documentar fonte e precisão
4. Atualizar configurações da aplicação
```

## 🔧 Comandos QGIS Úteis

### Reprojetar Camada
```
Vetor → Ferramentas de Geoprocessamento → Reprojetar camada
SRC de saída: EPSG:4326 (WGS84)
```

### Criar Buffer (ZEE)
```
Vetor → Ferramentas de Geoprocessamento → Buffer
Distância: 3.33 (graus decimais ≈ 370km)
Lados: Apenas um lado (oceânico)
```

### Filtrar por Área
```
Camada → Filtrar → Expressão:
$area > 1000  (para remover ilhas pequenas)
```

### Exportar GeoJSON
```
Clicar direito na camada → Exportar → Salvar features como...
Formato: GeoJSON
SRC: EPSG:4326
```

## 📊 Validação de Qualidade

### Verificações Essenciais:
- ✅ Linha de costa fecha corretamente (sem gaps)
- ✅ Não há auto-intersecções
- ✅ Coordenadas estão em WGS84
- ✅ Precisão compatível com escala de uso
- ✅ Metadados completos (fonte, data, precisão)

### Ferramentas de Validação QGIS:
```
Vetor → Ferramentas de Geometria → Verificar geometrias válidas
Vetor → Análise → Estatísticas básicas
```

## 🌐 Integração com Aplicação Web

### Atualizar Ficheiros:
1. **configs/aoi.geojson** - ZEE oficial
2. **infra/pygeoapi/localdata/aoi.geojson** - Dados para API
3. **realtime_angola.html** - Coordenadas do mapa

### Formato Esperado:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "ZEE Angola",
        "source": "Digital Earth Africa + OSM",
        "precision": "satellite",
        "area_km2": 518433
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

## 📈 Monitorização e Atualizações

### Frequência Recomendada:
- **Digital Earth Africa**: Mensal
- **OSM**: Semanal (se há contribuições)
- **Dados oficiais**: Quando disponíveis

### Automatização:
```bash
# Criar cron job para atualização automática
0 2 1 * * /path/to/coastline_processor.py
```

## 🆘 Resolução de Problemas

### Erro: "WFS não conecta"
```
- Verificar conectividade internet
- Tentar URL alternativo
- Usar dados OSM como fallback
```

### Erro: "Geometrias inválidas"
```
Vetor → Ferramentas de Geometria → Corrigir geometrias
```

### Erro: "ZEE muito grande/pequena"
```
- Verificar unidades do buffer
- Ajustar distância (200 NM = 370.4 km)
- Considerar projeção adequada
```

## 📚 Recursos Adicionais

- [Digital Earth Africa Docs](https://docs.digitalearthafrica.org/)
- [OSM Coastline Wiki](https://wiki.openstreetmap.org/wiki/Coastline)
- [QGIS Documentation](https://docs.qgis.org/)
- [Angola Maritime Laws](https://angolex.com/) (coordenadas oficiais)

---

**Resultado Esperado**: Linha de costa precisa e ZEE realista baseada em dados científicos atualizados! 🌊🇦🇴
