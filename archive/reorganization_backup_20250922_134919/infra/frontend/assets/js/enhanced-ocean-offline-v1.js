/**
 * 🌊 ENHANCED OCEAN OFFLINE V1.0 - BGAPP
 * Versão offline completa dos shaders oceânicos melhorados
 * Integração com arquitetura existente da aplicação
 * 
 * CARACTERÍSTICAS:
 * ✅ Funciona completamente offline
 * ✅ Não depende de CDNs externos
 * ✅ Integração com estrutura Cloudflare Pages
 * ✅ Compatible com wrangler deploy
 * ✅ Cache-friendly para edge computing
 */

// Verificar se Three.js está disponível
if (typeof THREE === 'undefined') {
    console.warn('⚠️ Three.js não disponível, carregando fallback...');
    
    // Criar um mini Three.js mock para fallback
    window.THREE = {
        Scene: function() { this.add = () => {}; this.background = null; },
        PerspectiveCamera: function() { this.position = {set: () => {}}; this.aspect = 1; this.updateProjectionMatrix = () => {}; },
        WebGLRenderer: function() { 
            this.setSize = () => {}; 
            this.setClearColor = () => {}; 
            this.render = () => {}; 
            this.domElement = document.createElement('canvas');
            this.info = { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } };
        },
        PlaneGeometry: function() {},
        MeshLambertMaterial: function(props) { Object.assign(this, props); },
        ShaderMaterial: function(props) { Object.assign(this, props); this.uniforms = props.uniforms || {}; },
        Mesh: function(geo, mat) { this.rotation = {x: 0}; this.material = mat; },
        AmbientLight: function() {},
        DirectionalLight: function() { this.position = {set: () => {}}; },
        Color: function(color) { this.color = color; },
        Vector2: function(x, y) { this.x = x; this.y = y; },
        Vector3: function(x, y, z) { this.x = x; this.y = y; this.z = z; },
        DoubleSide: 2,
        Clock: function() { this.getElapsedTime = () => Date.now() * 0.001; }
    };
}

class EnhancedOceanOffline {
    constructor(options = {}) {
        this.options = {
            quality: 'auto',
            enableAdvancedShaders: true,
            enableCaustics: true,
            enableFoam: true,
            enableSubsurface: true,
            fallbackMode: false,
            offlineMode: true,
            ...options
        };
        
        // Estado do sistema
        this.isInitialized = false;
        this.currentQuality = 'medium';
        this.hasWebGL = false;
        this.shaderCompilationSupported = false;
        
        // Shaders offline (embutidos)
        this.vertexShader = '';
        this.fragmentShader = '';
        
        // Performance metrics
        this.performanceMetrics = {
            fps: 60,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('🌊 Inicializando Enhanced Ocean Offline V1.0...');
        
        try {
            // Verificações básicas
            this.checkWebGLSupport();
            this.determineOptimalQuality();
            this.loadOfflineShaders();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Ocean Offline inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização offline:', error);
            this.enableFallbackMode();
        }
    }
    
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (gl) {
            this.hasWebGL = true;
            console.log('✅ WebGL suportado (offline)');
            
            // Teste básico de compilação de shader
            try {
                const testVertex = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(testVertex, `
                    attribute vec3 position;
                    void main() {
                        gl_Position = vec4(position, 1.0);
                    }
                `);
                gl.compileShader(testVertex);
                
                if (gl.getShaderParameter(testVertex, gl.COMPILE_STATUS)) {
                    this.shaderCompilationSupported = true;
                    console.log('✅ Compilação de shaders suportada');
                }
            } catch (e) {
                console.warn('⚠️ Compilação de shaders limitada');
            }
        } else {
            console.warn('⚠️ WebGL não suportado, usando fallback');
            this.hasWebGL = false;
        }
    }
    
    determineOptimalQuality() {
        // Detecção baseada em características do dispositivo
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
        
        if (!this.hasWebGL || !this.shaderCompilationSupported) {
            this.currentQuality = 'basic';
        } else if (isMobile && !isTablet) {
            this.currentQuality = 'low';
        } else if (navigator.hardwareConcurrency >= 4) {
            this.currentQuality = 'high';
        } else {
            this.currentQuality = 'medium';
        }
        
        console.log(`🎯 Qualidade determinada (offline): ${this.currentQuality}`);
    }
    
    loadOfflineShaders() {
        switch (this.currentQuality) {
            case 'basic':
                this.loadBasicOfflineShaders();
                break;
            case 'low':
                this.loadLowOfflineShaders();
                break;
            case 'medium':
                this.loadMediumOfflineShaders();
                break;
            case 'high':
                this.loadHighOfflineShaders();
                break;
            default:
                this.loadMediumOfflineShaders();
        }
    }
    
    loadBasicOfflineShaders() {
        // Shaders mais simples possíveis para máxima compatibilidade
        this.vertexShader = `
            uniform float time;
            
            varying vec2 vUv;
            varying float vWave;
            
            void main() {
                vUv = uv;
                
                vec3 pos = position;
                
                // Onda simples
                float wave = sin(pos.x * 0.5 + time * 2.0) * 0.3;
                pos.y += wave;
                vWave = wave;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            precision mediump float;
            
            uniform float time;
            uniform vec3 waterColor;
            
            varying vec2 vUv;
            varying float vWave;
            
            void main() {
                vec3 color = waterColor;
                
                // Variação simples baseada na onda
                float intensity = 0.8 + vWave * 0.2;
                color *= intensity;
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }
    
    loadLowOfflineShaders() {
        // Shaders otimizados para mobile
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vElevation;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Duas ondas simples
                float wave1 = sin(pos.x * 0.3 + time * 1.5) * waveHeight;
                float wave2 = sin(pos.z * 0.4 + time * 1.8) * waveHeight * 0.6;
                
                pos.y += wave1 + wave2;
                vPosition = pos;
                vElevation = pos.y;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            precision mediump float;
            
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying float vElevation;
            
            void main() {
                // Cor baseada na elevação
                float depth = clamp((vElevation + 2.0) / 4.0, 0.0, 1.0);
                vec3 color = mix(deepColor, waterColor, depth);
                
                // Efeito simples de movimento
                float movement = sin(vPosition.x * 0.1 + time) * 0.1;
                color += movement;
                
                gl_FragColor = vec4(color, 0.85);
            }
        `;
    }
    
    loadMediumOfflineShaders() {
        // Shaders equilibrados para desktop
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            
            // Função Gerstner simplificada
            vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float phase, vec2 direction) {
                float k = frequency * 6.28318;
                float c = sqrt(9.8 / k);
                vec2 d = normalize(direction);
                float f = k * (dot(d, pos) - c * time * phase);
                float a = amplitude / k;
                
                return vec3(
                    d.x * (a * cos(f)),
                    a * sin(f),
                    d.y * (a * cos(f))
                );
            }
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Múltiplas ondas Gerstner
                pos += gerstnerWave(position.xz, waveHeight, waveFrequency, 1.0, vec2(1.0, 0.0));
                pos += gerstnerWave(position.xz, waveHeight * 0.7, waveFrequency * 1.5, 1.3, vec2(0.8, 0.6));
                pos += gerstnerWave(position.xz, waveHeight * 0.4, waveFrequency * 2.2, 1.7, vec2(-0.4, 0.9));
                
                vPosition = pos;
                vElevation = pos.y;
                
                // Normal aproximada
                vNormal = normalize(vec3(0.0, 1.0, 0.0));
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            precision mediump float;
            
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepColor;
            uniform vec3 foamColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            
            void main() {
                vec3 normal = normalize(vNormal);
                
                // Cor baseada na profundidade
                float depth = clamp((vElevation + 3.0) / 6.0, 0.0, 1.0);
                vec3 color = mix(deepColor, waterColor, depth);
                
                // Espuma nas cristas
                float foam = smoothstep(1.0, 1.5, vElevation);
                color = mix(color, foamColor, foam * 0.6);
                
                // Caustics simples
                float caustics = sin(vPosition.x * 0.2 + time) * sin(vPosition.z * 0.3 + time * 1.1);
                caustics = max(0.0, caustics) * 0.15;
                color += caustics;
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }
    
    loadHighOfflineShaders() {
        // Shaders avançados para hardware moderno
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform vec2 windDirection;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            varying vec3 vWorldPosition;
            
            // Hash para ruído
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            // Ruído suave
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                          mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }
            
            // Gerstner Wave avançada
            vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float phase, vec2 direction, float steepness) {
                float k = frequency * 6.28318;
                float c = sqrt(9.8 / k);
                vec2 d = normalize(direction);
                float f = k * (dot(d, pos) - c * time * phase);
                float a = steepness / k;
                
                // Influência do vento
                float windInfluence = dot(d, normalize(windDirection)) * 0.3;
                a *= (1.0 + windInfluence);
                
                return vec3(
                    d.x * (a * cos(f)),
                    a * sin(f),
                    d.y * (a * cos(f))
                );
            }
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Sistema de ondas multicamadas
                vec3 waveDisplacement = vec3(0.0);
                
                waveDisplacement += gerstnerWave(position.xz, waveHeight, waveFrequency, 1.0, vec2(1.0, 0.0), 0.4);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.7, waveFrequency * 1.6, 1.2, vec2(0.8, 0.6), 0.3);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.5, waveFrequency * 2.3, 1.7, vec2(-0.4, 0.9), 0.25);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.3, waveFrequency * 3.8, 2.1, vec2(0.6, -0.8), 0.2);
                
                // Ruído para variação
                float noiseValue = noise(position.xz * 0.05 + time * 0.1) * waveHeight * 0.1;
                waveDisplacement.y += noiseValue;
                
                pos += waveDisplacement;
                
                vPosition = pos;
                vElevation = pos.y;
                vWorldPosition = pos;
                
                // Normal aproximada
                vNormal = normalize(vec3(0.0, 1.0, 0.0));
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            precision mediump float;
            
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepColor;
            uniform vec3 foamColor;
            uniform vec3 skyColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            varying vec3 vWorldPosition;
            
            // Hash para ruído
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            // Ruído suave
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                          mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }
            
            void main() {
                vec3 normal = normalize(vNormal);
                
                // Fresnel effect simplificado
                float fresnel = 0.2 + 0.8 * pow(1.0 - abs(normal.y), 2.0);
                
                // Cor baseada na profundidade
                float depth = clamp((vElevation + 5.0) / 10.0, 0.0, 1.0);
                vec3 baseColor = mix(deepColor, waterColor, depth);
                
                // Espuma avançada
                float foam = smoothstep(1.2, 2.0, vElevation);
                float foamNoise = noise(vWorldPosition.xz * 8.0 + time * 2.0);
                foam *= foamNoise;
                baseColor = mix(baseColor, foamColor, foam * 0.8);
                
                // Caustics avançados
                vec2 causticUv = vWorldPosition.xz * 0.3 + time * 0.05;
                float caustics1 = sin(causticUv.x * 6.0) * sin(causticUv.y * 6.0);
                float caustics2 = sin(causticUv.x * 4.0 + 1.5) * sin(causticUv.y * 4.0 + 1.5);
                float caustics = (caustics1 + caustics2) * 0.5;
                caustics = max(0.0, caustics) * 0.3;
                
                // Reflexão do céu
                vec3 skyReflection = skyColor * fresnel * 0.4;
                
                // Composição final
                vec3 finalColor = baseColor + caustics + skyReflection;
                
                // Alpha com Fresnel
                float alpha = 0.85 + fresnel * 0.15;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    enableFallbackMode() {
        console.log('🔄 Ativando modo fallback offline...');
        this.options.fallbackMode = true;
        this.currentQuality = 'basic';
        this.options.enableAdvancedShaders = false;
    }
    
    // API pública para integração
    getOceanMaterial(scene, camera, renderer) {
        if (!this.isInitialized || this.options.fallbackMode) {
            return this.getFallbackMaterial();
        }
        
        const uniforms = {
            time: { value: 0.0 },
            waveHeight: { value: 1.5 },
            waveFrequency: { value: 0.4 },
            waterColor: { value: new THREE.Color(0x006994) },
            deepColor: { value: new THREE.Color(0x003d5c) },
            foamColor: { value: new THREE.Color(0xffffff) },
            skyColor: { value: new THREE.Color(0x87ceeb) },
            windDirection: { value: new THREE.Vector2(1.0, 0.5) }
        };
        
        return new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
    
    getFallbackMaterial() {
        return new THREE.MeshLambertMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
    }
    
    // Atualizar uniforms
    updateUniforms(material, deltaTime) {
        if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value += deltaTime;
        }
    }
    
    // Informações do sistema
    getInfo() {
        return {
            version: '1.0.0',
            mode: 'offline',
            quality: this.currentQuality,
            webgl: this.hasWebGL,
            shaders: this.shaderCompilationSupported,
            fallback: this.options.fallbackMode
        };
    }
    
    // Cleanup
    dispose() {
        console.log('🧹 Limpando Enhanced Ocean Offline...');
        this.isInitialized = false;
    }
}

// Sistema de integração segura offline
class SafeOceanOfflineIntegration {
    constructor(options = {}) {
        this.options = {
            enableEnhancedShaders: true,
            enableSafetyChecks: true,
            maxRetries: 3,
            ...options
        };
        
        this.oceanSystem = null;
        this.retryCount = 0;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('🔒 Inicializando Safe Ocean Offline Integration...');
        
        try {
            this.oceanSystem = new EnhancedOceanOffline({
                quality: 'auto',
                enableAdvancedShaders: this.options.enableEnhancedShaders
            });
            
            // Aguardar inicialização
            let attempts = 0;
            while (!this.oceanSystem.isInitialized && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            this.isInitialized = true;
            console.log('✅ Safe Ocean Offline Integration inicializada');
            
        } catch (error) {
            console.error('❌ Erro na inicialização offline:', error);
            this.handleError(error);
        }
    }
    
    handleError(error) {
        this.retryCount++;
        
        if (this.retryCount < this.options.maxRetries) {
            console.log(`🔄 Tentativa ${this.retryCount} de ${this.options.maxRetries}...`);
            setTimeout(() => this.init(), 1000);
        } else {
            console.log('🔄 Usando sistema básico após múltiplas falhas');
            this.oceanSystem = {
                getOceanMaterial: () => new THREE.MeshLambertMaterial({
                    color: 0x006994,
                    transparent: true,
                    opacity: 0.8
                }),
                updateUniforms: () => {},
                dispose: () => {}
            };
            this.isInitialized = true;
        }
    }
    
    getOceanMaterial(scene, camera, renderer) {
        if (!this.isInitialized || !this.oceanSystem) {
            return new THREE.MeshLambertMaterial({
                color: 0x006994,
                transparent: true,
                opacity: 0.8
            });
        }
        
        return this.oceanSystem.getOceanMaterial(scene, camera, renderer);
    }
    
    updateUniforms(material, deltaTime) {
        if (this.oceanSystem && this.oceanSystem.updateUniforms) {
            this.oceanSystem.updateUniforms(material, deltaTime);
        }
    }
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            retries: this.retryCount,
            system: this.oceanSystem ? this.oceanSystem.getInfo() : null
        };
    }
    
    dispose() {
        if (this.oceanSystem && this.oceanSystem.dispose) {
            this.oceanSystem.dispose();
        }
    }
}

// Exportar para uso global
window.EnhancedOceanOffline = EnhancedOceanOffline;
window.SafeOceanOfflineIntegration = SafeOceanOfflineIntegration;

console.log('🌊 Enhanced Ocean Offline V1.0 carregado e pronto para uso!');
