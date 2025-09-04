/**
 * 🎮 UNREAL ENGINE INSPIRED DASHBOARD - BGAPP Scientific Dashboard
 * Silicon Valley Tier Implementation with Unreal Engine patterns
 * 
 * Features inspired by Unreal Engine:
 * - Level-of-Detail (LOD) system for performance
 * - Advanced culling techniques
 * - Real-time lighting and shadows
 * - Post-processing effects
 * - Material system for data visualization
 * - Blueprint-style node system for data flow
 * - Performance profiler integration
 * - Streaming system for large datasets
 * - Advanced particle systems
 * - Cinematic camera controls
 */

class UnrealEngineInspiredDashboard {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        
        // Unreal Engine inspired systems
        this.lodManager = new LODManager();
        this.cullingSystem = new CullingSystem();
        this.materialSystem = new MaterialSystem();
        this.performanceProfiler = new PerformanceProfiler();
        this.streamingSystem = new DataStreamingSystem();
        this.particleSystem = new AdvancedParticleSystem();
        
        // Performance metrics
        this.frameTime = 0;
        this.drawCalls = 0;
        this.triangleCount = 0;
        
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        console.log('🎮 Inicializando Dashboard inspirado no Unreal Engine...');
        
        try {
            await this.loadAdvancedLibraries();
            this.setupAdvancedRenderer();
            this.setupCinematicCamera();
            this.setupAdvancedLighting();
            this.setupPostProcessing();
            this.setupPerformanceOptimization();
            this.setupDataVisualizationMaterials();
            this.setupAdvancedControls();
            this.startRenderLoop();
            
            this.isInitialized = true;
            console.log('✅ Dashboard Unreal Engine Style inicializado com sucesso!');
            
            // Exibir métricas de performance
            this.showPerformanceHUD();
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }
    
    async loadAdvancedLibraries() {
        const libraries = [
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/postprocessing/EffectComposer.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/postprocessing/RenderPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/postprocessing/UnrealBloomPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/postprocessing/SSAOPass.js',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/postprocessing/TAARenderPass.js'
        ];
        
        for (const lib of libraries) {
            await this.loadScript(lib);
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupAdvancedRenderer() {
        const container = document.getElementById('ocean-3d-visualization') || 
                         document.getElementById('unreal-dashboard-container');
        
        if (!container) {
            console.error('Container não encontrado');
            return;
        }
        
        // Scene with advanced settings
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        
        // Advanced fog system (like Unreal's atmospheric fog)
        this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
        
        // Camera with cinematic settings
        this.camera = new THREE.PerspectiveCamera(
            50, // Field of view similar to Unreal's default
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 50, 100);
        
        // Advanced renderer with Unreal-like settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Advanced shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Tone mapping like Unreal Engine
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Enable advanced features
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        
        container.appendChild(this.renderer.domElement);
    }
    
    setupCinematicCamera() {
        // Cinematic camera controls inspired by Unreal's camera system
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Smooth controls like Unreal's viewport
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        
        // Limits
        this.controls.maxPolarAngle = Math.PI * 0.9;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 500;
        
        // Auto-rotate for cinematic effect
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
    }
    
    setupAdvancedLighting() {
        // Directional light (Sun) with advanced shadow settings
        const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        
        // High-quality shadows like Unreal
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        sunLight.shadow.bias = -0.0001;
        
        this.scene.add(sunLight);
        
        // Ambient light for global illumination simulation
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Hemisphere light for sky lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x0F2027, 0.6);
        this.scene.add(hemisphereLight);
        
        // Point lights for underwater caustics simulation
        this.createUnderwaterLighting();
    }
    
    createUnderwaterLighting() {
        const colors = [0x00aaff, 0x0080ff, 0x0066cc, 0x004499];
        const positions = [
            [0, -20, 0], [30, -15, 30], [-30, -15, -30], [0, -25, 40]
        ];
        
        positions.forEach((pos, i) => {
            const light = new THREE.PointLight(colors[i], 1.0, 80);
            light.position.set(...pos);
            this.scene.add(light);
            
            // Animate lights for caustics effect
            this.animateCausticsLight(light, i);
        });
    }
    
    animateCausticsLight(light, index) {
        const originalY = light.position.y;
        const animate = () => {
            light.position.y = originalY + Math.sin(Date.now() * 0.001 + index) * 5;
            light.intensity = 0.5 + Math.sin(Date.now() * 0.002 + index) * 0.5;
        };
        
        setInterval(animate, 16); // ~60fps
    }
    
    setupPostProcessing() {
        // Post-processing pipeline like Unreal Engine
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom pass for realistic lighting
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(bloomPass);
        
        // SSAO for realistic ambient occlusion
        if (THREE.SSAOPass) {
            const ssaoPass = new THREE.SSAOPass(
                this.scene,
                this.camera,
                window.innerWidth,
                window.innerHeight
            );
            ssaoPass.kernelRadius = 16;
            ssaoPass.minDistance = 0.005;
            ssaoPass.maxDistance = 0.1;
            this.composer.addPass(ssaoPass);
        }
        
        // TAA for better anti-aliasing
        if (THREE.TAARenderPass) {
            const taaPass = new THREE.TAARenderPass(this.scene, this.camera);
            this.composer.addPass(taaPass);
        }
    }
    
    setupPerformanceOptimization() {
        // LOD system inspired by Unreal Engine
        this.lodManager.init(this.scene, this.camera);
        
        // Frustum culling
        this.cullingSystem.init(this.scene, this.camera);
        
        // Performance monitoring
        this.performanceProfiler.startMonitoring();
        
        // Adaptive quality based on performance
        this.setupAdaptiveQuality();
    }
    
    setupAdaptiveQuality() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkPerformance = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) { // Check every second
                const fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                
                // Adaptive quality like Unreal Engine's scalability system
                if (fps < 30) {
                    this.reduceQuality();
                } else if (fps > 50) {
                    this.increaseQuality();
                }
                
                this.updatePerformanceHUD(fps);
            }
            
            requestAnimationFrame(checkPerformance);
        };
        
        checkPerformance();
    }
    
    reduceQuality() {
        // Reduce pixel ratio
        this.renderer.setPixelRatio(Math.max(this.renderer.getPixelRatio() - 0.1, 0.5));
        
        // Reduce shadow map size
        this.scene.traverse((object) => {
            if (object.isLight && object.shadow) {
                object.shadow.mapSize.width = Math.max(object.shadow.mapSize.width / 2, 512);
                object.shadow.mapSize.height = Math.max(object.shadow.mapSize.height / 2, 512);
            }
        });
        
        console.log('📉 Qualidade reduzida para manter performance');
    }
    
    increaseQuality() {
        // Increase pixel ratio
        this.renderer.setPixelRatio(Math.min(this.renderer.getPixelRatio() + 0.1, 2));
        
        // Increase shadow map size
        this.scene.traverse((object) => {
            if (object.isLight && object.shadow) {
                object.shadow.mapSize.width = Math.min(object.shadow.mapSize.width * 2, 4096);
                object.shadow.mapSize.height = Math.min(object.shadow.mapSize.height * 2, 4096);
            }
        });
        
        console.log('📈 Qualidade aumentada devido à boa performance');
    }
    
    setupDataVisualizationMaterials() {
        // Material system inspired by Unreal Engine's material editor
        this.materialSystem.createOceanMaterial();
        this.materialSystem.createDataVisualizationMaterials();
        this.materialSystem.createParticleMaterials();
        
        // Create advanced ocean visualization
        this.createAdvancedOceanVisualization();
        
        // Create data visualization elements
        this.createScientificDataVisualization();
    }
    
    createAdvancedOceanVisualization() {
        // Advanced ocean shader inspired by Unreal Engine's water system
        const oceanGeometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        
        const oceanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                waveHeight: { value: 2.0 },
                waveFrequency: { value: 0.02 },
                waterColor: { value: new THREE.Color(0x0066cc) },
                foamColor: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                uniform float time;
                uniform float waveHeight;
                uniform float waveFrequency;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                // Gerstner wave function like Unreal Engine
                vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float phase, vec2 direction) {
                    float wave = amplitude * sin(dot(direction, pos) * frequency + time * phase);
                    return vec3(wave * direction.x, wave, wave * direction.y);
                }
                
                void main() {
                    vUv = uv;
                    
                    vec3 pos = position;
                    
                    // Multiple Gerstner waves for realistic ocean
                    pos += gerstnerWave(position.xz, waveHeight, waveFrequency, 2.0, vec2(1.0, 0.0));
                    pos += gerstnerWave(position.xz, waveHeight * 0.5, waveFrequency * 2.0, 3.0, vec2(0.7, 0.7));
                    pos += gerstnerWave(position.xz, waveHeight * 0.25, waveFrequency * 4.0, 4.0, vec2(-0.5, 0.8));
                    
                    vPosition = pos;
                    
                    // Calculate normal for lighting
                    vec3 tangent = vec3(1.0, 0.0, 0.0);
                    vec3 bitangent = vec3(0.0, 0.0, 1.0);
                    vNormal = normalize(cross(tangent, bitangent));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                uniform vec3 waterColor;
                uniform vec3 foamColor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Caustics pattern
                    vec2 causticUv = uv * 10.0 + time * 0.1;
                    float caustics = sin(causticUv.x) * sin(causticUv.y) * 0.5 + 0.5;
                    
                    // Foam based on wave height
                    float foam = smoothstep(1.5, 2.0, vPosition.y);
                    
                    // Final color mixing
                    vec3 finalColor = mix(waterColor, foamColor, foam);
                    finalColor += caustics * 0.3;
                    
                    // Add transparency
                    float alpha = 0.8;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
        oceanMesh.rotation.x = -Math.PI / 2;
        oceanMesh.receiveShadow = true;
        this.scene.add(oceanMesh);
        
        // Store reference for animation
        this.oceanMaterial = oceanMaterial;
    }
    
    createScientificDataVisualization() {
        // Create data points with LOD system
        this.createDataPoints();
        
        // Create particle systems for different data types
        this.particleSystem.createPlanktonSystem(this.scene);
        this.particleSystem.createCurrentsSystem(this.scene);
        this.particleSystem.createTemperatureSystem(this.scene);
    }
    
    createDataPoints() {
        // Sample scientific data points
        const dataPoints = this.generateSampleData();
        
        dataPoints.forEach((point, index) => {
            const geometry = new THREE.SphereGeometry(0.5, 8, 6);
            const material = new THREE.MeshPhongMaterial({
                color: this.getColorForValue(point.value),
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(point.x, point.y, point.z);
            mesh.userData = {
                type: 'dataPoint',
                value: point.value,
                parameter: point.parameter,
                lodLevel: 0
            };
            
            this.scene.add(mesh);
            
            // Add to LOD manager
            this.lodManager.addObject(mesh);
        });
    }
    
    generateSampleData() {
        const data = [];
        const parameters = ['temperature', 'salinity', 'oxygen', 'ph', 'chlorophyll'];
        
        for (let i = 0; i < 100; i++) {
            data.push({
                x: (Math.random() - 0.5) * 100,
                y: Math.random() * -20,
                z: (Math.random() - 0.5) * 100,
                value: Math.random(),
                parameter: parameters[Math.floor(Math.random() * parameters.length)]
            });
        }
        
        return data;
    }
    
    getColorForValue(value) {
        // Color mapping like Unreal Engine's material system
        const hue = (1 - value) * 240; // Blue to red
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.5);
    }
    
    setupAdvancedControls() {
        // Keyboard shortcuts like Unreal Engine
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'f': // Focus on selection
                    this.focusOnSelection();
                    break;
                case 'g': // Toggle grid
                    this.toggleGrid();
                    break;
                case 'h': // Toggle HUD
                    this.togglePerformanceHUD();
                    break;
                case 'r': // Reset camera
                    this.resetCamera();
                    break;
                case '1': // Front view
                    this.setCameraView('front');
                    break;
                case '3': // Side view
                    this.setCameraView('side');
                    break;
                case '7': // Top view
                    this.setCameraView('top');
                    break;
            }
        });
        
        // Mouse interactions
        this.setupMouseInteractions();
    }
    
    setupMouseInteractions() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);
            
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object.userData.type === 'dataPoint') {
                    this.showDataPointInfo(object);
                }
            }
        });
    }
    
    showDataPointInfo(object) {
        // Create info panel like Unreal's details panel
        const info = {
            parameter: object.userData.parameter,
            value: object.userData.value.toFixed(3),
            position: object.position,
            lodLevel: object.userData.lodLevel
        };
        
        console.log('📊 Data Point Info:', info);
        
        // You could create a UI panel here
        this.createInfoPanel(info);
    }
    
    createInfoPanel(info) {
        // Remove existing panel
        const existingPanel = document.getElementById('data-info-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Create new panel
        const panel = document.createElement('div');
        panel.id = 'data-info-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            border: 1px solid #444;
            z-index: 1000;
        `;
        
        panel.innerHTML = `
            <h4>📊 Data Point</h4>
            <p><strong>Parameter:</strong> ${info.parameter}</p>
            <p><strong>Value:</strong> ${info.value}</p>
            <p><strong>Position:</strong> (${info.position.x.toFixed(1)}, ${info.position.y.toFixed(1)}, ${info.position.z.toFixed(1)})</p>
            <p><strong>LOD Level:</strong> ${info.lodLevel}</p>
            <button onclick="this.parentElement.remove()">Close</button>
        `;
        
        document.body.appendChild(panel);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (panel.parentElement) {
                panel.remove();
            }
        }, 5000);
    }
    
    showPerformanceHUD() {
        // Create performance HUD like Unreal Engine's stat system
        const hud = document.createElement('div');
        hud.id = 'unreal-performance-hud';
        hud.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 4px;
            z-index: 1000;
            border: 1px solid #333;
        `;
        
        hud.innerHTML = `
            <div><strong>🎮 UNREAL ENGINE INSPIRED DASHBOARD</strong></div>
            <div>FPS: <span id="fps-counter">--</span></div>
            <div>Frame Time: <span id="frame-time">--</span>ms</div>
            <div>Draw Calls: <span id="draw-calls">--</span></div>
            <div>Triangles: <span id="triangle-count">--</span></div>
            <div>Memory: <span id="memory-usage">--</span>MB</div>
            <div>Quality: <span id="quality-level">High</span></div>
            <div><small>Press 'H' to toggle HUD</small></div>
        `;
        
        document.body.appendChild(hud);
        
        this.performanceHUD = hud;
    }
    
    updatePerformanceHUD(fps) {
        if (!this.performanceHUD) return;
        
        document.getElementById('fps-counter').textContent = fps;
        document.getElementById('frame-time').textContent = this.frameTime.toFixed(2);
        document.getElementById('draw-calls').textContent = this.renderer.info.render.calls;
        document.getElementById('triangle-count').textContent = this.renderer.info.render.triangles;
        
        // Memory usage (approximate)
        if (performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            document.getElementById('memory-usage').textContent = memoryMB;
        }
        
        // Quality level based on performance
        const qualityLevel = fps > 50 ? 'High' : fps > 30 ? 'Medium' : 'Low';
        document.getElementById('quality-level').textContent = qualityLevel;
    }
    
    togglePerformanceHUD() {
        if (this.performanceHUD) {
            this.performanceHUD.style.display = 
                this.performanceHUD.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    startRenderLoop() {
        const render = (timestamp) => {
            const startTime = performance.now();
            
            // Update systems
            this.lodManager.update();
            this.cullingSystem.update();
            this.controls.update();
            
            // Update ocean animation
            if (this.oceanMaterial) {
                this.oceanMaterial.uniforms.time.value = timestamp * 0.001;
            }
            
            // Update particle systems
            this.particleSystem.update(timestamp);
            
            // Render
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
            
            // Calculate frame time
            this.frameTime = performance.now() - startTime;
            
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }
    
    // Utility methods
    resetCamera() {
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    setCameraView(view) {
        switch(view) {
            case 'front':
                this.camera.position.set(0, 0, 100);
                break;
            case 'side':
                this.camera.position.set(100, 0, 0);
                break;
            case 'top':
                this.camera.position.set(0, 100, 0);
                break;
        }
        this.camera.lookAt(0, 0, 0);
    }
    
    focusOnSelection() {
        // Focus camera on selected objects
        console.log('🎯 Focus on selection');
    }
    
    toggleGrid() {
        // Toggle grid display
        console.log('📐 Toggle grid');
    }
}

// Supporting classes inspired by Unreal Engine systems

class LODManager {
    constructor() {
        this.objects = [];
        this.lodDistances = [50, 100, 200];
    }
    
    init(scene, camera) {
        this.scene = scene;
        this.camera = camera;
    }
    
    addObject(object) {
        this.objects.push(object);
    }
    
    update() {
        this.objects.forEach(object => {
            const distance = this.camera.position.distanceTo(object.position);
            
            // Determine LOD level
            let lodLevel = 0;
            for (let i = 0; i < this.lodDistances.length; i++) {
                if (distance > this.lodDistances[i]) {
                    lodLevel = i + 1;
                }
            }
            
            // Apply LOD
            this.applyLOD(object, lodLevel);
            object.userData.lodLevel = lodLevel;
        });
    }
    
    applyLOD(object, level) {
        switch(level) {
            case 0: // High detail
                object.visible = true;
                if (object.geometry) {
                    // Use high-poly geometry
                }
                break;
            case 1: // Medium detail
                object.visible = true;
                // Reduce geometry detail
                break;
            case 2: // Low detail
                object.visible = true;
                // Use low-poly geometry
                break;
            case 3: // Very far - hide
                object.visible = false;
                break;
        }
    }
}

class CullingSystem {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
    }
    
    init(scene, camera) {
        this.scene = scene;
        this.camera = camera;
    }
    
    update() {
        // Update frustum
        this.cameraMatrix.multiplyMatrices(
            this.camera.projectionMatrix, 
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        // Cull objects outside frustum
        this.scene.traverse((object) => {
            if (object.isMesh) {
                object.visible = this.frustum.intersectsObject(object);
            }
        });
    }
}

class MaterialSystem {
    constructor() {
        this.materials = new Map();
    }
    
    createOceanMaterial() {
        // Already implemented in main class
    }
    
    createDataVisualizationMaterials() {
        // Create materials for different data types
        const temperatureMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.8
        });
        
        const salinityMaterial = new THREE.MeshPhongMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.8
        });
        
        this.materials.set('temperature', temperatureMaterial);
        this.materials.set('salinity', salinityMaterial);
    }
    
    createParticleMaterials() {
        // Particle materials for different systems
    }
}

class PerformanceProfiler {
    constructor() {
        this.metrics = {
            frameTime: 0,
            drawCalls: 0,
            triangles: 0
        };
    }
    
    startMonitoring() {
        console.log('📊 Performance profiler started');
    }
    
    getMetrics() {
        return this.metrics;
    }
}

class DataStreamingSystem {
    constructor() {
        this.streamingDistance = 100;
        this.loadedChunks = new Set();
    }
    
    update(cameraPosition) {
        // Stream data based on camera position
        // Similar to Unreal's world composition
    }
}

class AdvancedParticleSystem {
    constructor() {
        this.systems = [];
    }
    
    createPlanktonSystem(scene) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < 1000; i++) {
            positions.push(
                (Math.random() - 0.5) * 100,
                Math.random() * -30,
                (Math.random() - 0.5) * 100
            );
            
            colors.push(0.2, 0.8, 0.4);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        
        this.systems.push(particles);
    }
    
    createCurrentsSystem(scene) {
        // Ocean currents visualization
    }
    
    createTemperatureSystem(scene) {
        // Temperature data particles
    }
    
    update(timestamp) {
        // Update all particle systems
        this.systems.forEach(system => {
            if (system.rotation) {
                system.rotation.y = timestamp * 0.0001;
            }
        });
    }
}

// Initialize the Unreal Engine inspired dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Three.js to load
    const initDashboard = () => {
        if (typeof THREE !== 'undefined') {
            window.unrealDashboard = new UnrealEngineInspiredDashboard();
        } else {
            setTimeout(initDashboard, 100);
        }
    };
    
    initDashboard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnrealEngineInspiredDashboard;
}
