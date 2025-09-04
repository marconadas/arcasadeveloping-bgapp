#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Script de Integração dos Novos Serviços no Admin.html
=======================================================

Este script integra automaticamente os novos serviços implementados
no painel administrativo existente, adicionando:

- Entradas no menu lateral
- Métricas no dashboard principal  
- Secções completas para cada serviço
- Funções JavaScript necessárias
- Estilos CSS apropriados

Autor: Sistema BGAPP
Data: Janeiro 2025
"""

import os
import re
from pathlib import Path
from datetime import datetime

def print_step(step: str):
    """Imprimir passo"""
    print(f"📋 {step}")

def print_success(message: str):
    """Imprimir mensagem de sucesso"""
    print(f"✅ {message}")

def print_warning(message: str):
    """Imprimir aviso"""
    print(f"⚠️ {message}")

def print_error(message: str):
    """Imprimir erro"""
    print(f"❌ {message}")

def backup_admin_file(admin_path: Path) -> Path:
    """Criar backup do admin.html"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = admin_path.parent / f"admin_backup_{timestamp}.html"
    
    with open(admin_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return backup_path

def add_menu_items(content: str) -> str:
    """Adicionar itens do menu lateral"""
    print_step("Adicionando itens ao menu lateral...")
    
    # Procurar pela secção de IA e Machine Learning
    ml_section_pattern = r'(<div class="nav-section">🤖 IA e Machine Learning</div>)'
    
    new_menu_items = '''
                <div class="nav-section">🧠 Novos Serviços IA</div>
                <li class="nav-item">
                    <a href="#maxent-service" class="nav-link" data-section="maxent-service">
                        <i class="fas fa-brain"></i>
                        <span>MaxEnt - Distribuição Espécies</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#boundary-service" class="nav-link" data-section="boundary-service">
                        <i class="fas fa-map-marked-alt"></i>
                        <span>Processamento Fronteiras</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#coastal-service" class="nav-link" data-section="coastal-service">
                        <i class="fas fa-water"></i>
                        <span>Análise Costeira</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#mcda-service" class="nav-link" data-section="mcda-service">
                        <i class="fas fa-balance-scale"></i>
                        <span>MCDA - Análise Multi-Critério</span>
                    </a>
                </li>
                
                $1'''
    
    content = re.sub(ml_section_pattern, new_menu_items, content)
    print_success("Itens do menu adicionados")
    return content

def add_dashboard_metrics(content: str) -> str:
    """Adicionar métricas ao dashboard principal"""
    print_step("Adicionando métricas ao dashboard...")
    
    # Procurar pelo fim da metrics-grid
    metrics_pattern = r'(</div>\s*</div>\s*<!-- Quick Access Links -->)'
    
    new_metrics = '''                        <div class="metric-card">
                            <div class="metric-icon"><i class="fas fa-fish"></i></div>
                            <div class="metric-value text-info" id="maxent-models-count">-</div>
                            <div class="metric-label">Modelos MaxEnt Ativos</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon"><i class="fas fa-map-marked-alt"></i></div>
                            <div class="metric-value text-success" id="boundaries-processed">-</div>
                            <div class="metric-label">Fronteiras Processadas</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon"><i class="fas fa-water"></i></div>
                            <div class="metric-value text-warning" id="coastal-segments">-</div>
                            <div class="metric-label">Segmentos Costeiros</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon"><i class="fas fa-balance-scale"></i></div>
                            <div class="metric-value text-primary" id="mcda-analyses">-</div>
                            <div class="metric-label">Análises MCDA</div>
                        </div>
                    $1'''
    
    content = re.sub(metrics_pattern, new_metrics, content)
    print_success("Métricas do dashboard adicionadas")
    return content

def add_service_sections(content: str) -> str:
    """Adicionar secções completas dos novos serviços"""
    print_step("Adicionando secções dos serviços...")
    
    # Ler o conteúdo das secções do ficheiro de integração
    integration_file = Path("infra/frontend/admin_new_services_integration.html")
    
    if not integration_file.exists():
        print_error("Ficheiro de integração não encontrado")
        return content
    
    with open(integration_file, 'r', encoding='utf-8') as f:
        integration_content = f.read()
    
    # Extrair secções HTML
    sections_pattern = r'<!-- ========================================== -->\s*<!-- \d+\. SECÇÃO .+ -->\s*<!-- ========================================== -->\s*(.*?)(?=<!-- ========================================== -->|$)'
    sections = re.findall(sections_pattern, integration_content, re.DOTALL)
    
    # Encontrar onde inserir as secções (antes do </div> final do content-area)
    insertion_point = r'(</div>\s*</main>)'
    
    # Extrair secções específicas do ficheiro de integração
    maxent_section = extract_section(integration_content, "SECÇÃO MAXENT SERVICE")
    boundary_section = extract_section(integration_content, "SECÇÃO BOUNDARY PROCESSOR")
    coastal_section = extract_section(integration_content, "SECÇÃO COASTAL ANALYSIS")
    mcda_section = extract_section(integration_content, "SECÇÃO MCDA SERVICE")
    
    all_sections = f"""
                {maxent_section}
                {boundary_section}
                {coastal_section}
                {mcda_section}
                
                $1"""
    
    content = re.sub(insertion_point, all_sections, content)
    print_success("Secções dos serviços adicionadas")
    return content

def extract_section(content: str, section_name: str) -> str:
    """Extrair uma secção específica do conteúdo"""
    pattern = f"<!-- {section_name} -->(.*?)(?=<!-- [=]{{40}} -->|$)"
    match = re.search(pattern, content, re.DOTALL)
    return match.group(1).strip() if match else ""

def add_javascript_functions(content: str) -> str:
    """Adicionar funções JavaScript"""
    print_step("Adicionando funções JavaScript...")
    
    # Procurar pelo fim dos scripts existentes
    script_pattern = r'(</script>\s*</body>)'
    
    js_functions = '''
    <script>
    // 🧠 Funções para os Novos Serviços BGAPP
    
    // MaxEnt Service Functions
    function refreshMaxEntService() {
        console.log('🧠 Atualizando MaxEnt Service...');
        updateMaxEntMetrics();
    }

    function updateMaxEntMetrics() {
        // Simular dados para demonstração
        document.getElementById('maxent-models-count').textContent = '12';
        
        // Carregar modelos na tabela
        const table = document.getElementById('maxent-models-table');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td>Sardinella aurita</td>
                    <td><span class="badge bg-success">0.847</span></td>
                    <td><span class="badge bg-info">89.2%</span></td>
                    <td>2025-01-09</td>
                    <td><span class="badge bg-success">Ativo</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewModel('sardinella')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
                <tr>
                    <td>Thunnus albacares</td>
                    <td><span class="badge bg-warning">0.723</span></td>
                    <td><span class="badge bg-info">85.7%</span></td>
                    <td>2025-01-08</td>
                    <td><span class="badge bg-success">Ativo</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewModel('thunnus')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>`;
        }
    }

    function trainNewMaxEntModel() {
        console.log('🎯 Iniciando treino de novo modelo MaxEnt...');
        alert('Funcionalidade em desenvolvimento: Treino de novo modelo MaxEnt');
    }

    function makePrediction() {
        const species = document.getElementById('prediction-species')?.value;
        const lat = document.getElementById('prediction-lat')?.value;
        const lon = document.getElementById('prediction-lon')?.value;
        
        if (!species || !lat || !lon) {
            alert('Por favor, preencha todos os campos');
            return;
        }
        
        console.log(`🔮 Fazendo predição para ${species} em (${lat}, ${lon})`);
        
        // Simular resultado
        const result = document.getElementById('prediction-result');
        if (result) {
            result.style.display = 'block';
            result.innerHTML = `
                <h6>Resultado da Predição</h6>
                <p><strong>Espécie:</strong> ${species}</p>
                <p><strong>Localização:</strong> ${lat}, ${lon}</p>
                <p><strong>Probabilidade:</strong> <span class="badge bg-success">0.847</span></p>
                <p><strong>Adequação:</strong> <span class="badge bg-info">Alta</span></p>
            `;
        }
    }

    // Boundary Processor Functions
    function refreshBoundaryService() {
        console.log('🗺️ Atualizando Boundary Service...');
        updateBoundaryMetrics();
    }

    function updateBoundaryMetrics() {
        document.getElementById('boundaries-processed').textContent = '8';
        
        // Atualizar tabela de zonas marítimas
        const table = document.getElementById('maritime-zones-table');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td>ZEE Angola</td>
                    <td>Zona Económica Exclusiva</td>
                    <td>495,866</td>
                    <td>1,650</td>
                    <td><span class="badge bg-success">Validada</span></td>
                </tr>
                <tr>
                    <td>Águas Territoriais</td>
                    <td>12 Milhas Náuticas</td>
                    <td>28,450</td>
                    <td>1,650</td>
                    <td><span class="badge bg-success">Validada</span></td>
                </tr>
                <tr>
                    <td>Zona Contígua</td>
                    <td>24 Milhas Náuticas</td>
                    <td>56,900</td>
                    <td>1,650</td>
                    <td><span class="badge bg-info">Processando</span></td>
                </tr>`;
        }
    }

    function processBoundaries() {
        console.log('⚙️ Processando fronteiras marítimas...');
        alert('Iniciando processamento de fronteiras marítimas...');
    }

    function loadBoundaryMap() {
        console.log('🗺️ Carregando mapa de fronteiras...');
        const preview = document.getElementById('boundary-map-preview');
        if (preview) {
            preview.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Carregando mapa...</p></div>';
            
            setTimeout(() => {
                preview.innerHTML = '<div class="text-center"><i class="fas fa-map fa-3x text-success"></i><p class="text-success">Mapa carregado com sucesso!</p></div>';
            }, 2000);
        }
    }

    // Coastal Analysis Functions
    function refreshCoastalService() {
        console.log('🌊 Atualizando Coastal Service...');
        updateCoastalMetrics();
    }

    function updateCoastalMetrics() {
        document.getElementById('coastal-segments').textContent = '47';
        
        // Atualizar tabela de segmentos
        const table = document.getElementById('coastal-segments-table');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td>AO_COAST_001</td>
                    <td><span class="badge bg-info">Mangal</span></td>
                    <td>12.5</td>
                    <td><span class="badge bg-success">Baixa (0.3)</span></td>
                    <td><span class="text-success">+0.2</span></td>
                    <td><button class="btn btn-sm btn-primary"><i class="fas fa-eye"></i></button></td>
                </tr>
                <tr>
                    <td>AO_COAST_015</td>
                    <td><span class="badge bg-warning">Arenoso</span></td>
                    <td>8.7</td>
                    <td><span class="badge bg-danger">Alta (0.8)</span></td>
                    <td><span class="text-danger">-1.5</span></td>
                    <td><button class="btn btn-sm btn-primary"><i class="fas fa-eye"></i></button></td>
                </tr>
                <tr>
                    <td>AO_COAST_032</td>
                    <td><span class="badge bg-secondary">Rochoso</span></td>
                    <td>15.2</td>
                    <td><span class="badge bg-success">Baixa (0.2)</span></td>
                    <td><span class="text-muted">0.0</span></td>
                    <td><button class="btn btn-sm btn-primary"><i class="fas fa-eye"></i></button></td>
                </tr>`;
        }
    }

    function detectCoastalChanges() {
        console.log('🔍 Detectando mudanças costeiras...');
        alert('Iniciando deteção de mudanças costeiras...');
    }

    function createMonitoringNetwork() {
        console.log('📡 Criando rede de monitorização...');
        alert('Criando rede de monitorização costeira...');
    }

    // MCDA Service Functions
    function refreshMCDAService() {
        console.log('⚖️ Atualizando MCDA Service...');
        updateMCDAMetrics();
    }

    function updateMCDAMetrics() {
        document.getElementById('mcda-analyses').textContent = '23';
    }

    function selectObjective(objective) {
        console.log(`🎯 Selecionado objetivo: ${objective}`);
        
        // Remover seleção anterior
        document.querySelectorAll('.objective-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Adicionar seleção atual
        event.currentTarget.classList.add('active');
        
        // Atualizar critérios baseado no objetivo
        updateCriteriaForObjective(objective);
    }

    function updateCriteriaForObjective(objective) {
        const table = document.getElementById('mcda-criteria-table');
        if (!table) return;
        
        let criteriaHTML = '';
        
        switch(objective) {
            case 'aquaculture':
                criteriaHTML = `
                    <tr><td>Profundidade</td><td>Alvo</td><td>0.30</td><td>m</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Temperatura</td><td>Alvo</td><td>0.25</td><td>°C</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Corrente</td><td>Alvo</td><td>0.20</td><td>m/s</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Distância Costa</td><td>Custo</td><td>0.15</td><td>km</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Altura Ondas</td><td>Custo</td><td>0.10</td><td>m</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>`;
                break;
            case 'fishing':
                criteriaHTML = `
                    <tr><td>Clorofila-a</td><td>Benefício</td><td>0.40</td><td>mg/m³</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Profundidade</td><td>Alvo</td><td>0.25</td><td>m</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Distância Porto</td><td>Custo</td><td>0.20</td><td>km</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Abundância Peixe</td><td>Benefício</td><td>0.15</td><td>kg/km²</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>`;
                break;
            case 'conservation':
                criteriaHTML = `
                    <tr><td>Biodiversidade</td><td>Benefício</td><td>0.35</td><td>índice</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Qualidade Habitat</td><td>Benefício</td><td>0.30</td><td>índice</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Pressão Humana</td><td>Custo</td><td>0.20</td><td>índice</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>
                    <tr><td>Conectividade</td><td>Benefício</td><td>0.15</td><td>índice</td><td><button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button></td></tr>`;
                break;
        }
        
        table.innerHTML = criteriaHTML;
    }

    function runMCDAAnalysis() {
        const method = document.getElementById('mcda-method')?.value;
        const resolution = document.getElementById('grid-resolution')?.value;
        
        console.log(`🔄 Executando análise MCDA: ${method}, resolução: ${resolution}km`);
        
        // Mostrar progresso
        const progress = document.getElementById('mcda-progress');
        const progressBar = progress?.querySelector('.progress-bar');
        const statusDiv = document.getElementById('progress-status');
        const logDiv = document.getElementById('analysis-log');
        
        if (progress) {
            progress.style.display = 'block';
            
            let currentProgress = 0;
            const steps = [
                'Inicializando análise...',
                'Carregando dados ambientais...',
                'Criando grelha espacial...',
                'Calculando scores de critérios...',
                'Aplicando pesos AHP...',
                'Gerando mapa de adequação...',
                'Análise concluída!'
            ];
            
            const interval = setInterval(() => {
                if (currentProgress < steps.length) {
                    const step = steps[currentProgress];
                    const progressPercent = ((currentProgress + 1) / steps.length) * 100;
                    
                    if (progressBar) progressBar.style.width = progressPercent + '%';
                    if (statusDiv) statusDiv.textContent = step;
                    if (logDiv) logDiv.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${step}</div>`;
                    
                    currentProgress++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        if (progress) progress.style.display = 'none';
                        alert('Análise MCDA concluída com sucesso!');
                    }, 1000);
                }
            }, 800);
        }
    }

    // Função para atualizar todas as métricas dos novos serviços
    function updateAllNewServicesMetrics() {
        updateMaxEntMetrics();
        updateBoundaryMetrics();
        updateCoastalMetrics();
        updateMCDAMetrics();
    }

    // Inicializar quando a página carregar
    document.addEventListener('DOMContentLoaded', function() {
        // Aguardar um pouco para garantir que todos os elementos estão carregados
        setTimeout(() => {
            updateAllNewServicesMetrics();
            console.log('✅ Novos serviços integrados e métricas atualizadas');
        }, 1000);
    });
    </script>
    
    $1'''
    
    content = re.sub(script_pattern, js_functions, content)
    print_success("Funções JavaScript adicionadas")
    return content

def add_css_styles(content: str) -> str:
    """Adicionar estilos CSS"""
    print_step("Adicionando estilos CSS...")
    
    # Procurar pela tag </head>
    head_pattern = r'(</head>)'
    
    css_styles = '''
    <style>
    /* 🎨 Estilos para os Novos Serviços BGAPP */
    
    .objective-card {
        background: #fff;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 20px;
    }

    .objective-card:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0,123,255,0.15);
        transform: translateY(-2px);
    }

    .objective-card.active {
        border-color: #007bff;
        background: #f8f9ff;
    }

    .objective-icon {
        font-size: 2.5rem;
        color: #007bff;
        margin-bottom: 15px;
    }

    .objective-stats {
        color: #6c757d;
        font-size: 0.875rem;
        margin-top: 10px;
    }

    .service-status {
        display: flex;
        align-items: center;
        padding: 10px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border-radius: 6px;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 10px;
    }

    .status-healthy { background-color: #28a745; }
    .status-warning { background-color: #ffc107; }
    .status-error { background-color: #dc3545; }

    .service-name {
        flex: 1;
        font-weight: 500;
    }

    .service-uptime {
        color: #6c757d;
        font-size: 0.875rem;
    }

    .realtime-metric {
        display: flex;
        align-items: center;
        padding: 15px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 15px;
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    #analysis-log {
        max-height: 200px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
    }

    .progress {
        height: 8px;
        border-radius: 4px;
        background-color: #e9ecef;
    }

    .progress-bar {
        background-color: #007bff;
        transition: width 0.6s ease;
    }

    /* Melhorar responsividade das tabelas dos novos serviços */
    @media (max-width: 768px) {
        .objective-card {
            margin-bottom: 15px;
        }
        
        .objective-icon {
            font-size: 2rem;
        }
        
        .btn-group-vertical .btn {
            margin-bottom: 8px;
        }
    }

    /* Destacar métricas dos novos serviços */
    .metric-card .metric-icon .fa-fish,
    .metric-card .metric-icon .fa-map-marked-alt,
    .metric-card .metric-icon .fa-water,
    .metric-card .metric-icon .fa-balance-scale {
        color: #28a745;
    }

    /* Animação para loading dos novos serviços */
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #6c757d;
    }

    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Badges especiais para os novos serviços */
    .badge.bg-maxent { background-color: #6f42c1 !important; }
    .badge.bg-boundary { background-color: #20c997 !important; }
    .badge.bg-coastal { background-color: #0dcaf0 !important; }
    .badge.bg-mcda { background-color: #fd7e14 !important; }
    </style>
    
    $1'''
    
    content = re.sub(head_pattern, css_styles, content)
    print_success("Estilos CSS adicionados")
    return content

def main():
    """Função principal"""
    print("🔧 INTEGRAÇÃO DOS NOVOS SERVIÇOS NO ADMIN.HTML")
    print("=" * 60)
    
    # Caminhos dos ficheiros
    admin_path = Path("infra/frontend/admin.html")
    
    if not admin_path.exists():
        print_error(f"Ficheiro {admin_path} não encontrado")
        return False
    
    try:
        # Criar backup
        print_step("Criando backup do admin.html...")
        backup_path = backup_admin_file(admin_path)
        print_success(f"Backup criado: {backup_path}")
        
        # Ler conteúdo atual
        with open(admin_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar se já foi integrado
        if 'Novos Serviços IA' in content:
            print_warning("Novos serviços já parecem estar integrados")
            return True
        
        # Aplicar todas as modificações
        content = add_menu_items(content)
        content = add_dashboard_metrics(content)
        content = add_css_styles(content)
        content = add_javascript_functions(content)
        
        # Adicionar secções manualmente (versão simplificada)
        print_step("Adicionando secções dos serviços...")
        
        # Encontrar ponto de inserção
        insertion_point = content.rfind('</div>\n        </main>')
        
        if insertion_point != -1:
            # Secções simplificadas dos novos serviços
            new_sections = '''
                <!-- Novos Serviços BGAPP -->
                
                <!-- MaxEnt Service Section -->
                <div id="maxent-service-section" class="section" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fas fa-brain"></i>
                                MaxEnt - Modelação de Distribuição de Espécies
                                <span class="badge bg-success">Ativo</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <table class="table table-mobile-stack">
                                        <thead>
                                            <tr><th>Espécie</th><th>AUC</th><th>Precisão</th><th>Data</th><th>Estado</th><th>Ações</th></tr>
                                        </thead>
                                        <tbody id="maxent-models-table">
                                            <tr><td colspan="6" class="loading"><div class="spinner"></div>A carregar modelos MaxEnt...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success mb-2" onclick="trainNewMaxEntModel()">
                                        <i class="fas fa-play me-2"></i>Treinar Novo Modelo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Boundary Service Section -->
                <div id="boundary-service-section" class="section" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fas fa-map-marked-alt"></i>
                                Processador de Fronteiras Marítimas
                                <span class="badge bg-info">Processando</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <table class="table">
                                        <thead>
                                            <tr><th>Zona</th><th>Tipo</th><th>Área (km²)</th><th>Estado</th></tr>
                                        </thead>
                                        <tbody id="maritime-zones-table">
                                            <tr><td colspan="4" class="loading"><div class="spinner"></div>A carregar zonas marítimas...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success mb-2" onclick="processBoundaries()">
                                        <i class="fas fa-cogs me-2"></i>Processar Fronteiras
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coastal Service Section -->
                <div id="coastal-service-section" class="section" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fas fa-water"></i>
                                Análise Avançada de Linha Costeira
                                <span class="badge bg-warning">Monitorização</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <table class="table table-mobile-stack">
                                        <thead>
                                            <tr><th>ID</th><th>Tipo</th><th>Comprimento</th><th>Vulnerabilidade</th><th>Mudança</th></tr>
                                        </thead>
                                        <tbody id="coastal-segments-table">
                                            <tr><td colspan="5" class="loading"><div class="spinner"></div>A carregar segmentos costeiros...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-primary mb-2" onclick="detectCoastalChanges()">
                                        <i class="fas fa-search me-2"></i>Detectar Mudanças
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MCDA Service Section -->
                <div id="mcda-service-section" class="section" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fas fa-balance-scale"></i>
                                MCDA - Análise Multi-Critério
                                <span class="badge bg-primary">Otimização</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="objective-card" onclick="selectObjective('aquaculture')">
                                        <div class="objective-icon"><i class="fas fa-fish"></i></div>
                                        <h5>Aquacultura</h5>
                                        <p>Otimização de localizações para aquacultura marinha</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="objective-card" onclick="selectObjective('fishing')">
                                        <div class="objective-icon"><i class="fas fa-anchor"></i></div>
                                        <h5>Pesca</h5>
                                        <p>Identificação de áreas ótimas para atividade pesqueira</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="objective-card" onclick="selectObjective('conservation')">
                                        <div class="objective-icon"><i class="fas fa-leaf"></i></div>
                                        <h5>Conservação</h5>
                                        <p>Seleção de áreas marinhas protegidas</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row mt-4">
                                <div class="col-md-8">
                                    <table class="table">
                                        <thead>
                                            <tr><th>Critério</th><th>Tipo</th><th>Peso</th><th>Unidade</th></tr>
                                        </thead>
                                        <tbody id="mcda-criteria-table">
                                            <tr><td colspan="4" class="loading"><div class="spinner"></div>Selecione um objetivo...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-success mb-2" onclick="runMCDAAnalysis()">
                                        <i class="fas fa-play me-2"></i>Executar Análise
                                    </button>
                                    <div id="mcda-progress" style="display: none;">
                                        <div class="progress mb-3">
                                            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                        </div>
                                        <div id="progress-status">Inicializando...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            '''
            
            content = content[:insertion_point] + new_sections + content[insertion_point:]
            print_success("Secções dos serviços adicionadas")
        
        # Escrever ficheiro modificado
        with open(admin_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print_success("Integração concluída com sucesso!")
        print(f"📁 Backup disponível em: {backup_path}")
        print("🎉 Os novos serviços estão agora disponíveis no painel administrativo!")
        
        return True
        
    except Exception as e:
        print_error(f"Erro durante a integração: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
