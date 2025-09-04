# PLANO DE INTEGRAÇÃO ONEDRIVE - BGAPP
**Data:** Janeiro 2025  
**Objetivo:** Integrar 1TB OneDrive com base de dados BGAPP  
**Status:** 🔄 Em Planeamento

## 📊 SITUAÇÃO ATUAL

### ✅ Arquitetura Existente
- **PostgreSQL (PostGIS)**: Base de dados principal para dados geoespaciais
- **MinIO**: Armazenamento de objetos (buckets: bgapp-data, bgapp-backups, bgapp-temp)
- **Redis**: Cache e sessões
- **Volume Docker**: Dados persistentes locais

### 📍 Localização OneDrive
```
/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/
```

## 🎯 ESTRATÉGIAS DE INTEGRAÇÃO

### **OPÇÃO 1: BACKUP AUTOMÁTICO INTELIGENTE** ⭐ RECOMENDADA
**Conceito:** Manter sistema atual + backup automático para OneDrive

#### Vantagens:
- ✅ Zero impacto na performance
- ✅ Backup automático de 1TB
- ✅ Sincronização nativa OneDrive
- ✅ Recuperação rápida em caso de falha

#### Implementação:
```bash
# Estrutura OneDrive
OneDrive/
├── BGAPP_Backups/
│   ├── postgres_dumps/     # Backups PostgreSQL
│   ├── minio_data/        # Backup buckets MinIO
│   ├── configs/           # Configurações
│   └── logs/              # Logs importantes
├── BGAPP_Archive/         # Dados históricos
└── BGAPP_Sync/           # Sincronização ativa
```

---

### **OPÇÃO 2: ARMAZENAMENTO HÍBRIDO**
**Conceito:** Dados críticos local + arquivos grandes no OneDrive

#### Configuração:
- **PostgreSQL**: Mantém local (performance)
- **MinIO Hot Data**: Local (acesso rápido)
- **MinIO Cold Data**: OneDrive (arquivos > 30 dias)
- **Sincronização**: Automática

---

### **OPÇÃO 3: MIGRAÇÃO COMPLETA**
**Conceito:** Mover volumes Docker para OneDrive

⚠️ **ATENÇÃO:** Pode impactar performance devido à latência de rede

## 🛠️ IMPLEMENTAÇÃO RECOMENDADA (OPÇÃO 1)

### **Fase 1: Configuração de Backup**

#### 1.1 Criar Estrutura OneDrive
```bash
# Criar diretórios no OneDrive
mkdir -p "/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/BGAPP_Backups"
mkdir -p "/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/BGAPP_Backups/postgres_dumps"
mkdir -p "/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/BGAPP_Backups/minio_data"
mkdir -p "/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/BGAPP_Backups/configs"
```

#### 1.2 Script de Backup Automático
```python
# scripts/onedrive_backup.py
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

ONEDRIVE_BACKUP = "/Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/BGAPP_Backups"

def backup_postgres():
    """Backup PostgreSQL para OneDrive"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"{ONEDRIVE_BACKUP}/postgres_dumps/bgapp_backup_{timestamp}.sql"
    
    subprocess.run([
        "docker", "exec", "infra-postgis-1",
        "pg_dump", "-U", "postgres", "-d", "geo", "-f", f"/tmp/backup_{timestamp}.sql"
    ])
    
    subprocess.run([
        "docker", "cp", f"infra-postgis-1:/tmp/backup_{timestamp}.sql", backup_file
    ])

def backup_minio():
    """Backup MinIO buckets para OneDrive"""
    # Implementar backup dos buckets MinIO
    pass

def backup_configs():
    """Backup configurações para OneDrive"""
    shutil.copytree("configs", f"{ONEDRIVE_BACKUP}/configs", dirs_exist_ok=True)
```

#### 1.3 Automatização via Cron
```bash
# Adicionar ao crontab
# Backup diário às 2:00 AM
0 2 * * * cd /Users/marcossantos/Library/CloudStorage/OneDrive-MareDatumConsultoriaeGestãodeProjectosUnipessoalLDA/Code/BGAPP && python scripts/onedrive_backup.py
```

### **Fase 2: Sincronização Inteligente**

#### 2.1 Configuração Docker Volumes
```yaml
# docker-compose.onedrive.yml
services:
  postgis:
    volumes:
      - postgis-data:/var/lib/postgresql/data
      - ${ONEDRIVE_PATH}/BGAPP_Backups/postgres_dumps:/backups:rw

  minio:
    volumes:
      - minio-data:/data
      - ${ONEDRIVE_PATH}/BGAPP_Backups/minio_data:/backups:rw
```

#### 2.2 Monitorização de Espaço
```python
def check_onedrive_space():
    """Verificar espaço disponível no OneDrive"""
    onedrive_path = Path(ONEDRIVE_BACKUP)
    total, used, free = shutil.disk_usage(onedrive_path)
    
    return {
        "total_gb": total // (1024**3),
        "used_gb": used // (1024**3), 
        "free_gb": free // (1024**3),
        "usage_percent": (used / total) * 100
    }
```

### **Fase 3: Interface de Gestão**

#### 3.1 Dashboard OneDrive
Adicionar secção no admin dashboard:
- 📊 Espaço utilizado OneDrive
- 📅 Último backup
- ⚡ Status sincronização
- 🔄 Botão backup manual

#### 3.2 API Endpoints
```python
@app.get("/onedrive/status")
async def onedrive_status():
    """Status da integração OneDrive"""
    return check_onedrive_space()

@app.post("/onedrive/backup")
async def trigger_backup():
    """Disparar backup manual"""
    backup_postgres()
    backup_minio()
    backup_configs()
```

## 📈 BENEFÍCIOS DA INTEGRAÇÃO

### ✅ **Vantagens Imediatas**
- **1TB de backup**: Dados seguros na nuvem
- **Sincronização automática**: OneDrive sincroniza automaticamente
- **Acesso remoto**: Dados disponíveis em qualquer dispositivo
- **Versionamento**: OneDrive mantém histórico de versões

### ✅ **Vantagens a Longo Prazo**
- **Disaster Recovery**: Recuperação completa em caso de falha
- **Escalabilidade**: Fácil expansão de armazenamento
- **Colaboração**: Partilha segura de dados
- **Conformidade**: Backup offsite para compliance

## ⚠️ CONSIDERAÇÕES TÉCNICAS

### **Performance**
- Backup assíncrono para não impactar operações
- Compressão de dados para otimizar transferência
- Backup incremental para reduzir tempo

### **Segurança**
- Encriptação de backups sensíveis
- Controlo de acesso OneDrive
- Logs de auditoria

### **Monitorização**
- Alertas em caso de falha de backup
- Métricas de utilização de espaço
- Relatórios de sincronização

## 🚀 CRONOGRAMA DE IMPLEMENTAÇÃO

### **Semana 1**
- [x] Análise arquitetura atual
- [ ] Configuração estrutura OneDrive
- [ ] Desenvolvimento scripts backup

### **Semana 2**
- [ ] Implementação backup automático
- [ ] Testes de sincronização
- [ ] Interface dashboard

### **Semana 3**
- [ ] Monitorização e alertas
- [ ] Documentação técnica
- [ ] Testes de recuperação

### **Semana 4**
- [ ] Deploy produção
- [ ] Formação utilizadores
- [ ] Monitorização pós-deploy

## 📝 PRÓXIMOS PASSOS

1. **Aprovação do plano** pelo utilizador
2. **Configuração inicial** da estrutura OneDrive
3. **Desenvolvimento** dos scripts de backup
4. **Testes** em ambiente de desenvolvimento
5. **Deploy** gradual para produção

---

**💡 Recomendação:** Começar com a Opção 1 (Backup Automático) por ser mais segura e ter menor impacto no sistema existente.

**❓ Questões para o utilizador:**
- Prefere começar com backup automático ou migração completa?
- Há dados específicos que devem ter prioridade no backup?
- Qual a frequência de backup desejada? (diária, semanal)
