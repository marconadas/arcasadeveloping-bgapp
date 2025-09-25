# 🌊 BGAPP - Animações Meteorológicas e Oceanográficas

Sistema de visualização de dados meteorológicos e oceanográficos em tempo real para a Zona Econômica Exclusiva de Angola.

## 🚀 Funcionalidades Implementadas

### ✅ Concluído - Fase 1
- **Interface de usuário moderna** com controles para animações
- **Endpoint backend** `/metocean/velocity` para dados de correntes e vento
- **Endpoint backend** `/metocean/scalar` para SST, salinidade e clorofila
- **Simulador de dados** baseado na Corrente de Benguela e padrões regionais
- **Integração com Leaflet** usando TimeDimension e Velocity plugins

### 🔄 Em Desenvolvimento
- Animações de correntes marinhas com streamlines
- Animações de vento com vetores
- Camadas WMS-T para temperatura superficial
- Sistema de cache para dados meteorológicos

## 📋 Como Usar

### 1. Iniciar os Serviços

```bash
# Iniciar API backend (porta 5080)
cd /path/to/BGAPP
python -m src.bgapp.admin_api

# Iniciar frontend (porta 8085)
cd infra/frontend
python -m http.server 8085
```

### 2. Acessar o Mapa Interativo

Abra o navegador e acesse: `http://localhost:8085/index.html`

### 3. Usar os Controles

#### Variáveis Oceanográficas
- **SST** - Temperatura superficial do mar
- **Salinidade** - Salinidade oceânica 
- **Clorofila** - Concentração de clorofila-a

#### Campos Vetoriais
- **Correntes** - Correntes marinhas (streamlines animadas)
- **Vento** - Campos de vento (vetores animados)

#### Controles de Animação
- **▶️ Animar** - Iniciar/parar animação temporal
- **Limpar Tudo** - Remover todas as camadas

### 4. Testar a API

```bash
# Executar testes automatizados
python scripts/test_metocean_api.py
```

## 🔧 API Endpoints

### `/metocean/velocity`
Dados de velocidade para correntes e vento.

**Parâmetros:**
- `var`: `"currents"` ou `"wind"`
- `time`: Timestamp ISO 8601 (opcional)
- `resolution`: Resolução em graus (padrão: 0.5)

**Exemplo:**
```bash
curl "http://localhost:5080/metocean/velocity?var=currents&resolution=1.0"
```

**Resposta:**
```json
{
  "data": [
    {"lat": -12.5, "lon": 13.5, "u": 0.15, "v": 0.82},
    ...
  ],
  "uMin": -0.5, "uMax": 0.5,
  "vMin": -0.2, "vMax": 1.2,
  "metadata": {
    "variable": "currents",
    "time": "2024-01-15T10:30:00Z",
    "units": "m/s",
    "points": 156
  }
}
```

### `/metocean/scalar`
Dados escalares para SST, salinidade e clorofila.

**Parâmetros:**
- `var`: `"sst"`, `"salinity"` ou `"chlorophyll"`
- `time`: Timestamp ISO 8601 (opcional)

**Exemplo:**
```bash
curl "http://localhost:5080/metocean/scalar?var=sst"
```

### `/metocean/status`
Status dos serviços meteorológicos.

## 🌊 Dados Simulados

### Corrente de Benguela
- **Direção**: Sul-Norte ao longo da costa
- **Intensidade**: Maior ao sul (Namibe/Tombwa)
- **Sazonalidade**: Intensificação durante upwelling (Jun-Set)

### Ventos Alísios
- **Direção**: Predominantemente Leste-Oeste
- **Variação sazonal**: Mais fortes no inverno (Jun-Ago)
- **Efeito costeiro**: Intensificação próximo à costa

### Temperatura Superficial (SST)
- **Gradiente latitudinal**: Mais frio ao sul
- **Variação sazonal**: 3°C de amplitude
- **Upwelling**: Temperaturas mais baixas na costa sul

### Salinidade
- **Base**: ~35.0 PSU
- **Upwelling**: Aumento na região sul
- **Variação**: ±0.3 PSU

### Clorofila-a
- **Upwelling**: Concentrações altas ao sul (5-15 mg/m³)
- **Norte**: Águas oligotróficas (1-2 mg/m³)
- **Sazonalidade**: Pico durante upwelling

## 🎯 Bibliotecas Utilizadas

### Frontend
- **Leaflet 1.9.4** - Mapa base
- **Leaflet TimeDimension 1.1.1** - Controle temporal
- **Leaflet Velocity 0.4.0** - Animações de campos vetoriais

### Backend
- **FastAPI** - API REST
- **NumPy** - Cálculos numéricos
- **Requests** - Cliente HTTP

## 🔍 Estrutura de Arquivos

```
BGAPP/
├── infra/frontend/
│   ├── index.html              # Mapa principal (atualizado)
│   └── assets/js/
│       └── metocean.js         # Funções meteorológicas
├── src/bgapp/
│   ├── admin_api.py            # API principal (endpoints adicionados)
│   └── realtime/
│       └── copernicus_simulator.py  # Simulador de dados
├── scripts/
│   └── test_metocean_api.py    # Testes automatizados
└── docs/
    └── ANIMACOES_METEOROLOGICAS.md  # Este documento
```

## 🚀 Roadmap

### Fase 2 - Camadas WMS-T (Próxima)
- [ ] Integração com serviços CMEMS reais
- [ ] Camadas WMS com dimensão temporal
- [ ] Autenticação Copernicus Marine

### Fase 3 - Cache e Performance
- [ ] Sistema de cache local (NetCDF)
- [ ] Jobs de ingestão automatizados
- [ ] Otimização de performance

### Fase 4 - Produção
- [ ] Monitorização e alertas
- [ ] Fallbacks robustos
- [ ] Documentação de operações

## 🐛 Resolução de Problemas

### Erro "Failed to load metocean.js"
```bash
# Verificar se o arquivo existe
ls -la infra/frontend/assets/js/metocean.js

# Reiniciar servidor frontend
cd infra/frontend && python -m http.server 8085
```

### Erro "CORS policy"
Certifique-se de que a API está configurada com CORS habilitado (já configurado no `admin_api.py`).

### Erro "leaflet-velocity not found"
Verifique se as dependências estão carregando:
```html
<script src="https://unpkg.com/leaflet-velocity@0.4.0/dist/leaflet-velocity.min.js"></script>
```

### Dados não aparecem
1. Verificar se a API está rodando: `http://localhost:5080/metocean/status`
2. Abrir DevTools do navegador e verificar erros no console
3. Executar teste: `python scripts/test_metocean_api.py`

## 📞 Suporte

Para questões técnicas ou melhorias, consulte:
- Código fonte: `/src/bgapp/admin_api.py` (endpoints)
- Frontend: `/infra/frontend/assets/js/metocean.js`
- Testes: `/scripts/test_metocean_api.py`
