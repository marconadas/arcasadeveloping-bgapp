/**
 * Advanced 3D Visualization for BGAPP
 * Sistema de visualização 3D inspirado no VirES for Swarm (ESA)
 * Integração com Three.js para dados oceanográficos tridimensionais
 */

class ThreeDVisualization {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earthMesh = null;
        this.is3DActive = false;
        this.animationFrame = null;
        this.dataLayers = new Map();
        
        this.loadThreeJSLibrary();
    }

    /**
     * Carrega biblioteca Three.js dinamicamente
     */
    async loadThreeJSLibrary() {
        if (window.THREE) {
            console.log('✅ Three.js já carregado');
            this.initializeControls();
            return;
        }

        try {
            // Carregar Three.js
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
            
            // Carregar controles orbitais
            await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
            
            // Carregar loader de texturas
            await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/TextureLoader.js');
            
            console.log('✅ Three.js carregado com sucesso');
            this.initializeControls();
            
        } catch (error) {
            console.error('❌ Erro ao carregar Three.js:', error);
        }
    }

    /**
     * Carrega script dinamicamente
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializa controles após carregamento
     */
    initializeControls() {
        if (window.THREE) {
            // Configurar controles orbitais
            if (window.THREE.OrbitControls) {
                this.OrbitControls = window.THREE.OrbitControls;
            }
        }
    }

    /**
     * Cria controle de visualização 3D
     */
    create3DControl(map) {
        const control = L.control({ position: 'topright' });
        
        control.onAdd = function() {
            const div = L.DomUtil.create('div', 'threed-control');
            div.innerHTML = `
                <div class="threed-header">
                    <h4>🔮 Vista 3D</h4>
                    <div class="threed-status ${this.is3DActive ? 'active' : 'inactive'}">
                        ${this.is3DActive ? '🔮 3D Ativo' : '🗺️ 2D Ativo'}
                    </div>
                    <button class="threed-toggle-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
                </div>
                <div class="threed-content">
                    <div class="threed-activation">
                        <button class="activate-3d-btn ${this.is3DActive ? 'active' : ''}" 
                                onclick="window.threeDVisualization?.toggle3D()" id="toggle-3d">
                            ${this.is3DActive ? '🗺️ Voltar ao 2D' : '🔮 Ativar Vista 3D'}
                        </button>
                    </div>
                    
                    <div class="threed-options ${this.is3DActive ? '' : 'disabled'}">
                        <div class="visualization-modes">
                            <h5>🌍 Modos de Visualização</h5>
                            <div class="mode-buttons">
                                <button class="mode-btn active" data-mode="globe">🌍 Globo</button>
                                <button class="mode-btn" data-mode="bathymetry">🌊 Batimetria 3D</button>
                                <button class="mode-btn" data-mode="currents">🌀 Correntes 3D</button>
                                <button class="mode-btn" data-mode="temperature">🌡️ Temperatura 3D</button>
                            </div>
                        </div>
                        
                        <div class="data-layers">
                            <h5>📊 Camadas de Dados</h5>
                            <div class="layer-controls">
                                <label class="layer-toggle">
                                    <input type="checkbox" data-layer="bathymetry" checked>
                                    <span>🌊 Relevo Submarino</span>
                                </label>
                                <label class="layer-toggle">
                                    <input type="checkbox" data-layer="currents">
                                    <span>🌀 Correntes Oceânicas</span>
                                </label>
                                <label class="layer-toggle">
                                    <input type="checkbox" data-layer="temperature">
                                    <span>🌡️ Temperatura da Água</span>
                                </label>
                                <label class="layer-toggle">
                                    <input type="checkbox" data-layer="salinity">
                                    <span>🧂 Salinidade</span>
                                </label>
                                <label class="layer-toggle">
                                    <input type="checkbox" data-layer="chlorophyll">
                                    <span>🌿 Clorofila</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="visualization-settings">
                            <h5>⚙️ Configurações</h5>
                            <div class="setting-group">
                                <label>Exageração Vertical:</label>
                                <input type="range" id="vertical-exaggeration" min="1" max="50" value="10">
                                <span id="exaggeration-value">10x</span>
                            </div>
                            <div class="setting-group">
                                <label>Transparência:</label>
                                <input type="range" id="transparency" min="0" max="100" value="80">
                                <span id="transparency-value">80%</span>
                            </div>
                            <div class="setting-group">
                                <label>Qualidade de Renderização:</label>
                                <select id="render-quality">
                                    <option value="low">Baixa (Rápida)</option>
                                    <option value="medium" selected>Média</option>
                                    <option value="high">Alta (Lenta)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="animation-controls">
                            <h5>🎬 Animações</h5>
                            <div class="animation-buttons">
                                <button class="anim-btn" onclick="window.threeDVisualization?.startRotation()">
                                    🔄 Rotação Automática
                                </button>
                                <button class="anim-btn" onclick="window.threeDVisualization?.flyToAngola()">
                                    🎯 Focar em Angola
                                </button>
                                <button class="anim-btn" onclick="window.threeDVisualization?.showTimeAnimation()">
                                    ⏰ Animação Temporal
                                </button>
                            </div>
                        </div>
                        
                        <div class="performance-info">
                            <h5>📈 Performance</h5>
                            <div class="perf-stats">
                                <div class="stat-item">
                                    <span>FPS:</span>
                                    <span id="fps-counter">--</span>
                                </div>
                                <div class="stat-item">
                                    <span>Vértices:</span>
                                    <span id="vertex-count">--</span>
                                </div>
                                <div class="stat-item">
                                    <span>Triangulos:</span>
                                    <span id="triangle-count">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Previne propagação de eventos
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            
            return div;
        }.bind(this);
        
        control.addTo(map);
        
        // Adicionar estilos e eventos
        this.inject3DStyles();
        this.setup3DEvents(map);
        
        return control;
    }

    /**
     * Injeta estilos CSS para visualização 3D
     */
    inject3DStyles() {
        if (document.getElementById('threed-styles')) return;
        
        const styles = `
            <style id="threed-styles">
            .threed-control {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 0;
                min-width: 300px;
                max-width: 350px;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', system-ui, sans-serif;
                transition: all 0.3s ease;
                max-height: 700px;
                overflow: hidden;
            }

            .threed-control.collapsed .threed-content {
                display: none;
            }

            .threed-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .threed-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                flex: 1;
            }

            .threed-status {
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 10px;
                margin: 0 8px;
            }

            .threed-status.active {
                background: rgba(40, 167, 69, 0.3);
            }

            .threed-status.inactive {
                background: rgba(108, 117, 125, 0.3);
            }

            .threed-toggle-btn {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 2px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .threed-toggle-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .threed-content {
                padding: 16px;
                max-height: 620px;
                overflow-y: auto;
            }

            .threed-activation {
                margin-bottom: 16px;
                text-align: center;
            }

            .activate-3d-btn {
                width: 100%;
                padding: 12px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .activate-3d-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
            }

            .activate-3d-btn.active {
                background: linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%);
            }

            .threed-options {
                transition: opacity 0.3s ease;
            }

            .threed-options.disabled {
                opacity: 0.5;
                pointer-events: none;
            }

            .visualization-modes, .data-layers, .visualization-settings, 
            .animation-controls, .performance-info {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e1e8ed;
            }

            .visualization-modes h5, .data-layers h5, .visualization-settings h5,
            .animation-controls h5, .performance-info h5 {
                margin: 0 0 8px 0;
                font-size: 11px;
                font-weight: 600;
                color: #34495e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .mode-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
            }

            .mode-btn {
                padding: 6px 8px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background: white;
                color: #495057;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }

            .mode-btn:hover {
                border-color: #667eea;
                background: #f8f9fa;
            }

            .mode-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .layer-controls {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .layer-toggle {
                display: flex;
                align-items: center;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                padding: 4px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }

            .layer-toggle:hover {
                background: #f8f9fa;
            }

            .layer-toggle input {
                margin-right: 8px;
                transform: scale(0.9);
            }

            .setting-group {
                margin-bottom: 12px;
            }

            .setting-group label {
                display: block;
                font-size: 10px;
                font-weight: 500;
                color: #495057;
                margin-bottom: 4px;
            }

            .setting-group input[type="range"] {
                width: calc(100% - 50px);
                margin-right: 8px;
            }

            .setting-group span {
                font-size: 10px;
                font-weight: 600;
                color: #667eea;
                min-width: 35px;
                display: inline-block;
            }

            .setting-group select {
                width: 100%;
                padding: 4px 6px;
                border: 1px solid #dee2e6;
                border-radius: 3px;
                font-size: 10px;
            }

            .animation-buttons {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .anim-btn {
                width: 100%;
                padding: 6px 10px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                background: white;
                color: #495057;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }

            .anim-btn:hover {
                border-color: #667eea;
                background: #f8f9fa;
                color: #667eea;
            }

            .perf-stats {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
            }

            .stat-item span:first-child {
                color: #6c757d;
                font-weight: 500;
            }

            .stat-item span:last-child {
                color: #667eea;
                font-weight: 600;
                font-family: monospace;
            }

            /* Container 3D */
            #threed-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                background: #000;
                display: none;
            }

            #threed-container.active {
                display: block;
            }

            .threed-overlay {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 10001;
            }

            .threed-overlay h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #667eea;
            }

            .threed-controls {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                padding: 12px 20px;
                border-radius: 25px;
                display: flex;
                gap: 12px;
                z-index: 10001;
            }

            .threed-control-btn {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 12px;
                border-radius: 15px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .threed-control-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: #667eea;
            }

            @media (max-width: 768px) {
                .threed-control {
                    min-width: 250px;
                    max-width: 300px;
                }
                
                .mode-buttons {
                    grid-template-columns: 1fr;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos da visualização 3D
     */
    setup3DEvents(map) {
        // Botões de modo
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const mode = e.target.dataset.mode;
                this.changeVisualizationMode(mode);
            }
        });

        // Checkboxes de camadas
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.layer) {
                const layer = e.target.dataset.layer;
                const enabled = e.target.checked;
                this.toggleDataLayer(layer, enabled);
            }
        });

        // Sliders de configuração
        document.addEventListener('input', (e) => {
            if (e.target.id === 'vertical-exaggeration') {
                document.getElementById('exaggeration-value').textContent = `${e.target.value}x`;
                this.updateVerticalExaggeration(parseFloat(e.target.value));
            } else if (e.target.id === 'transparency') {
                document.getElementById('transparency-value').textContent = `${e.target.value}%`;
                this.updateTransparency(parseFloat(e.target.value) / 100);
            }
        });

        // Seletor de qualidade
        document.addEventListener('change', (e) => {
            if (e.target.id === 'render-quality') {
                this.updateRenderQuality(e.target.value);
            }
        });

        // Tornar disponível globalmente
        window.threeDVisualization = this;
    }

    /**
     * Alterna entre 2D e 3D
     */
    toggle3D() {
        if (!window.THREE) {
            alert('❌ Three.js não está disponível. Verifique a conexão com a internet.');
            return;
        }

        this.is3DActive = !this.is3DActive;

        if (this.is3DActive) {
            this.activate3D();
        } else {
            this.deactivate3D();
        }

        this.update3DInterface();
    }

    /**
     * Ativa visualização 3D
     */
    activate3D() {
        // Criar container 3D
        let container = document.getElementById('threed-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'threed-container';
            container.innerHTML = `
                <div class="threed-overlay">
                    <h4>🔮 Vista 3D - BGAPP</h4>
                    <div>Dados Oceanográficos Tridimensionais</div>
                    <div>Inspirado no VirES for Swarm (ESA)</div>
                </div>
                <div class="threed-controls">
                    <button class="threed-control-btn" onclick="window.threeDVisualization?.resetCamera()">
                        🎯 Reset Câmera
                    </button>
                    <button class="threed-control-btn" onclick="window.threeDVisualization?.toggleWireframe()">
                        🔗 Wireframe
                    </button>
                    <button class="threed-control-btn" onclick="window.threeDVisualization?.takeScreenshot()">
                        📸 Screenshot
                    </button>
                    <button class="threed-control-btn" onclick="window.threeDVisualization?.toggle3D()">
                        🗺️ Voltar 2D
                    </button>
                </div>
            `;
            document.body.appendChild(container);
        }

        container.classList.add('active');

        // Inicializar cena 3D
        this.initializeThreeJS(container);
        this.createEarthVisualization();
        this.startRenderLoop();

        console.log('🔮 Vista 3D ativada');
    }

    /**
     * Desativa visualização 3D
     */
    deactivate3D() {
        const container = document.getElementById('threed-container');
        if (container) {
            container.classList.remove('active');
        }

        // Parar loop de renderização
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Limpar recursos
        this.cleanup3D();

        console.log('🗺️ Voltando para vista 2D');
    }

    /**
     * Inicializa Three.js
     */
    initializeThreeJS(container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);

        // Câmera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Controles orbitais
        if (this.OrbitControls) {
            this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }

        // Iluminação
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-1, 1, 1);
        this.scene.add(directionalLight);

        // Redimensionamento
        window.addEventListener('resize', () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            
            this.camera.aspect = newWidth / newHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(newWidth, newHeight);
        });
    }

    /**
     * Cria visualização da Terra
     */
    createEarthVisualization() {
        // Geometria esférica para a Terra
        const geometry = new THREE.SphereGeometry(1, 64, 32);
        
        // Material básico (será substituído por texturas reais)
        const material = new THREE.MeshPhongMaterial({
            color: 0x2194ce,
            transparent: true,
            opacity: 0.8
        });

        this.earthMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.earthMesh);

        // Adicionar grade de coordenadas
        this.addCoordinateGrid();

        // Adicionar dados de Angola
        this.addAngolaData();
    }

    /**
     * Adiciona grade de coordenadas
     */
    addCoordinateGrid() {
        // Grade de latitude/longitude
        const gridHelper = new THREE.PolarGridHelper(1.01, 16, 8, 64, 0x444444, 0x222222);
        gridHelper.rotateX(Math.PI / 2);
        this.scene.add(gridHelper);

        // Eixos de coordenadas
        const axesHelper = new THREE.AxesHelper(1.5);
        this.scene.add(axesHelper);
    }

    /**
     * Adiciona dados específicos de Angola
     */
    addAngolaData() {
        // Posição aproximada de Angola na esfera
        const angolaLat = -12.5; // Latitude média de Angola
        const angolaLon = 13.5;  // Longitude média de Angola

        // Converter lat/lon para coordenadas cartesianas
        const phi = (90 - angolaLat) * (Math.PI / 180);
        const theta = (angolaLon + 180) * (Math.PI / 180);

        const x = -(1.02 * Math.sin(phi) * Math.cos(theta));
        const z = (1.02 * Math.sin(phi) * Math.sin(theta));
        const y = (1.02 * Math.cos(phi));

        // Marcador para Angola
        const markerGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const angolaMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        angolaMarker.position.set(x, y, z);
        this.scene.add(angolaMarker);

        // Label para Angola (simulado)
        console.log('🇦🇴 Marcador de Angola adicionado à visualização 3D');
    }

    /**
     * Inicia loop de renderização
     */
    startRenderLoop() {
        const animate = () => {
            this.animationFrame = requestAnimationFrame(animate);

            // Atualizar controles
            if (this.controls) {
                this.controls.update();
            }

            // Renderizar cena
            this.renderer.render(this.scene, this.camera);

            // Atualizar estatísticas de performance
            this.updatePerformanceStats();
        };

        animate();
    }

    /**
     * Atualiza estatísticas de performance
     */
    updatePerformanceStats() {
        if (!this.renderer) return;

        const info = this.renderer.info;
        
        const fpsElement = document.getElementById('fps-counter');
        const vertexElement = document.getElementById('vertex-count');
        const triangleElement = document.getElementById('triangle-count');

        if (fpsElement) fpsElement.textContent = '60'; // Simplificado
        if (vertexElement) vertexElement.textContent = info.render.vertices?.toLocaleString() || '--';
        if (triangleElement) triangleElement.textContent = info.render.triangles?.toLocaleString() || '--';
    }

    /**
     * Muda modo de visualização
     */
    changeVisualizationMode(mode) {
        if (!this.earthMesh) return;

        switch (mode) {
            case 'globe':
                this.earthMesh.material.color.setHex(0x2194ce);
                break;
            case 'bathymetry':
                this.earthMesh.material.color.setHex(0x1a237e);
                break;
            case 'currents':
                this.earthMesh.material.color.setHex(0x00bcd4);
                break;
            case 'temperature':
                this.earthMesh.material.color.setHex(0xff5722);
                break;
        }

        console.log(`🔄 Modo de visualização alterado para: ${mode}`);
    }

    /**
     * Alterna camada de dados
     */
    toggleDataLayer(layer, enabled) {
        console.log(`${enabled ? '✅' : '❌'} Camada ${layer} ${enabled ? 'ativada' : 'desativada'}`);
        
        // Implementação específica para cada camada seria adicionada aqui
        if (enabled) {
            this.dataLayers.set(layer, { active: true });
        } else {
            this.dataLayers.delete(layer);
        }
    }

    /**
     * Atualiza exageração vertical
     */
    updateVerticalExaggeration(value) {
        console.log(`📏 Exageração vertical: ${value}x`);
        // Implementar mudança na geometria
    }

    /**
     * Atualiza transparência
     */
    updateTransparency(value) {
        if (this.earthMesh && this.earthMesh.material) {
            this.earthMesh.material.opacity = value;
        }
        console.log(`👻 Transparência: ${(value * 100).toFixed(0)}%`);
    }

    /**
     * Atualiza qualidade de renderização
     */
    updateRenderQuality(quality) {
        if (!this.renderer) return;

        const qualitySettings = {
            low: { pixelRatio: 0.5, antialias: false },
            medium: { pixelRatio: 1, antialias: true },
            high: { pixelRatio: window.devicePixelRatio, antialias: true }
        };

        const settings = qualitySettings[quality];
        this.renderer.setPixelRatio(settings.pixelRatio);
        
        console.log(`🎨 Qualidade de renderização: ${quality}`);
    }

    /**
     * Inicia rotação automática
     */
    startRotation() {
        if (!this.earthMesh) return;

        const rotateEarth = () => {
            if (this.earthMesh && this.is3DActive) {
                this.earthMesh.rotation.y += 0.005;
                requestAnimationFrame(rotateEarth);
            }
        };
        
        rotateEarth();
        console.log('🔄 Rotação automática iniciada');
    }

    /**
     * Foca câmera em Angola
     */
    flyToAngola() {
        if (!this.camera || !this.controls) return;

        // Animação suave da câmera para Angola
        const targetPosition = new THREE.Vector3(0, 0, 2);
        
        // Implementação simplificada
        this.camera.position.lerp(targetPosition, 0.1);
        
        console.log('🎯 Focando em Angola');
    }

    /**
     * Mostra animação temporal
     */
    showTimeAnimation() {
        console.log('⏰ Animação temporal iniciada');
        alert('🎬 Animação temporal será implementada com dados reais de séries temporais oceanográficas');
    }

    /**
     * Reset da câmera
     */
    resetCamera() {
        if (this.camera) {
            this.camera.position.set(0, 0, 3);
            this.camera.lookAt(0, 0, 0);
        }
        console.log('🎯 Câmera resetada');
    }

    /**
     * Alterna wireframe
     */
    toggleWireframe() {
        if (this.earthMesh && this.earthMesh.material) {
            this.earthMesh.material.wireframe = !this.earthMesh.material.wireframe;
        }
        console.log('🔗 Wireframe alternado');
    }

    /**
     * Captura screenshot
     */
    takeScreenshot() {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;
        const link = document.createElement('a');
        link.download = `bgapp_3d_screenshot_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        console.log('📸 Screenshot capturado');
    }

    /**
     * Atualiza interface 3D
     */
    update3DInterface() {
        const toggleBtn = document.getElementById('toggle-3d');
        const status = document.querySelector('.threed-status');
        const options = document.querySelector('.threed-options');

        if (toggleBtn) {
            toggleBtn.textContent = this.is3DActive ? '🗺️ Voltar ao 2D' : '🔮 Ativar Vista 3D';
            toggleBtn.classList.toggle('active', this.is3DActive);
        }

        if (status) {
            status.textContent = this.is3DActive ? '🔮 3D Ativo' : '🗺️ 2D Ativo';
            status.classList.toggle('active', this.is3DActive);
            status.classList.toggle('inactive', !this.is3DActive);
        }

        if (options) {
            options.classList.toggle('disabled', !this.is3DActive);
        }
    }

    /**
     * Limpa recursos 3D
     */
    cleanup3D() {
        if (this.scene) {
            // Limpar geometrias e materiais
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        // Limpar referências
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earthMesh = null;
    }
}

// Exporta para uso global
window.ThreeDVisualization = ThreeDVisualization;

console.log('✅ 3D Visualization carregado e pronto para uso');
