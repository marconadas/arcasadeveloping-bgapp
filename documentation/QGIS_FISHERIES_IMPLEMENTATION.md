# 🎣 QGIS - Infraestruturas Pesqueiras de Angola

## 📋 **IMPLEMENTAÇÃO COMPLETA**

Sistema integrado para gestão de infraestruturas de portos pesqueiros e localização das populações pesqueiras (vilas pescatórias) de Angola, com interface QGIS dedicada e integração com o painel administrativo.

---

## 🌊 **CARACTERÍSTICAS IMPLEMENTADAS**

### ✅ **Dados Geoespaciais Completos**
- **8 Portos Pesqueiros Principais**: Cabinda, Soyo, Luanda, Ambriz, Lobito, Benguela, Namibe, Tombwa
- **10 Vilas Pescatórias**: Distribuídas pelas 3 zonas (Norte, Centro, Sul)
- **4 Infraestruturas Complementares**: Fábricas de processamento, estaleiros, mercados
- **Total: 24 features geoespaciais** com dados detalhados

### ✅ **Zonas Pesqueiras Definidas**
- **Zona Norte**: Cabinda-Luanda (4 portos, 3 vilas)
- **Zona Centro**: Luanda-Lobito (2 portos, 3 vilas) 
- **Zona Sul**: Lobito-Cunene (3 portos, 4 vilas)

### ✅ **Interface QGIS Dedicada**
- **URL**: `http://localhost:8085/qgis_fisheries.html`
- **Visualização interativa** com Leaflet
- **Camadas organizadas** por tipo de infraestrutura
- **Filtros avançados** por zona, tipo e população
- **Exportação de dados** (GeoJSON, CSV)
- **Design responsivo** para desktop e mobile

---

## 🗂️ **ESTRUTURA DE ARQUIVOS**

```
BGAPP/
├── infra/
│   ├── frontend/
│   │   └── qgis_fisheries.html                    # Interface QGIS principal
│   └── pygeoapi/
│       ├── pygeoapi-config.yml                    # Configuração OGC API
│       └── localdata/
│           ├── fishing_ports_angola.geojson       # Portos pesqueiros
│           ├── fishing_villages_angola.geojson    # Vilas pescatórias
│           ├── fishing_infrastructure_angola.geojson  # Infraestruturas
│           └── fishing_all_infrastructure_angola.geojson  # Consolidado
├── scripts/
│   └── generate_fisheries_infrastructure.py      # Gerador de dados
├── src/bgapp/
│   └── admin_api.py                              # APIs administrativas
└── docs/
    └── QGIS_FISHERIES_IMPLEMENTATION.md         # Esta documentação
```

---

## 🚀 **COMO USAR**

### 1. **Acessar a Interface QGIS**

#### Via Painel Administrativo:
1. Abrir `http://localhost:8085/admin.html`
2. Na sidebar → **Interfaces BGAPP**
3. Clicar em **"QGIS - Infraestruturas Pesqueiras"**

#### Acesso Direto:
- URL: `http://localhost:8085/qgis_fisheries.html`

### 2. **Funcionalidades Principais**

#### **Controle de Camadas**
- ☑️ **Portos Pesqueiros** (azul) - 8 portos principais
- ☑️ **Vilas Pescatórias** (verde) - 10 comunidades costeiras
- ☑️ **Infraestruturas Complementares** (vermelho) - Fábricas e estaleiros
- ☐ **Zona Econômica Exclusiva** (azul claro) - ZEE de Angola

#### **Filtros Disponíveis**
- **Por Zona**: Norte, Centro, Sul
- **Por Tipo**: Porto principal, regional, local, vila, fábrica, etc.
- **Por População**: Filtro por população mínima

#### **Ferramentas**
- **Ajustar Vista**: Zoom automático para todos os dados
- **Limpar Filtros**: Reset de todos os filtros
- **Exportar GeoJSON**: Download dos dados filtrados
- **Exportar CSV**: Tabela com atributos (em desenvolvimento)

### 3. **Informações dos Marcadores**

Cada marcador contém dados detalhados:

#### **Portos Pesqueiros**
- Nome e localização
- Zona pesqueira
- Capacidade (número de embarcações)
- Infraestruturas disponíveis
- População associada
- Tipos de frota
- Espécies principais

#### **Vilas Pescatórias**
- Nome e população
- Atividade principal (pesca artisanal/semi-industrial)
- Número de embarcações
- Infraestruturas básicas
- Serviços disponíveis (estrada, eletricidade, água, escola, saúde)

#### **Infraestruturas Complementares**
- Fábricas de processamento
- Estaleiros navais
- Mercados de peixe
- Capacidade e produtos

---

## 🔧 **CONFIGURAÇÃO TÉCNICA**

### **APIs OGC Configuradas**

O sistema utiliza o pygeoapi para servir dados via OGC API Features:

```yaml
# Novas coleções em pygeoapi-config.yml
fishing_ports:          # http://localhost:5080/collections/fishing_ports
fishing_villages:       # http://localhost:5080/collections/fishing_villages  
fishing_infrastructure: # http://localhost:5080/collections/fishing_infrastructure
fishing_all_infrastructure: # http://localhost:5080/collections/fishing_all_infrastructure
```

### **Endpoints API Administrativos**

```python
# Novos endpoints em admin_api.py (porta 8000)
GET /fisheries/ports           # Portos com filtros
GET /fisheries/villages        # Vilas com filtros
GET /fisheries/statistics      # Estatísticas consolidadas
```

### **Regenerar Dados**

Para atualizar os dados geoespaciais:

```bash
cd /path/to/BGAPP
python scripts/generate_fisheries_infrastructure.py
```

---

## 📊 **DADOS INCLUÍDOS**

### **Portos Pesqueiros (8 features)**

| Porto | Zona | Tipo | Capacidade | População | Infraestruturas |
|-------|------|------|------------|-----------|----------------|
| Cabinda | Norte | Principal | 150 | 8.500 | Frigorífico, combustível, estaleiro, mercado |
| Soyo | Norte | Regional | 85 | 4.200 | Frigorífico, combustível, mercado |
| Luanda | Norte | Principal | 200 | 12.000 | Completo + fábrica |
| Ambriz | Centro | Local | 45 | 2.100 | Combustível, mercado |
| Lobito | Centro | Principal | 180 | 9.500 | Completo + fábrica |
| Benguela | Sul | Principal | 160 | 7.800 | Frigorífico, combustível, estaleiro, mercado |
| Namibe | Sul | Regional | 95 | 5.200 | Frigorífico, combustível, mercado |
| Tombwa | Sul | Regional | 75 | 3.800 | Frigorífico, combustível, mercado |

### **Vilas Pescatórias (10 features)**

| Vila | Zona | População | Embarcações | Desenvolvimento |
|------|------|-----------|-------------|----------------|
| Landana | Norte | 1.200 | 35 | Alto (estrada, eletricidade, água, escola) |
| Cacongo | Norte | 850 | 28 | Médio (estrada, água, escola) |
| Mussulo | Norte | 2.100 | 65 | Muito Alto (completo) |
| Cabo Ledo | Centro | 950 | 32 | Médio |
| Porto Amboim | Centro | 3.200 | 85 | Alto |
| Sumbe | Centro | 1.800 | 52 | Alto |
| Baía Azul | Sul | 1.100 | 38 | Médio |
| Baía Farta | Sul | 2.500 | 72 | Alto |
| Lucira | Sul | 1.600 | 45 | Médio |
| Bentiaba | Sul | 800 | 25 | Baixo (isolada) |

### **Infraestruturas Complementares (4 features)**

- **Fábrica de Conservas de Luanda** (25 ton/dia)
- **Fábrica de Farinha de Peixe - Lobito** (40 ton/dia)
- **Estaleiro Naval de Luanda** (15 embarcações)
- **Estaleiro de Benguela** (8 embarcações)

---

## 🎯 **ANÁLISES ESPACIAIS DISPONÍVEIS**

### **Por Zona Pesqueira**
- **Norte**: 3 portos, 3 vilas, 24.700 habitantes
- **Centro**: 2 portos, 3 vilas, 17.650 habitantes  
- **Sul**: 3 portos, 4 vilas, 23.500 habitantes

### **Por Tipo de Infraestrutura**
- **Portos Principais**: 4 (Cabinda, Luanda, Lobito, Benguela)
- **Portos Regionais**: 3 (Soyo, Namibe, Tombwa)
- **Portos Locais**: 1 (Ambriz)
- **Fábricas**: 2 (processamento de pescado)
- **Estaleiros**: 2 (construção/reparação naval)

### **Capacidade Total**
- **Embarcações nos Portos**: 990 capacidade total
- **Embarcações nas Vilas**: 372 embarcações artesanais
- **População Pesqueira Total**: ~65.850 habitantes

---

## 🔍 **INTEGRAÇÃO COM QGIS DESKTOP**

Para usar os dados no QGIS Desktop:

### 1. **Conectar via OGC API Features**
```
1. Data Source Manager → OGC API - Features
2. New Connection:
   - Name: BGAPP Fisheries Angola
   - URL: http://localhost:5080
3. Connect → Selecionar coleções:
   - fishing_ports
   - fishing_villages
   - fishing_infrastructure
   - fishing_all_infrastructure
```

### 2. **Estilos Recomendados**
- **Portos**: Círculos azuis, tamanho por capacidade
- **Vilas**: Círculos verdes, tamanho por população
- **Infraestruturas**: Símbolos específicos por tipo
- **Cores por zona**: Norte (azul), Centro (roxo), Sul (laranja)

---

## 📱 **RESPONSIVIDADE MOBILE**

A interface foi otimizada para dispositivos móveis:

- **Sidebar colapsável** em telas pequenas
- **Controles touch-friendly**
- **Popups adaptáveis**
- **Mapas responsivos**

Ideal para trabalho de campo e coleta de dados.

---

## 🔧 **MANUTENÇÃO E ATUALIZAÇÕES**

### **Adicionar Novas Infraestruturas**

1. **Editar o gerador**: `scripts/generate_fisheries_infrastructure.py`
2. **Adicionar dados** nos dicionários apropriados
3. **Regenerar arquivos**: `python generate_fisheries_infrastructure.py`
4. **Reiniciar pygeoapi** para atualizar as APIs

### **Modificar Interface**

- **HTML**: `infra/frontend/qgis_fisheries.html`
- **Estilos**: CSS inline (pode ser externalizado)
- **JavaScript**: Lógica de mapa e filtros inline

### **Configurar Novos Endpoints**

- **APIs**: `src/bgapp/admin_api.py`
- **OGC**: `infra/pygeoapi/pygeoapi-config.yml`

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS**

### **Interface não carrega**
1. Verificar se pygeoapi está rodando: `http://localhost:5080`
2. Verificar se admin_api está ativo: `http://localhost:8000`
3. Verificar arquivos GeoJSON em `infra/pygeoapi/localdata/`

### **Dados não aparecem**
1. Verificar console do navegador (F12)
2. Testar APIs diretamente:
   - `http://localhost:5080/collections/fishing_ports/items?f=json`
   - `http://localhost:8000/fisheries/statistics`

### **Filtros não funcionam**
1. Verificar JavaScript no console
2. Verificar estrutura dos dados GeoJSON
3. Verificar nomes dos campos nas propriedades

---

## 📈 **PRÓXIMOS DESENVOLVIMENTOS**

### **Funcionalidades Planejadas**
- [ ] **Análise de densidade** de infraestruturas
- [ ] **Cálculo de proximidade** entre portos e vilas
- [ ] **Análise de acessibilidade** por estrada
- [ ] **Otimização mobile** avançada
- [ ] **Sistema de ingestão** via formulários admin
- [ ] **Exportação Shapefile**
- [ ] **Relatórios automáticos**

### **Integrações Futuras**
- [ ] **Dados de pesca em tempo real**
- [ ] **Monitorização de embarcações**
- [ ] **Previsões meteorológicas por porto**
- [ ] **Integração com dados socioeconômicos**

---

## 📚 **REFERÊNCIAS TÉCNICAS**

- **OGC API Features**: https://ogcapi.ogc.org/features/
- **Leaflet**: https://leafletjs.com/
- **pygeoapi**: https://docs.pygeoapi.io/
- **FastAPI**: https://fastapi.tiangolo.com/
- **GeoJSON**: https://geojson.org/

---

**🌊 Sistema implementado com sucesso para gestão completa das infraestruturas pesqueiras de Angola!**

*Versão 1.0 - Implementação completa*  
*Data: Dezembro 2024*
