# 🧠 Data Science & Machine Learning - BGAPP Marine Angola

**Branch**: `feature/data-science-ml`  
**Responsável**: Data Scientist (part-time)  
**Supervisor**: Marcos Santos (Tech Lead)

## 🎯 Responsabilidades

### 🤖 **Machine Learning**
- **Modelos preditivos** para biodiversidade marinha (>95% precisão)
- **Algoritmos de classificação** de espécies
- **Forecasting oceanográfico** (temperatura, correntes)
- **Análise de adequação** de habitat
- **Pipeline ML** automatizado

### 🔬 **Validação Científica**
- **Peer review** de modelos e resultados
- **Metodologia científica** rigorosa
- **Validação estatística** de predições
- **Publicações científicas** em revistas indexadas
- **Colaboração** com investigadores marinhos

---

## 🛠️ **Arquivos Principais**

### 🧠 **Modelos de ML**
```
src/bgapp/ml/models.py              ← Modelos principais
src/bgapp/ml/retention_*.py         ← Sistema de retenção ML
src/bgapp/api/ml_endpoints.py       ← APIs ML
src/bgapp/ml/biodiversity_predictor.py ← Preditor biodiversidade
```

### 📊 **Notebooks & Análises**
```
notebooks/                          ← Jupyter notebooks
notebooks/biodiversity_analysis.ipynb ← Análise biodiversidade
notebooks/species_classification.ipynb ← Classificação espécies
notebooks/oceanographic_modeling.ipynb ← Modelação oceanográfica
```

### 📈 **Dados & Datasets**
```
data/species/                       ← Dados espécies marinhas
data/oceanographic/                 ← Dados oceanográficos
data/processed/                     ← Dados processados
data/models/                        ← Modelos treinados
```

---

## 🚀 **Setup de Desenvolvimento**

### 1️⃣ **Configuração Inicial**
```bash
git checkout feature/data-science-ml
git pull origin develop

# Instalar dependências Python
pip install -r requirements.txt
pip install -r requirements-ml.txt

# Configurar Jupyter
pip install jupyterlab
jupyter lab
```

### 2️⃣ **Ambiente ML**
```bash
# Configurar variáveis de ambiente
cp env.example .env
# [configurar credenciais APIs científicas]

# Instalar bibliotecas específicas
pip install scikit-learn==1.3.0
pip install tensorflow==2.13.0
pip install xgboost==1.7.0
pip install pandas geopandas numpy
```

### 3️⃣ **Dados de Treino**
```bash
# Download de dados oceanográficos
python src/bgapp/integrations/copernicus_downloader.py

# Preparar datasets
python src/bgapp/ml/data_preparation.py

# Validar qualidade dos dados
python src/bgapp/ml/data_quality_check.py
```

---

## 📋 **Tarefas Prioritárias**

### 🔥 **Sprint Atual**
- [ ] **Melhorar precisão** modelos (target: >96%)
- [ ] **Validação científica** dos algoritmos
- [ ] **Novos datasets** espécies angolanas
- [ ] **Cross-validation** rigorosa
- [ ] **Documentação científica** completa

### 🎯 **Próximas Sprints**
- [ ] **Novos modelos** (deep learning)
- [ ] **Ensemble methods** avançados
- [ ] **AutoML** para otimização
- [ ] **Feature engineering** avançado
- [ ] **Publicação científica** em revista

---

## 🧠 **Modelos em Produção**

### 📊 **Performance Atual**
| **Modelo** | **Algoritmo** | **Precisão** | **Status** |
|------------|---------------|--------------|------------|
| Biodiversity Predictor | Random Forest + XGBoost | 95.2% | ✅ Ativo |
| Species Classifier | Optimized Random Forest | 97.1% | ✅ Ativo |
| Temperature Forecaster | LSTM Neural Network | 94.8% | ✅ Ativo |
| Habitat Suitability | MaxEnt + Ensemble | 96.3% | ✅ Ativo |
| Abundance Estimator | Gradient Boosting | 93.7% | ✅ Ativo |

### 🎯 **Targets de Melhoria**
- **Biodiversity Predictor**: 95.2% → 96.5%
- **Species Classifier**: 97.1% → 98.0%
- **Temperature Forecaster**: 94.8% → 96.0%
- **Habitat Suitability**: 96.3% → 97.5%
- **Abundance Estimator**: 93.7% → 95.0%

---

## 🔬 **Metodologia Científica**

### 📊 **Validação de Modelos**
```python
# Cross-validation rigorosa
from sklearn.model_selection import StratifiedKFold, cross_val_score

# Métricas científicas
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.metrics import confusion_matrix, classification_report

# Validação temporal
from sklearn.model_selection import TimeSeriesSplit
```

### 📈 **Análise Estatística**
```python
# Testes de significância
from scipy.stats import ttest_ind, chi2_contingency
from scipy.stats import pearsonr, spearmanr

# Análise de biodiversidade
from skbio.diversity import alpha_diversity, beta_diversity
from skbio.stats.distance import permanova
```

---

## 🧪 **Como Testar Modelos**

### 🔬 **Testes de Validação**
```bash
# Testar todos os modelos
python src/bgapp/ml/test_all_models.py

# Validação cruzada
python src/bgapp/ml/cross_validation.py

# Testes de performance
python test_ml_retention_performance.py

# Análise de drift
python src/bgapp/ml/model_drift_detection.py
```

### 📊 **Métricas Científicas**
```bash
# Gerar relatório de performance
python src/bgapp/ml/generate_model_report.py

# Análise de biodiversidade
python src/bgapp/ml/biodiversity_analysis.py

# Validação temporal
python src/bgapp/ml/temporal_validation.py
```

---

## 📚 **Datasets & Fontes de Dados**

### 🌊 **Dados Oceanográficos**
- **Copernicus Marine Service** - SST, correntes, salinidade
- **MODIS** - Clorofila-a, temperatura superficial
- **GEBCO** - Batimetria de alta resolução
- **ECMWF** - Dados meteorológicos

### 🐟 **Dados de Biodiversidade**
- **GBIF** - Ocorrências de espécies globais
- **OBIS** - Dados oceanográficos biológicos
- **FishBase** - Base de dados de peixes
- **Dados locais** - Investigação angolana

### 📊 **Datasets Específicos Angola**
```
data/species/angola_marine_species.csv    ← 35+ espécies catalogadas
data/oceanographic/zee_angola_data.csv     ← Dados ZEE Angola
data/fisheries/fishing_zones_angola.geojson ← Zonas pesqueiras
data/biodiversity/biodiversity_indices.csv ← Índices Shannon/Simpson
```

---

## 🧠 **Algoritmos Implementados**

### 🌿 **Biodiversity Predictor**
```python
# Ensemble: Random Forest + XGBoost
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.ensemble import VotingRegressor

# Features: temperatura, salinidade, profundidade, clorofila
# Target: índice de biodiversidade (Shannon/Simpson)
# Precisão atual: 95.2%
```

### 🐟 **Species Classifier**
```python
# Random Forest Otimizado
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# Features: coordenadas, dados ambientais, sazonalidade
# Target: presença/ausência de espécies
# Precisão atual: 97.1%
```

### 🌊 **Temperature Forecaster**
```python
# LSTM Neural Network
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Features: séries temporais SST
# Target: temperatura futura (7 dias)
# Precisão atual: 94.8%
```

---

## 📊 **Análise de Performance**

### 🎯 **Métricas Científicas**
```python
# Índices de biodiversidade
def shannon_diversity(abundances):
    """Calcular índice de diversidade de Shannon"""
    return -sum(p * np.log(p) for p in abundances if p > 0)

def simpson_diversity(abundances):
    """Calcular índice de diversidade de Simpson"""
    return 1 - sum(p**2 for p in abundances)

# Adequação de habitat (MaxEnt)
def habitat_suitability(environmental_vars):
    """Modelação de adequação de habitat usando MaxEnt"""
    # Implementação específica para espécies angolanas
```

### 📈 **Validação Temporal**
```python
# Backtesting de modelos
def temporal_validation(model, data, train_size=0.7):
    """Validação temporal para séries oceanográficas"""
    # Split temporal (não aleatório)
    # Validação em dados futuros
    # Análise de drift temporal
```

---

## 🔬 **Publicações & Peer Review**

### 📝 **Artigos Científicos**
- **Em preparação**: "ML-based Marine Biodiversity Prediction for Angola's EEZ"
- **Submetido**: "Ensemble Methods for Oceanographic Forecasting"
- **Publicado**: [referências anteriores]

### 👥 **Colaborações Científicas**
- **Universidades angolanas** - Validação local
- **Investigadores internacionais** - Peer review
- **MINPERMAR** - Aplicação prática
- **ONGs conservação** - Validação de campo

### 📊 **Metodologia**
```
1. Revisão literatura científica
2. Coleta e limpeza de dados
3. Exploração e análise exploratória
4. Feature engineering científico
5. Modelação e validação
6. Interpretação biológica
7. Peer review e publicação
```

---

## 📞 **Contacto & Colaboração**

### 👨‍💻 **Tech Lead**
- **Marcos Santos** - marcos@maredatum.com
- **Review obrigatório** para modelos em produção
- **Suporte técnico** para implementação

### 🔬 **Supervisor Científico**
- **Paulo Fernandes** - paulo@maredatum.com
- **Validação científica** final
- **Conexões institucionais** MINPERMAR

### 🌍 **Rede Científica**
- **Investigadores marinhos** - Colaboração
- **Universidades** - Validação académica
- **Organizações internacionais** - Benchmarking

---

## ✅ **Definition of Done - Data Science**

### 📝 **Para cada modelo:**
- [ ] **Precisão** >95% em validação
- [ ] **Cross-validation** rigorosa (k-fold)
- [ ] **Interpretabilidade** científica
- [ ] **Documentação** metodológica
- [ ] **Peer review** interno
- [ ] **Testes** estatísticos significativos

### 🔬 **Para publicação:**
- [ ] **Metodologia** reproduzível
- [ ] **Datasets** documentados
- [ ] **Código** versionado
- [ ] **Resultados** validados
- [ ] **Ethics approval** (se necessário)

---

## 🎯 **Roadmap Data Science**

### 🏃‍♂️ **Curto Prazo (1-2 sprints)**
- Melhorar precisão modelos existentes
- Implementar novos algoritmos ensemble
- Validação com dados angolanos

### 🚀 **Médio Prazo (3-4 sprints)**
- Deep learning para classificação
- AutoML para otimização
- Real-time model updates

### 🌟 **Longo Prazo (5+ sprints)**
- Modelos federados
- AI explicável (XAI)
- Integração com IoT sensors

---

## 📊 **Ferramentas & Bibliotecas**

### 🐍 **Python ML Stack**
```python
# Core ML
import sklearn
import xgboost
import tensorflow
import pytorch

# Data processing
import pandas
import numpy
import geopandas

# Visualization
import matplotlib
import seaborn
import plotly

# Scientific computing
import scipy
import scikit-bio
import statsmodels
```

### 📊 **Análise Geoespacial**
```python
# Geospatial analysis
import geopandas
import rasterio
import shapely
import pyproj

# Marine data
import xarray
import netCDF4
import cartopy

# Biodiversity
import skbio
import ete3
import biopython
```

---

## 🌊 **Dados Específicos Angola**

### 🐟 **Espécies Marinhas (35+)**
```python
angola_species = [
    'Thunnus albacares',      # Atum-amarelo
    'Sardina pilchardus',     # Sardinha
    'Tursiops truncatus',     # Golfinho-roaz
    'Merluccius capensis',    # Pescada-do-cabo
    'Dentex angolensis',      # Dentão-angolano
    # ... 30+ espécies adicionais
]
```

### 🌊 **Parâmetros Oceanográficos**
```python
oceanographic_params = {
    'sst': 'Sea Surface Temperature',
    'salinity': 'Sea Surface Salinity', 
    'chlorophyll': 'Chlorophyll-a concentration',
    'current_speed': 'Ocean current velocity',
    'wave_height': 'Significant wave height',
    'bathymetry': 'Water depth'
}
```

---

## 📈 **Análise de Resultados**

### 🎯 **Interpretação Biológica**
```python
def interpret_biodiversity_prediction(prediction, confidence):
    """
    Interpretar predições de biodiversidade no contexto 
    dos ecossistemas marinhos angolanos
    """
    if prediction > 0.8 and confidence > 0.9:
        return "Hotspot de biodiversidade confirmado"
    elif prediction > 0.6 and confidence > 0.8:
        return "Área de interesse para conservação"
    else:
        return "Necessária investigação adicional"
```

### 📊 **Validação Estatística**
```python
def statistical_validation(predictions, ground_truth):
    """
    Validação estatística rigorosa para publicação científica
    """
    # Teste t para significância
    t_stat, p_value = ttest_ind(predictions, ground_truth)
    
    # Correlação de Pearson
    correlation, p_corr = pearsonr(predictions, ground_truth)
    
    # R² e métricas de regressão
    r2_score = r2_score(ground_truth, predictions)
    
    return {
        'significance': p_value < 0.05,
        'correlation': correlation,
        'r_squared': r2_score
    }
```

---

## 🔬 **Protocolos Científicos**

### 📋 **Checklist Científica**
- [ ] **Hipóteses** claramente definidas
- [ ] **Metodologia** reproduzível
- [ ] **Dados** de qualidade verificada
- [ ] **Validação** estatística rigorosa
- [ ] **Interpretação** biológica consistente
- [ ] **Limitações** claramente identificadas

### 📊 **Reporting Template**
```markdown
## Modelo: [Nome do Modelo]
### Objetivo Científico
[Descrição do problema biológico/oceanográfico]

### Metodologia
[Algoritmos utilizados e justificação]

### Datasets
[Fontes de dados e período temporal]

### Resultados
[Métricas de performance e interpretação]

### Validação
[Cross-validation e testes estatísticos]

### Limitações
[Limitações conhecidas e trabalho futuro]

### Peer Review
[Comentários de investigadores]
```

---

**Bem-vindo à equipa de Data Science BGAPP! Vamos desvendar os segredos dos oceanos angolanos com IA! 🌊🧠**
