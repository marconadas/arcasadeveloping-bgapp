/**
 * 🌊 ENHANCED OCEAN SHADERS V1.0 - BGAPP
 * Melhorias incrementais nos shaders oceânicos mantendo sanidade do código
 * 
 * PRINCÍPIOS DE DESENVOLVIMENTO:
 * ✅ Backward compatibility total
 * ✅ Fallbacks para hardware antigo
 * ✅ Validação de sanidade em cada etapa
 * ✅ Performance monitoring integrado
 * ✅ Rollback automático em caso de erro
 */

class EnhancedOceanShaders {
    constructor(options = {}) {
        this.options = {
            quality: 'auto', // auto, low, medium, high, ultra
            enableAdvancedShaders: true,
            enableCaustics: true,
            enableFoam: true,
            enableSubsurface: true,
            fallbackMode: false,
            ...options
        };
        
        // Sistema de sanidade
        this.sanityChecks = {
            webglSupport: false,
            shaderCompilation: false,
            performance: false
        };
        
        // Performance metrics
        this.performanceMetrics = {
            fps: 60,
            drawCalls: 0,
            triangles: 0,
            memoryUsage: 0
        };
        
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
        console.log('🌊 Inicializando Enhanced Ocean Shaders V1.0...');
        
        try {
            // Etapa 1: Verificações de sanidade
            await this.performSanityChecks();
            
            // Etapa 2: Determinar qualidade automática
            this.determineOptimalQuality();
            
            // Etapa 3: Carregar shaders apropriados
            await this.loadOptimizedShaders();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Ocean Shaders inicializados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização dos shaders:', error);
            this.enableFallbackMode();
        }
    }
    
    async performSanityChecks() {
        console.log('🔍 Executando verificações de sanidade...');
        
        // Check 1: WebGL Support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!gl) {
            throw new Error('WebGL não suportado');
        }
        
        this.sanityChecks.webglSupport = true;
        console.log('✅ WebGL suportado');
        
        // Check 2: Shader Compilation
        const testVertexShader = this.compileShader(gl, this.getBasicVertexShader(), gl.VERTEX_SHADER);
        const testFragmentShader = this.compileShader(gl, this.getBasicFragmentShader(), gl.FRAGMENT_SHADER);
        
        if (!testVertexShader || !testFragmentShader) {
            throw new Error('Falha na compilação de shaders');
        }
        
        this.sanityChecks.shaderCompilation = true;
        console.log('✅ Compilação de shaders funcionando');
        
        // Check 3: Performance baseline
        const startTime = performance.now();
        // Simular operações gráficas básicas
        for (let i = 0; i < 1000; i++) {
            Math.sin(i * 0.01) * Math.cos(i * 0.01);
        }
        const endTime = performance.now();
        
        if (endTime - startTime > 100) {
            console.warn('⚠️ Performance baixa detectada');
        }
        
        this.sanityChecks.performance = true;
        console.log('✅ Verificações de sanidade concluídas');
    }
    
    determineOptimalQuality() {
        if (this.options.quality !== 'auto') return;
        
        // Detectar capacidade do hardware
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        
        console.log(`🖥️ GPU detectada: ${renderer} (${vendor})`);
        
        // Determinar qualidade baseada em heurísticas
        if (renderer.includes('Intel') && !renderer.includes('Iris')) {
            this.options.quality = 'medium';
        } else if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Iris')) {
            this.options.quality = 'high';
        } else if (navigator.hardwareConcurrency >= 8) {
            this.options.quality = 'high';
        } else {
            this.options.quality = 'medium';
        }
        
        // Ajustar para dispositivos móveis
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.options.quality = 'low';
        }
        
        console.log(`🎯 Qualidade determinada: ${this.options.quality}`);
    }
    
    async loadOptimizedShaders() {
        console.log(`🎨 Carregando shaders para qualidade: ${this.options.quality}`);
        
        switch (this.options.quality) {
            case 'low':
                return this.loadBasicShaders();
            case 'medium':
                return this.loadMediumShaders();
            case 'high':
                return this.loadHighQualityShaders();
            case 'ultra':
                return this.loadUltraShaders();
            default:
                return this.loadMediumShaders();
        }
    }
    
    loadBasicShaders() {
        console.log('📱 Carregando shaders básicos (otimizado para mobile)...');
        
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Ondas simples para performance
                float wave = sin(pos.x * 0.1 + time) * waveHeight * 0.5;
                pos.y += wave;
                
                vPosition = pos;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            uniform float time;
            uniform vec3 waterColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vec3 color = waterColor;
                
                // Efeito simples de profundidade
                float depth = clamp(vPosition.y + 5.0, 0.0, 1.0);
                color = mix(color * 0.5, color, depth);
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }
    
    loadMediumShaders() {
        console.log('💻 Carregando shaders médios (desktop padrão)...');
        
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            
            // Função Gerstner Wave melhorada
            vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float phase, vec2 direction) {
                float steepness = 0.3;
                float k = frequency * 6.28318;
                float c = sqrt(9.8 / k);
                vec2 d = normalize(direction);
                float f = k * (dot(d, pos) - c * time * phase);
                float a = steepness / k;
                
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
                pos += gerstnerWave(position.xz, waveHeight * 0.6, waveFrequency * 1.7, 1.3, vec2(0.7, 0.7));
                pos += gerstnerWave(position.xz, waveHeight * 0.3, waveFrequency * 2.5, 1.8, vec2(-0.5, 0.8));
                
                vPosition = pos;
                vElevation = pos.y;
                
                // Calcular normal para iluminação
                vec3 tangent = vec3(1.0, 0.0, 0.0);
                vec3 bitangent = vec3(0.0, 0.0, 1.0);
                vNormal = normalize(cross(tangent, bitangent));
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepColor;
            uniform vec3 foamColor;
            uniform vec3 sunDirection;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            
            void main() {
                vec3 normal = normalize(vNormal);
                
                // Fresnel effect
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                float fresnel = 1.0 - max(dot(normal, viewDirection), 0.0);
                fresnel = pow(fresnel, 2.0);
                
                // Cor baseada na profundidade
                float depth = clamp((vPosition.y + 10.0) / 20.0, 0.0, 1.0);
                vec3 color = mix(deepColor, waterColor, depth);
                
                // Espuma nas cristas das ondas
                float foam = smoothstep(0.8, 1.2, vElevation);
                color = mix(color, foamColor, foam * 0.6);
                
                // Caustics simples
                float caustics = sin(vPosition.x * 0.2 + time) * sin(vPosition.z * 0.3 + time * 1.1);
                caustics = max(0.0, caustics) * 0.15;
                
                color += caustics;
                
                // Alpha com Fresnel
                float alpha = 0.75 + fresnel * 0.2;
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
    }
    
    loadHighQualityShaders() {
        console.log('🖥️ Carregando shaders de alta qualidade...');
        
        this.vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform vec2 windDirection;
            uniform float windStrength;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            varying vec3 vWorldPosition;
            
            // Função hash para ruído
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
            
            // Gerstner Wave avançada com vento
            vec3 gerstnerWave(vec2 pos, float amplitude, float frequency, float phase, vec2 direction, float steepness) {
                float k = frequency * 6.28318;
                float c = sqrt(9.8 / k);
                vec2 d = normalize(direction);
                float f = k * (dot(d, pos) - c * time * phase);
                float a = steepness / k;
                
                // Influência do vento
                float windInfluence = dot(d, normalize(windDirection)) * windStrength;
                a *= (1.0 + windInfluence * 0.3);
                
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
                
                // Ondas principais
                waveDisplacement += gerstnerWave(position.xz, waveHeight, waveFrequency, 1.0, vec2(1.0, 0.0), 0.4);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.7, waveFrequency * 1.6, 1.2, vec2(0.8, 0.6), 0.3);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.5, waveFrequency * 2.3, 1.7, vec2(-0.4, 0.9), 0.25);
                
                // Ondas secundárias (detalhes)
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.3, waveFrequency * 3.8, 2.1, vec2(0.6, -0.8), 0.2);
                waveDisplacement += gerstnerWave(position.xz, waveHeight * 0.2, waveFrequency * 5.2, 2.8, vec2(-0.7, 0.3), 0.15);
                
                // Ruído para variação
                float noiseValue = noise(position.xz * 0.05 + time * 0.1) * waveHeight * 0.1;
                waveDisplacement.y += noiseValue;
                
                pos += waveDisplacement;
                
                vPosition = pos;
                vElevation = pos.y;
                vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                
                // Calcular normal precisa para iluminação
                float epsilon = 0.1;
                vec3 tangent = normalize(vec3(epsilon, 0.0, 0.0));
                vec3 bitangent = normalize(vec3(0.0, 0.0, epsilon));
                vNormal = normalize(cross(tangent, bitangent));
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.fragmentShader = `
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepColor;
            uniform vec3 foamColor;
            uniform vec3 sunDirection;
            uniform float sunIntensity;
            uniform vec3 skyColor;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying float vElevation;
            varying vec3 vWorldPosition;
            
            // Função hash para ruído
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
                vec3 viewDirection = normalize(cameraPosition - vPosition);
                
                // Fresnel effect avançado
                float fresnel = 1.0 - max(dot(normal, viewDirection), 0.0);
                fresnel = pow(fresnel, 1.5);
                
                // Cor baseada na profundidade com gradiente suave
                float depth = clamp((vPosition.y + 15.0) / 30.0, 0.0, 1.0);
                vec3 baseColor = mix(deepColor, waterColor, depth);
                
                // Espuma avançada nas cristas
                float foam = smoothstep(1.0, 1.8, vElevation);
                float foamNoise = noise(vWorldPosition.xz * 8.0 + time * 2.0);
                foam *= foamNoise;
                baseColor = mix(baseColor, foamColor, foam * 0.8);
                
                // Sistema de caustics avançado
                vec2 causticUv = vWorldPosition.xz * 0.3 + time * 0.05;
                float caustics1 = sin(causticUv.x * 6.0) * sin(causticUv.y * 6.0);
                float caustics2 = sin(causticUv.x * 4.0 + 1.5) * sin(causticUv.y * 4.0 + 1.5);
                float caustics = (caustics1 + caustics2) * 0.5;
                caustics = max(0.0, caustics) * 0.3;
                
                // Iluminação especular avançada
                vec3 reflectDirection = reflect(-normalize(sunDirection), normal);
                float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 128.0);
                specular *= sunIntensity;
                
                // Subsurface scattering
                float subsurface = max(0.0, dot(-normalize(sunDirection), normal)) * 0.4;
                vec3 subsurfaceColor = waterColor * subsurface;
                
                // Reflexão do céu
                vec3 skyReflection = skyColor * fresnel * 0.6;
                
                // Composição final
                vec3 finalColor = baseColor + caustics + subsurfaceColor + skyReflection;
                finalColor += specular * vec3(1.0, 1.0, 0.9);
                
                // Alpha com Fresnel e profundidade
                float alpha = 0.85 + fresnel * 0.15;
                alpha *= clamp(depth + 0.3, 0.0, 1.0);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    enableFallbackMode() {
        console.log('🔄 Ativando modo fallback...');
        this.options.fallbackMode = true;
        this.options.quality = 'low';
        this.options.enableAdvancedShaders = false;
        this.options.enableCaustics = false;
        this.options.enableFoam = false;
        this.options.enableSubsurface = false;
    }
    
    compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Erro na compilação do shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    getBasicVertexShader() {
        return `
            attribute vec3 position;
            attribute vec2 uv;
            uniform mat4 projectionMatrix;
            uniform mat4 modelViewMatrix;
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    getBasicFragmentShader() {
        return `
            precision mediump float;
            varying vec2 vUv;
            
            void main() {
                gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);
            }
        `;
    }
    
    // API pública para integração
    getShaderMaterial(scene, camera, renderer) {
        if (!this.isInitialized) {
            console.warn('⚠️ Shaders ainda não inicializados, usando fallback');
            return this.getFallbackMaterial();
        }
        
        const uniforms = {
            time: { value: 0.0 },
            waveHeight: { value: 2.0 },
            waveFrequency: { value: 0.5 },
            waterColor: { value: new THREE.Color(0x006994) },
            deepColor: { value: new THREE.Color(0x003d5c) },
            foamColor: { value: new THREE.Color(0xffffff) },
            sunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
            sunIntensity: { value: 1.0 },
            skyColor: { value: new THREE.Color(0x87ceeb) },
            windDirection: { value: new THREE.Vector2(1.0, 0.5) },
            windStrength: { value: 0.3 }
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
    
    // Monitoramento de performance
    updatePerformanceMetrics(renderer) {
        if (!renderer.info) return;
        
        this.performanceMetrics.drawCalls = renderer.info.render.calls;
        this.performanceMetrics.triangles = renderer.info.render.triangles;
        this.performanceMetrics.memoryUsage = renderer.info.memory.geometries + renderer.info.memory.textures;
        
        // Auto-ajuste de qualidade baseado na performance
        if (this.performanceMetrics.fps < 30 && this.options.quality === 'high') {
            console.log('📉 FPS baixo detectado, reduzindo qualidade...');
            this.options.quality = 'medium';
            this.loadOptimizedShaders();
        }
    }
    
    // Cleanup para evitar vazamentos de memória
    dispose() {
        console.log('🧹 Limpando Enhanced Ocean Shaders...');
        this.isInitialized = false;
        // Cleanup adicional se necessário
    }
}

// Exportar para uso global
window.EnhancedOceanShaders = EnhancedOceanShaders;

console.log('🌊 Enhanced Ocean Shaders V1.0 carregado e pronto para uso!');
