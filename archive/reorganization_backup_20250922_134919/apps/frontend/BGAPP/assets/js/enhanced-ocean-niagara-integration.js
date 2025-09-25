/**
 * 🌊 ENHANCED OCEAN NIAGARA INTEGRATION
 * 
 * Sistema de integração dos efeitos Niagara com o oceano existente do BGAPP
 * Combina os shaders UE5 existentes com os novos efeitos subaquáticos
 * 
 * @author MareDatum - BGAPP Team
 * @version 2.0.0 - Niagara Falls Edition
 */

// ES Module imports
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import NiagaraUnderwaterEffects from './niagara-underwater-effects.js';

class EnhancedOceanNiagaraIntegration {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '#ocean-container',
            enableNiagaraEffects: options.enableNiagaraEffects !== false,
            enableAdvancedShaders: options.enableAdvancedShaders !== false,
            enableParticlePhysics: options.enableParticlePhysics !== false,
            performanceMode: options.performanceMode || 'high', // 'low', 'medium', 'high', 'ultra'
            
            // Configurações específicas do Niagara
            niagaraConfig: {
                waterfallIntensity: options.waterfallIntensity || 2.5,
                maxParticles: this.getParticleCountByPerformance(options.performanceMode),
                volumetricIntensity: options.volumetricIntensity || 1.5,
                causticsIntensity: options.causticsIntensity || 2.0,
                ...options.niagaraConfig
            },
            
            // Configurações do oceano base
            oceanConfig: {
                waveHeight: options.waveHeight || 2.0,
                waveSpeed: options.waveSpeed || 1.0,
                windStrength: options.windStrength || 1.2,
                waterColor: options.waterColor || new THREE.Color(0.1, 0.3, 0.8),
                deepWaterColor: options.deepWaterColor || new THREE.Color(0.0, 0.1, 0.3),
                ...options.oceanConfig
            }
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.oceanMesh = null;
        this.niagaraSystem = null;
        
        this.isInitialized = false;
        this.isRunning = false;
        this.animationId = null;
        
        this.clock = new THREE.Clock();
        this.stats = null;
        
        console.log('🌊 Enhanced Ocean Niagara Integration criado');
    }
    
    getParticleCountByPerformance(mode) {
        const counts = {
            'low': 5000,
            'medium': 10000,
            'high': 15000,
            'ultra': 25000
        };
        return counts[mode] || counts['high'];
    }
    
    async initialize() {
        console.log('🚀 Inicializando Enhanced Ocean Niagara Integration...');
        
        try {
            // Inicializar Three.js
            await this.initializeThreeJS();
            
            // Criar oceano base melhorado
            await this.createEnhancedOcean();
            
            // Inicializar sistema Niagara
            if (this.options.enableNiagaraEffects) {
                await this.initializeNiagaraSystem();
            }
            
            // Configurar controles da câmera
            this.setupCameraControls();
            
            // Configurar iluminação avançada
            this.setupAdvancedLighting();
            
            // Configurar pós-processamento
            if (this.options.performanceMode === 'high' || this.options.performanceMode === 'ultra') {
                this.setupPostProcessing();
            }
            
            // Configurar estatísticas de performance
            if (this.options.performanceMode === 'ultra') {
                this.setupPerformanceStats();
            }
            
            // Configurar responsividade
            this.setupResponsiveHandling();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Ocean Niagara Integration inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Enhanced Ocean Niagara Integration:', error);
            throw error;
        }
    }
    
    async initializeThreeJS() {
        console.log('🔧 Inicializando Three.js...');
        
        const container = document.querySelector(this.options.containerSelector);
        if (!container) {
            throw new Error(`Container não encontrado: ${this.options.containerSelector}`);
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.FogExp2(0x001122, 0.002);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 20, 50);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: this.options.performanceMode === 'ultra',
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        container.appendChild(this.renderer.domElement);
        
        console.log('✅ Three.js inicializado');
    }
    
    async createEnhancedOcean() {
        console.log('🌊 Criando oceano melhorado...');
        
        // Geometria do oceano com alta resolução
        const oceanGeometry = new THREE.PlaneGeometry(
            400, 400,
            this.options.performanceMode === 'ultra' ? 512 : 256,
            this.options.performanceMode === 'ultra' ? 512 : 256
        );
        
        // Material com shaders UE5 avançados
        const oceanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                
                // Wave parameters
                waveHeight: { value: this.options.oceanConfig.waveHeight },
                waveFrequency: { value: 0.02 },
                waveSpeed: { value: this.options.oceanConfig.waveSpeed },
                windDirection: { value: new THREE.Vector2(1.0, 0.5) },
                windStrength: { value: this.options.oceanConfig.windStrength },
                
                // Gerstner wave parameters (UE5 style)
                gerstnerWave1: { value: new THREE.Vector4(1.0, 0.0, 0.4, 25.0) },
                gerstnerWave2: { value: new THREE.Vector4(0.8, 0.6, 0.3, 18.0) },
                gerstnerWave3: { value: new THREE.Vector4(-0.4, 0.9, 0.25, 12.0) },
                gerstnerWave4: { value: new THREE.Vector4(0.6, -0.8, 0.2, 8.0) },
                gerstnerWave5: { value: new THREE.Vector4(-0.7, 0.3, 0.15, 6.0) },
                gerstnerWave6: { value: new THREE.Vector4(0.3, 0.7, 0.1, 4.0) },
                
                // FFT Ocean parameters
                phillips_alpha: { value: 0.0081 },
                phillips_beta: { value: 1.3 },
                gravity: { value: 9.8 },
                oceanSize: { value: new THREE.Vector2(400, 400) },
                
                // Color parameters
                waterColor: { value: this.options.oceanConfig.waterColor },
                deepWaterColor: { value: this.options.oceanConfig.deepWaterColor },
                foamColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
                
                // Lighting parameters
                lightDirection: { value: new THREE.Vector3(0.5, -0.8, 0.3) },
                lightColor: { value: new THREE.Color(1.0, 0.95, 0.8) },
                sunIntensity: { value: 1.5 },
                ambientIntensity: { value: 0.3 },
                
                // Advanced parameters
                transparency: { value: 0.8 },
                roughness: { value: 0.1 },
                metalness: { value: 0.0 },
                causticsIntensity: { value: this.options.niagaraConfig.causticsIntensity },
                causticsScale: { value: 0.1 },
                causticsSpeed: { value: 0.02 },
                
                // Subsurface scattering
                subsurfaceStrength: { value: 0.4 },
                subsurfaceColor: { value: new THREE.Color(0.2, 0.6, 1.0) },
                subsurfaceRadius: { value: 2.0 },
                
                // Camera
                cameraPosition: { value: this.camera.position }
            },
            vertexShader: this.getEnhancedOceanVertexShader(),
            fragmentShader: this.getEnhancedOceanFragmentShader(),
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
        this.oceanMesh.rotation.x = -Math.PI / 2;
        this.oceanMesh.position.y = 0;
        this.oceanMesh.receiveShadow = true;
        
        this.scene.add(this.oceanMesh);
        
        console.log('✅ Oceano melhorado criado');
    }
    
    getEnhancedOceanVertexShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform float waveSpeed;
            uniform vec2 windDirection;
            uniform float windStrength;
            
            // Gerstner Wave Parameters
            uniform vec4 gerstnerWave1;
            uniform vec4 gerstnerWave2;
            uniform vec4 gerstnerWave3;
            uniform vec4 gerstnerWave4;
            uniform vec4 gerstnerWave5;
            uniform vec4 gerstnerWave6;
            
            // FFT Ocean Parameters
            uniform float phillips_alpha;
            uniform float phillips_beta;
            uniform float gravity;
            uniform vec2 oceanSize;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying float vWaveHeight;
            varying vec2 vFlowDirection;
            varying float vFoamFactor;
            
            // Noise functions
            float hash(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            float fbm(vec2 p, int octaves) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                
                for (int i = 0; i < 8; i++) {
                    if (i >= octaves) break;
                    value += amplitude * noise(p * frequency);
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                
                return value;
            }
            
            // Enhanced Gerstner Wave
            vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
                float steepness = wave.z;
                float wavelength = wave.w;
                float k = 2.0 * 3.14159265 / wavelength;
                float c = sqrt(gravity / k);
                vec2 d = normalize(wave.xy);
                float f = k * (dot(d, p.xz) - c * time * waveSpeed);
                float a = steepness / k;
                
                // Wind influence
                float windInfluence = dot(d, normalize(windDirection)) * windStrength * 0.1;
                a *= (1.0 + windInfluence);
                
                tangent += vec3(
                    -d.x * d.x * (steepness * sin(f)),
                    d.x * (steepness * cos(f)),
                    -d.x * d.y * (steepness * sin(f))
                );
                binormal += vec3(
                    -d.x * d.y * (steepness * sin(f)),
                    d.y * (steepness * cos(f)),
                    -d.y * d.y * (steepness * sin(f))
                );
                
                return vec3(
                    d.x * (a * cos(f)),
                    a * sin(f),
                    d.y * (a * cos(f))
                );
            }
            
            void main() {
                vUv = uv;
                
                vec3 pos = position;
                vec3 tangent = vec3(1.0, 0.0, 0.0);
                vec3 binormal = vec3(0.0, 0.0, 1.0);
                
                // Apply multiple Gerstner waves
                pos += gerstnerWave(gerstnerWave1, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave2, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave3, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave4, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave5, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave6, pos, tangent, binormal);
                
                // Add high-frequency detail noise
                float detailNoise = fbm(pos.xz * 0.1 + time * 0.05, 4) * waveHeight * 0.15;
                pos.y += detailNoise;
                
                // Ocean current flow
                vec2 flowDir = windDirection * windStrength * 0.008;
                pos.xz += flowDir * time;
                vFlowDirection = flowDir;
                
                // Calculate foam factor for Niagara integration
                vFoamFactor = smoothstep(1.0, 2.5, pos.y) * 0.8;
                vFoamFactor += smoothstep(0.5, 1.5, abs(detailNoise)) * 0.4;
                
                // Calculate normals
                vNormal = normalize(cross(binormal, tangent));
                vPosition = pos;
                vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                vViewPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
                vWaveHeight = pos.y;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }
    
    getEnhancedOceanFragmentShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 deepWaterColor;
            uniform vec3 foamColor;
            uniform float transparency;
            uniform float roughness;
            uniform float metalness;
            uniform float causticsIntensity;
            uniform float causticsScale;
            uniform float causticsSpeed;
            uniform vec3 lightDirection;
            uniform vec3 lightColor;
            uniform vec3 cameraPosition;
            uniform float sunIntensity;
            uniform float ambientIntensity;
            
            // Subsurface Scattering
            uniform float subsurfaceStrength;
            uniform vec3 subsurfaceColor;
            uniform float subsurfaceRadius;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying float vWaveHeight;
            varying vec2 vFlowDirection;
            varying float vFoamFactor;
            
            // Enhanced noise functions
            float hash21(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }
            
            float noise21(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash21(i + vec2(0.0,0.0)), 
                              hash21(i + vec2(1.0,0.0)), u.x),
                          mix(hash21(i + vec2(0.0,1.0)), 
                              hash21(i + vec2(1.0,1.0)), u.x), u.y);
            }
            
            // Enhanced caustics with Niagara integration
            float calculateEnhancedCaustics(vec2 uv, float depth, float foamFactor) {
                vec2 causticsUv1 = uv * causticsScale + time * causticsSpeed + vFlowDirection * time;
                vec2 causticsUv2 = uv * causticsScale * 1.7 - time * causticsSpeed * 0.8 + vFlowDirection * time * 0.5;
                vec2 causticsUv3 = uv * causticsScale * 0.6 + time * causticsSpeed * 1.3;
                vec2 causticsUv4 = uv * causticsScale * 2.1 + time * causticsSpeed * 0.6; // Extra layer
                
                float caustics1 = noise21(causticsUv1);
                float caustics2 = noise21(causticsUv2);
                float caustics3 = noise21(causticsUv3);
                float caustics4 = noise21(causticsUv4);
                
                // Multi-layer caustics
                float caustics = (caustics1 + caustics2 * 0.7 + caustics3 * 0.4 + caustics4 * 0.3) / 2.4;
                
                // Depth modulation
                caustics *= exp(-depth * 0.08);
                
                // Foam interaction
                caustics *= (1.0 + foamFactor * 0.5);
                
                // Enhanced transfer function
                caustics = pow(max(0.0, caustics), 1.8) * causticsIntensity;
                
                return caustics;
            }
            
            // Advanced Fresnel
            float calculateEnhancedFresnel(vec3 normal, vec3 viewDir, float ior) {
                float cosTheta = abs(dot(normal, viewDir));
                float sinTheta2 = 1.0 - cosTheta * cosTheta;
                float sinTheta2_ior2 = sinTheta2 / (ior * ior);
                
                if (sinTheta2_ior2 > 1.0) return 1.0;
                
                float cosTheta2 = sqrt(1.0 - sinTheta2_ior2);
                float r_parallel = (ior * cosTheta - cosTheta2) / (ior * cosTheta + cosTheta2);
                float r_perpendicular = (cosTheta - ior * cosTheta2) / (cosTheta + ior * cosTheta2);
                
                return 0.5 * (r_parallel * r_parallel + r_perpendicular * r_perpendicular);
            }
            
            // Enhanced PBR Water Lighting
            vec3 calculateEnhancedPBRLighting(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 albedo) {
                vec3 halfDir = normalize(lightDir + viewDir);
                
                float NdotL = max(dot(normal, lightDir), 0.0);
                float NdotV = max(dot(normal, viewDir), 0.0);
                float NdotH = max(dot(normal, halfDir), 0.0);
                float VdotH = max(dot(viewDir, halfDir), 0.0);
                
                // Enhanced diffuse with subsurface scattering
                vec3 diffuse = albedo * NdotL;
                
                // Improved subsurface scattering
                float subsurface = pow(max(0.0, dot(-lightDir, viewDir)), subsurfaceRadius) * subsurfaceStrength;
                subsurface *= (1.0 + vFoamFactor * 0.3); // Foam enhances scattering
                diffuse += subsurfaceColor * subsurface;
                
                // Enhanced specular (GGX distribution)
                float alpha = roughness * roughness;
                float alpha2 = alpha * alpha;
                float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
                float D = alpha2 / (3.14159265 * denom * denom);
                
                // Improved geometric shadowing
                float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
                float G1_L = NdotL / (NdotL * (1.0 - k) + k);
                float G1_V = NdotV / (NdotV * (1.0 - k) + k);
                float G = G1_L * G1_V;
                
                // Enhanced Fresnel
                float F0 = 0.02;
                float F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
                
                vec3 specular = vec3(D * G * F / (4.0 * NdotL * NdotV + 0.001));
                
                return (diffuse + specular) * lightColor * sunIntensity;
            }
            
            // Volumetric scattering with Niagara integration
            vec3 calculateEnhancedVolumetricScattering(vec3 rayStart, vec3 rayDir, float rayLength) {
                vec3 scattering = vec3(0.0);
                int steps = 20; // Increased for better quality
                float stepSize = rayLength / float(steps);
                
                for (int i = 0; i < 20; i++) {
                    if (i >= steps) break;
                    
                    vec3 samplePos = rayStart + rayDir * stepSize * float(i);
                    float density = exp(-samplePos.y * 0.08) * 0.12;
                    
                    // Enhanced scattering color with depth variation
                    vec3 scatterColor = mix(
                        vec3(0.15, 0.4, 0.9), 
                        vec3(0.05, 0.15, 0.4), 
                        density
                    );
                    
                    // Foam influence on scattering
                    scatterColor *= (1.0 + vFoamFactor * 0.2);
                    
                    scattering += scatterColor * density * stepSize;
                }
                
                return scattering;
            }
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 lightDir = normalize(lightDirection);
                
                // Enhanced base color with depth variation
                float depth = clamp(-vPosition.y / 25.0, 0.0, 1.0);
                vec3 baseColor = mix(waterColor, deepWaterColor, depth);
                
                // Enhanced foam calculation
                float foam = vFoamFactor;
                
                // Additional foam from wave interaction
                foam += smoothstep(1.8, 3.2, vWaveHeight) * 0.9;
                
                // Shore foam simulation
                float shoreDistance = length(vWorldPosition.xz) / 120.0;
                foam += smoothstep(0.92, 1.0, shoreDistance) * 0.4;
                
                // Dynamic foam noise
                float foamNoise = noise21(vWorldPosition.xz * 4.0 + time * 1.5);
                foam *= (0.7 + foamNoise * 0.3);
                
                baseColor = mix(baseColor, foamColor, clamp(foam, 0.0, 0.95));
                
                // Enhanced caustics
                float caustics = calculateEnhancedCaustics(vUv, depth * 25.0, foam);
                baseColor += vec3(0.5, 0.9, 1.2) * caustics;
                
                // Enhanced PBR lighting
                vec3 litColor = calculateEnhancedPBRLighting(normal, viewDir, lightDir, baseColor);
                
                // Enhanced ambient lighting
                vec3 ambientColor = baseColor * ambientIntensity * vec3(0.6, 0.8, 1.0);
                litColor += ambientColor;
                
                // Enhanced Fresnel for transparency
                float fresnel = calculateEnhancedFresnel(normal, viewDir, 1.33);
                float alpha = mix(transparency * 0.25, transparency, fresnel);
                
                // Enhanced underwater volume scattering
                if (cameraPosition.y < vWorldPosition.y) {
                    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
                    float rayLength = length(vWorldPosition - cameraPosition);
                    vec3 scattering = calculateEnhancedVolumetricScattering(cameraPosition, rayDir, rayLength);
                    litColor += scattering;
                    alpha = min(alpha * 1.8, 0.98);
                }
                
                // Enhanced depth fog
                float distanceFog = exp(-length(vViewPosition) * 0.0008);
                litColor *= distanceFog;
                
                // Enhanced color grading
                litColor = pow(litColor, vec3(0.75)); // Gamma correction
                litColor = mix(litColor, litColor * litColor, 0.15); // Contrast boost
                
                // Foam glow effect
                litColor += foamColor * foam * 0.3;
                
                gl_FragColor = vec4(litColor, alpha);
            }
        `;
    }
    
    async initializeNiagaraSystem() {
        console.log('🌊 Inicializando sistema Niagara...');
        
        this.niagaraSystem = new NiagaraUnderwaterEffects(
            this.scene,
            this.camera,
            this.renderer,
            this.options.niagaraConfig
        );
        
        await this.niagaraSystem.initialize();
        this.niagaraSystem.start();
        
        console.log('✅ Sistema Niagara inicializado');
    }
    
    setupCameraControls() {
        console.log('🎮 Configurando controles da câmera...');
        
        // Inicializar OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.setupControlsSettings();
    }
    
    setupControlsSettings() {
        if (!this.controls) return;
        
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Configurações específicas para visualização oceânica
        this.controls.target.set(0, 0, 0);
        this.controls.autoRotate = this.options.performanceMode !== 'low';
        this.controls.autoRotateSpeed = 0.5;
    }
    
    setupAdvancedLighting() {
        console.log('💡 Configurando iluminação avançada...');
        
        // Sol principal
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // Luz hemisférica para céu
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x000080, 0.4);
        this.scene.add(hemisphereLight);
        
        // Ponto de luz subaquático
        const underwaterLight = new THREE.PointLight(0x00ffff, 0.8, 100);
        underwaterLight.position.set(0, -20, 0);
        this.scene.add(underwaterLight);
    }
    
    setupPostProcessing() {
        console.log('🎨 Configurando pós-processamento...');
        
        // Implementar pós-processamento básico
        // (Implementação completa seria muito extensa para este contexto)
        console.log('ℹ️ Pós-processamento configurado (implementação simplificada)');
    }
    
    setupPerformanceStats() {
        console.log('📊 Configurando estatísticas de performance...');
        
        // Criar elemento de stats simples
        const statsDiv = document.createElement('div');
        statsDiv.id = 'niagara-stats';
        statsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        `;
        document.body.appendChild(statsDiv);
        
        this.statsDiv = statsDiv;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }
    
    setupResponsiveHandling() {
        console.log('📱 Configurando responsividade...');
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    handleResize() {
        const container = document.querySelector(this.options.containerSelector);
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    start() {
        if (!this.isInitialized) {
            console.warn('⚠️ Sistema não inicializado. Execute initialize() primeiro.');
            return;
        }
        
        this.isRunning = true;
        this.animate();
        console.log('▶️ Enhanced Ocean Niagara Integration iniciado');
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('⏸️ Enhanced Ocean Niagara Integration pausado');
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Atualizar oceano
        if (this.oceanMesh && this.oceanMesh.material.uniforms) {
            this.oceanMesh.material.uniforms.time.value = elapsedTime;
            this.oceanMesh.material.uniforms.cameraPosition.value.copy(this.camera.position);
        }
        
        // Atualizar sistema Niagara
        if (this.niagaraSystem) {
            this.niagaraSystem.update(deltaTime);
        }
        
        // Atualizar controles
        if (this.controls) {
            this.controls.update();
        }
        
        // Atualizar estatísticas
        this.updateStats();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    updateStats() {
        if (!this.statsDiv) return;
        
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            const memoryInfo = performance.memory ? 
                `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` : 'N/A';
            
            this.statsDiv.innerHTML = `
                FPS: ${fps}<br>
                Memory: ${memoryInfo}<br>
                Particles: ${this.niagaraSystem ? this.options.niagaraConfig.maxParticles : 0}<br>
                Mode: ${this.options.performanceMode}
            `;
            
            this.frameCount = 0;
            this.lastTime = now;
        }
    }
    
    // Métodos de configuração dinâmica
    setPerformanceMode(mode) {
        this.options.performanceMode = mode;
        this.options.niagaraConfig.maxParticles = this.getParticleCountByPerformance(mode);
        
        if (this.niagaraSystem) {
            this.niagaraSystem.setParticleCount(this.options.niagaraConfig.maxParticles);
        }
        
        console.log(`🎛️ Modo de performance alterado para: ${mode}`);
    }
    
    setWaveHeight(height) {
        this.options.oceanConfig.waveHeight = height;
        if (this.oceanMesh && this.oceanMesh.material.uniforms) {
            this.oceanMesh.material.uniforms.waveHeight.value = height;
        }
    }
    
    setWaterfallIntensity(intensity) {
        this.options.niagaraConfig.waterfallIntensity = intensity;
        if (this.niagaraSystem) {
            this.niagaraSystem.setWaterfallIntensity(intensity);
        }
    }
    
    setCausticsIntensity(intensity) {
        this.options.niagaraConfig.causticsIntensity = intensity;
        
        if (this.oceanMesh && this.oceanMesh.material.uniforms) {
            this.oceanMesh.material.uniforms.causticsIntensity.value = intensity;
        }
        
        if (this.niagaraSystem) {
            this.niagaraSystem.setCausticsIntensity(intensity);
        }
    }
    
    // Método de limpeza
    dispose() {
        console.log('🧹 Limpando Enhanced Ocean Niagara Integration...');
        
        this.stop();
        
        if (this.niagaraSystem) {
            this.niagaraSystem.dispose();
        }
        
        if (this.oceanMesh) {
            this.scene.remove(this.oceanMesh);
            this.oceanMesh.geometry.dispose();
            this.oceanMesh.material.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.statsDiv) {
            document.body.removeChild(this.statsDiv);
        }
        
        console.log('✅ Recursos limpos com sucesso');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.EnhancedOceanNiagaraIntegration = EnhancedOceanNiagaraIntegration;
}

export default EnhancedOceanNiagaraIntegration;
