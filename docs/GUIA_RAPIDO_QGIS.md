# ⚡ Guia Rápido - QGIS BGAPP

## 🚀 Início Rápido (5 minutos)

### 1. Acesso ao Sistema
```
URL: http://localhost:8085/admin.html
Sidebar → Interfaces BGAPP → Dashboard QGIS Interativo
```

### 2. Verificação de Status
```bash
curl http://localhost:8000/qgis/status
```

### 3. Primeira Análise
```python
import requests

# Análise de hotspots básica
response = requests.post('http://localhost:8000/qgis/spatial/hotspots', json={
    "point_data": [
        {"coordinates": [13.2317, -8.8383], "biomass": 150.5},
        {"coordinates": [13.4049, -12.5756], "biomass": 200.3}
    ],
    "analysis_field": "biomass"
})

print(f"Hotspots: {len(response.json()['hotspots'])}")
```

## 🎯 Casos de Uso Principais

### 📊 Análise de Biomassa
```python
# Biomassa terrestre Angola
requests.post('http://localhost:8000/qgis/biomass/terrestrial', json={
    "region_bounds": {"north": -5.0, "south": -18.0, "east": 24.0, "west": 11.0},
    "vegetation_type": "mixed"
})
```

### 🐟 Análise de Pesca
```python
# Infraestruturas pesqueiras
requests.get('http://localhost:8000/fisheries/statistics')
```

### 🗺️ Exportar Mapa
```python
# Mapa interativo
requests.post('http://localhost:8000/qgis2web/export-map', json={
    "map_type": "fishing",
    "filename": "mapa_pesca.html"
})
```

## 🔧 Comandos Úteis

### Reiniciar Serviços
```bash
docker-compose restart admin-api
```

### Verificar Logs
```bash
tail -f logs/scheduler.log
```

### Limpar Cache
```bash
redis-cli FLUSHDB
```

## 📱 Interface Web

### Controles Principais
- **Slider Temporal**: Animações temporais
- **Camadas**: Toggle de visibilidade
- **Análises**: Ferramentas espaciais
- **Exportação**: Mapas e relatórios

### Atalhos de Teclado
- `Ctrl + +`: Zoom in
- `Ctrl + -`: Zoom out
- `Espaço`: Play/pause animação
- `R`: Reset vista

## 🚨 Solução Rápida de Problemas

### Mapa não carrega
```bash
# Verificar serviços
docker ps
curl http://localhost:8000/health
```

### Dados ausentes
```bash
# Verificar coleções OGC
curl http://localhost:5080/collections
```

### Performance lenta
```python
# Verificar métricas
requests.get('http://localhost:8000/qgis/health/metrics/all')
```

## 📚 Links Úteis

- **Tutorial Completo**: [TUTORIAL_QGIS_COMPLETO.md](TUTORIAL_QGIS_COMPLETO.md)
- **API Docs**: http://localhost:8000/docs
- **Status Dashboard**: http://localhost:8000/qgis/health/status
- **Mapas Exportados**: http://localhost:8085/static/interactive_maps/

## 💡 Dicas Rápidas

1. **Cache**: Use cache para análises repetitivas
2. **Chunks**: Processe dados grandes em pedaços
3. **Paralelo**: Aproveite processamento paralelo
4. **Monitoramento**: Acompanhe métricas regularmente
5. **Backup**: Exporte dados importantes

---

⏱️ **Tempo de leitura**: 2 minutos  
🎯 **Nível**: Iniciante  
🔄 **Atualizado**: Dezembro 2024
