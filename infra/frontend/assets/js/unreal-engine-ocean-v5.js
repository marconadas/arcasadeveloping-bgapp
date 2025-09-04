/**
 * 🌊 BGAPP - Unreal Engine 5 Inspired Ocean System
 * 
 * Implementação avançada de simulação oceânica baseada no UE5
 * Técnicas: Gerstner Waves, FFT Ocean, Caustics, Buoyancy Physics
 * 
 * @author MareDatum - BGAPP Team
 * @version 2.0.0
 */

class UnrealEngine5OceanSystem {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // Configurações inspiradas no UE5
        this.config = {
            // Ocean Surface Settings (como no UE5 Water Body Ocean)
            oceanSize: options.oceanSize || 500,
            waveHeight: options.waveHeight || 3.0,
            waveFrequency: options.waveFrequency || 0.02,
            waveSpeed: options.waveSpeed || 1.0,
            waveDirections: options.waveDirections || [
                { x: 1.0, z: 0.0, steepness: 0.8 },
                { x: 0.7, z: 0.7, steepness: 0.6 },
                { x: -0.5, z: 0.8, steepness: 0.4 },
                { x: 0.2, z: -0.9, steepness: 0.3 }
            ],
            
            // Water Material Settings (inspirado no UE5 Water Material)
            waterColor: options.waterColor || new THREE.Color(0x006994),
            deepWaterColor: options.deepWaterColor || new THREE.Color(0x003d5c),
            foamColor: options.foamColor || new THREE.Color(0x87ceeb),
            transparency: options.transparency || 0.8,
            roughness: options.roughness || 0.1,
            metalness: options.metalness || 0.0,
            
            // Caustics Settings (como no UE5 Caustics)
            causticsIntensity: options.causticsIntensity || 0.5,
            causticsScale: options.causticsScale || 8.0,
            causticsSpeed: options.causticsSpeed || 0.1,
            
            // Buoyancy Physics (inspirado no UE5 Buoyancy Component)
            buoyancyEnabled: options.buoyancyEnabled || true,
            waterDensity: options.waterDensity || 1000.0,
            fluidFriction: options.fluidFriction || 0.3,
            
            // Performance Settings
            tessellation: options.tessellation || 256,
            lodLevels: options.lodLevels || 4,
            renderDistance: options.renderDistance || 1000
        };
        
        // Estados do sistema
        this.isInitialized = false;
        this.animationId = null;
        this.time = 0;
        
        // Componentes 3D
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.oceanMesh = null;
        this.oceanMaterial = null;
        this.underwaterFog = null;
        
        // Sistemas avançados
        this.causticSystem = null;
        this.buoyancyObjects = [];
        this.niagaraParticles = null;
        this.volumetricLighting = null;
        
        console.log('🎮 Unreal Engine 5 Ocean System criado');
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🌊 Inicializando UE5 Ocean System...');
            
            if (!this.container) {
                throw new Error('Container não encontrado');
            }
            
            // Verificar suporte WebGL 2.0 (necessário para shaders avançados)
            this.checkWebGLSupport();
            
            // Configurar cena principal
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            
            // Sistemas oceânicos avançados (ordem importante)
            this.createAdvancedOceanSurface();
            this.createOceanFloorWithTessellation();
            this.setupVolumetricLighting();
            this.createCausticsSystem();
            this.createNiagaraInspiredParticles();
            this.createBuoyancyObjects();
            this.setupUnderwaterAtmosphere();
            
            // Iniciar loop de animação
            this.startAnimationLoop();
            
            // Configurar responsividade
            this.setupResponsiveHandling();
            
            this.isInitialized = true;
            console.log('✅ UE5 Ocean System inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar UE5 Ocean System:', error);
            this.fallbackToBasicOcean();
        }
    }
    
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!gl) {
            throw new Error('WebGL não suportado');
        }
        
        // Verificar extensões necessárias
        const requiredExtensions = [
            'OES_texture_float',
            'OES_texture_float_linear'
        ];
        
        requiredExtensions.forEach(ext => {
            if (!gl.getExtension(ext)) {
                console.warn(`⚠️ Extensão WebGL ${ext} não disponível`);
            }
        });
        
        console.log('✅ WebGL 2.0 suportado');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Background gradient oceânico (como no UE5 Sky Atmosphere)
        this.scene.background = new THREE.Color(0x001122);
        
        // Fog subaquático (como no UE5 Exponential Height Fog)
        this.scene.fog = new THREE.FogExp2(0x001122, 0.003);
        
        console.log('🎬 Cena UE5 configurada');
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            this.config.renderDistance
        );
        
        // Posição cinematográfica (como câmera do UE5 Cine Camera)
        this.camera.position.set(0, 25, 60);
        this.camera.lookAt(0, 0, 0);
        
        console.log('📹 Câmera cinematográfica UE5 configurada');
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Configurações avançadas (como no UE5 Rendering Settings)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        this.container.appendChild(this.renderer.domElement);
        
        console.log('🖥️ Renderer UE5-grade configurado');
    }
    
    createAdvancedOceanSurface() {
        console.log('🌊 Criando superfície oceânica avançada (UE5 style)...');
        
        // Geometria com tessellation alta (como no UE5 Tessellation)
        const oceanGeometry = new THREE.PlaneGeometry(
            this.config.oceanSize, 
            this.config.oceanSize, 
            this.config.tessellation, 
            this.config.tessellation
        );
        
        // Material shader avançado (baseado no UE5 Water Material)
        this.oceanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                // Time uniforms
                time: { value: 0.0 },
                
                // Wave parameters (UE5 Gerstner Wave settings)
                waveA: { value: new THREE.Vector4(1.0, 0.0, this.config.waveFrequency, this.config.waveHeight) },
                waveB: { value: new THREE.Vector4(0.7, 0.7, this.config.waveFrequency * 1.5, this.config.waveHeight * 0.7) },
                waveC: { value: new THREE.Vector4(-0.5, 0.8, this.config.waveFrequency * 2.0, this.config.waveHeight * 0.4) },
                waveD: { value: new THREE.Vector4(0.2, -0.9, this.config.waveFrequency * 2.5, this.config.waveHeight * 0.3) },
                
                // Material parameters (UE5 Water Material)
                waterColor: { value: this.config.waterColor },
                deepWaterColor: { value: this.config.deepWaterColor },
                foamColor: { value: this.config.foamColor },
                transparency: { value: this.config.transparency },
                roughness: { value: this.config.roughness },
                metalness: { value: this.config.metalness },
                
                // Caustics parameters
                causticsIntensity: { value: this.config.causticsIntensity },
                causticsScale: { value: this.config.causticsScale },
                causticsSpeed: { value: this.config.causticsSpeed },
                
                // Lighting
                lightDirection: { value: new THREE.Vector3(1, 1, 0.5).normalize() },
                lightColor: { value: new THREE.Color(0xffffff) },
                
                // Environment
                cameraPosition: { value: new THREE.Vector3() }
            },
            
            vertexShader: `
                // UE5-inspired Gerstner Wave Vertex Shader
                uniform float time;
                uniform vec4 waveA, waveB, waveC, waveD;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying float vWaveHeight;
                
                // Gerstner Wave function (exactly like UE5)
                vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
                    float steepness = wave.z;
                    float wavelength = wave.w;
                    float k = 2.0 * 3.14159 / wavelength;
                    float c = sqrt(9.8 / k);
                    vec2 d = normalize(wave.xy);
                    float f = k * (dot(d, p.xz) - c * time);
                    float a = steepness / k;
                    
                    // Gerstner wave displacement
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
                    
                    // Apply multiple Gerstner waves (UE5 technique)
                    pos += gerstnerWave(waveA, pos, tangent, binormal);
                    pos += gerstnerWave(waveB, pos, tangent, binormal);
                    pos += gerstnerWave(waveC, pos, tangent, binormal);
                    pos += gerstnerWave(waveD, pos, tangent, binormal);
                    
                    // Calculate proper normals for lighting
                    vNormal = normalize(cross(binormal, tangent));
                    vPosition = pos;
                    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                    vWaveHeight = pos.y;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            
            fragmentShader: `
                // UE5-inspired Water Fragment Shader
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
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying float vWaveHeight;
                
                // Noise function for caustics (UE5 style)
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                
                // Caustics calculation (UE5 Water Caustics)
                float calculateCaustics(vec2 uv) {
                    vec2 causticsUv1 = uv * causticsScale + time * causticsSpeed;
                    vec2 causticsUv2 = uv * causticsScale * 1.3 - time * causticsSpeed * 0.7;
                    
                    float caustics1 = noise(causticsUv1);
                    float caustics2 = noise(causticsUv2);
                    
                    return (caustics1 + caustics2) * 0.5 * causticsIntensity;
                }
                
                // Fresnel calculation (UE5 Water Fresnel)
                float calculateFresnel(vec3 normal, vec3 viewDir, float power) {
                    return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
                }
                
                // PBR Lighting (UE5 style)
                vec3 calculatePBRLighting(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 albedo) {
                    // Diffuse (Lambertian)
                    float NdotL = max(dot(normal, lightDir), 0.0);
                    vec3 diffuse = albedo * NdotL;
                    
                    // Specular (Blinn-Phong approximation)
                    vec3 halfDir = normalize(lightDir + viewDir);
                    float NdotH = max(dot(normal, halfDir), 0.0);
                    float specularPower = mix(32.0, 2.0, roughness);
                    vec3 specular = lightColor * pow(NdotH, specularPower) * (1.0 - roughness);
                    
                    return diffuse + specular;
                }
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 lightDir = normalize(lightDirection);
                    
                    // Base water color with depth
                    float depth = clamp((vPosition.y + 5.0) / 10.0, 0.0, 1.0);
                    vec3 baseColor = mix(deepWaterColor, waterColor, depth);
                    
                    // Foam calculation (UE5 Water Foam)
                    float foam = smoothstep(1.0, 3.0, vWaveHeight);
                    foam += smoothstep(0.8, 1.0, abs(vWaveHeight)) * 0.5;
                    baseColor = mix(baseColor, foamColor, clamp(foam, 0.0, 0.8));
                    
                    // Caustics effect
                    float caustics = calculateCaustics(vUv);
                    baseColor += caustics * vec3(0.3, 0.6, 1.0);
                    
                    // PBR Lighting
                    vec3 litColor = calculatePBRLighting(normal, viewDir, lightDir, baseColor);
                    
                    // Fresnel for transparency
                    float fresnel = calculateFresnel(normal, viewDir, 2.0);
                    float alpha = mix(transparency * 0.6, transparency, fresnel);
                    
                    // Underwater tint when looking from below
                    if (cameraPosition.y < vWorldPosition.y) {
                        litColor *= vec3(0.7, 0.9, 1.2); // Blue tint
                        alpha *= 1.5;
                    }
                    
                    gl_FragColor = vec4(litColor, alpha);
                }
            `,
            
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        
        this.oceanMesh = new THREE.Mesh(oceanGeometry, this.oceanMaterial);
        this.oceanMesh.rotation.x = -Math.PI / 2;
        this.oceanMesh.position.y = 0;
        this.oceanMesh.receiveShadow = true;
        this.oceanMesh.castShadow = false;
        this.scene.add(this.oceanMesh);
        
        console.log('✅ Superfície oceânica UE5 criada');
    }
    
    createOceanFloorWithTessellation() {
        console.log('🏔️ Criando fundo do mar com tessellation (UE5 style)...');
        
        // Geometria de alta qualidade para o fundo
        const floorGeometry = new THREE.PlaneGeometry(
            this.config.oceanSize * 1.2, 
            this.config.oceanSize * 1.2, 
            128, 
            128
        );
        
        // Displacement procedural (como UE5 World Position Offset)
        const positions = floorGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            
            // Noise multi-octave para relevo realístico
            let height = 0;
            height += Math.sin(x * 0.01) * 3;
            height += Math.sin(z * 0.015) * 2;
            height += Math.sin(x * 0.03 + z * 0.02) * 1;
            height += Math.random() * 0.5;
            
            positions[i + 1] = -30 + height;
        }
        
        floorGeometry.attributes.position.needsUpdate = true;
        floorGeometry.computeVertexNormals();
        
        // Material PBR para o fundo (como UE5 Material)
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        const oceanFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        oceanFloor.rotation.x = -Math.PI / 2;
        oceanFloor.position.y = -30;
        oceanFloor.receiveShadow = true;
        this.scene.add(oceanFloor);
        
        // Adicionar detalhes do fundo do mar
        this.addSeaFloorDetails();
        
        console.log('✅ Fundo do mar UE5 criado');
    }
    
    addSeaFloorDetails() {
        // Corais (como UE5 Foliage System)
        for (let i = 0; i < 20; i++) {
            const coralGeometry = new THREE.ConeGeometry(
                0.5 + Math.random() * 1.0,
                2 + Math.random() * 3,
                8,
                3
            );
            const coralMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.8, 0.6),
                roughness: 0.7
            });
            
            const coral = new THREE.Mesh(coralGeometry, coralMaterial);
            coral.position.set(
                (Math.random() - 0.5) * 200,
                -28 + Math.random() * 3,
                (Math.random() - 0.5) * 200
            );
            coral.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(coral);
        }
        
        // Algas marinhas (como UE5 Wind-affected vegetation)
        for (let i = 0; i < 100; i++) {
            const seaweedGeometry = new THREE.CylinderGeometry(0.1, 0.05, 3 + Math.random() * 2, 6);
            const seaweedMaterial = new THREE.MeshStandardMaterial({
                color: 0x228b22,
                transparent: true,
                opacity: 0.8
            });
            
            const seaweed = new THREE.Mesh(seaweedGeometry, seaweedMaterial);
            seaweed.position.set(
                (Math.random() - 0.5) * 180,
                -27,
                (Math.random() - 0.5) * 180
            );
            seaweed.userData = { 
                originalY: seaweed.position.y,
                swaySpeed: 0.5 + Math.random() * 1.0,
                swayAmount: 0.3 + Math.random() * 0.5
            };
            
            this.scene.add(seaweed);
            this.buoyancyObjects.push(seaweed); // Para animação de corrente
        }
    }
    
    setupVolumetricLighting() {
        console.log('💡 Configurando iluminação volumétrica (UE5 style)...');
        
        // Luz solar principal (como UE5 Directional Light)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(100, 150, 50);
        sunLight.castShadow = true;
        
        // Configurações de sombra de alta qualidade (UE5 Cascaded Shadow Maps)
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -250;
        sunLight.shadow.camera.right = 250;
        sunLight.shadow.camera.top = 250;
        sunLight.shadow.camera.bottom = -250;
        sunLight.shadow.bias = -0.0001;
        
        this.scene.add(sunLight);
        
        // Luzes subaquáticas (como UE5 Point Lights)
        for (let i = 0; i < 5; i++) {
            const underwaterLight = new THREE.PointLight(
                new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.7, 0.8),
                0.8,
                50
            );
            underwaterLight.position.set(
                (Math.random() - 0.5) * 100,
                -10 + Math.random() * 15,
                (Math.random() - 0.5) * 100
            );
            this.scene.add(underwaterLight);
        }
        
        console.log('✅ Iluminação volumétrica UE5 configurada');
    }
    
    createCausticsSystem() {
        console.log('✨ Criando sistema de caustics (UE5 Water Caustics)...');
        
        // Projetor de caustics (como UE5 Caustics Component)
        const causticsGeometry = new THREE.PlaneGeometry(200, 200);
        const causticsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                causticsTexture: { value: null }, // Seria uma textura de caustics no UE5
                intensity: { value: this.config.causticsIntensity },
                scale: { value: this.config.causticsScale }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                uniform float scale;
                varying vec2 vUv;
                
                // Procedural caustics (sem textura, como no UE5 Material Editor)
                float causticPattern(vec2 uv) {
                    vec2 p = uv * scale;
                    
                    float c1 = sin(p.x * 3.0 + time * 2.0) * cos(p.y * 3.0 + time * 1.5);
                    float c2 = sin(p.x * 2.0 - time * 1.8) * cos(p.y * 4.0 - time * 2.2);
                    float c3 = sin(p.x * 5.0 + time * 0.8) * cos(p.y * 2.0 + time * 1.1);
                    
                    return (c1 + c2 + c3) * 0.333 * intensity;
                }
                
                void main() {
                    float caustics = causticPattern(vUv);
                    caustics = max(0.0, caustics);
                    
                    vec3 causticsColor = vec3(0.8, 1.0, 1.2) * caustics;
                    gl_FragColor = vec4(causticsColor, caustics * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.causticSystem = new THREE.Mesh(causticsGeometry, causticsMaterial);
        this.causticSystem.rotation.x = -Math.PI / 2;
        this.causticSystem.position.y = -29;
        this.scene.add(this.causticSystem);
        
        console.log('✅ Sistema de caustics UE5 criado');
    }
    
    createNiagaraInspiredParticles() {
        console.log('✨ Criando sistema de partículas (Niagara style)...');
        
        // Sistema de partículas inspirado no UE5 Niagara
        const particleCount = 2000;
        const particles = new THREE.BufferGeometry();
        
        // Atributos das partículas (como no UE5 Niagara)
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Posições iniciais
            positions[i3] = (Math.random() - 0.5) * 300;
            positions[i3 + 1] = Math.random() * 60 - 30;
            positions[i3 + 2] = (Math.random() - 0.5) * 300;
            
            // Velocidades (como UE5 Initial Velocity)
            velocities[i3] = (Math.random() - 0.5) * 0.05;
            velocities[i3 + 1] = Math.random() * 0.02 + 0.01;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;
            
            // Lifetime e size
            lifetimes[i] = Math.random() * 10;
            sizes[i] = 0.3 + Math.random() * 0.7;
            
            // Cores variadas (plâncton, bolhas, detritos)
            const colorType = Math.random();
            if (colorType < 0.4) {
                // Plâncton bioluminescente
                colors[i3] = 0.3 + Math.random() * 0.7;     // R
                colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
                colors[i3 + 2] = 1.0;                       // B
            } else if (colorType < 0.7) {
                // Bolhas de ar
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 1.0;
            } else {
                // Detritos orgânicos
                colors[i3] = 0.6 + Math.random() * 0.3;
                colors[i3 + 1] = 0.4 + Math.random() * 0.3;
                colors[i3 + 2] = 0.2 + Math.random() * 0.3;
            }
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Material das partículas (como UE5 Particle Material)
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                pointSize: { value: 2.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float pointSize;
                attribute float lifetime;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vLifetime;
                
                void main() {
                    vColor = color;
                    vLifetime = lifetime;
                    
                    // Pulsação baseada no lifetime (como UE5 Size over Life)
                    float pulse = sin(time * 3.0 + lifetime * 10.0) * 0.3 + 0.7;
                    gl_PointSize = size * pointSize * pulse;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vLifetime;
                
                void main() {
                    // Forma circular das partículas
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    // Alpha baseado na distância e lifetime
                    float alpha = (1.0 - dist * 2.0) * 0.8;
                    alpha *= sin(vLifetime * 0.5) * 0.5 + 0.5;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.niagaraParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.niagaraParticles);
        
        console.log('✅ Sistema Niagara-inspired criado');
    }
    
    createBuoyancyObjects() {
        console.log('⚓ Criando objetos com buoyancy (UE5 Buoyancy Component)...');
        
        // Criar objetos flutuantes que respondem às ondas
        const buoyantObjects = [
            { type: 'debris', count: 15, color: 0x8b4513 },
            { type: 'jellyfish', count: 8, color: 0xff69b4 },
            { type: 'kelp', count: 25, color: 0x228b22 }
        ];
        
        buoyantObjects.forEach(objType => {
            for (let i = 0; i < objType.count; i++) {
                let geometry, material;
                
                switch (objType.type) {
                    case 'debris':
                        geometry = new THREE.BoxGeometry(
                            0.5 + Math.random() * 1.0,
                            0.2 + Math.random() * 0.3,
                            0.8 + Math.random() * 1.2
                        );
                        break;
                    case 'jellyfish':
                        geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 8, 6);
                        break;
                    case 'kelp':
                        geometry = new THREE.CylinderGeometry(0.05, 0.1, 4 + Math.random() * 3, 6);
                        break;
                }
                
                material = new THREE.MeshStandardMaterial({
                    color: objType.color,
                    transparent: true,
                    opacity: objType.type === 'jellyfish' ? 0.6 : 0.9,
                    roughness: 0.7
                });
                
                const obj = new THREE.Mesh(geometry, material);
                obj.position.set(
                    (Math.random() - 0.5) * 150,
                    Math.random() * 20 - 10,
                    (Math.random() - 0.5) * 150
                );
                
                obj.userData = {
                    type: objType.type,
                    buoyancy: 0.8 + Math.random() * 0.4,
                    originalY: obj.position.y,
                    bobSpeed: 0.5 + Math.random() * 1.0,
                    bobAmount: 0.5 + Math.random() * 1.0
                };
                
                this.buoyancyObjects.push(obj);
                this.scene.add(obj);
            }
        });
        
        console.log('✅ Objetos com buoyancy UE5 criados');
    }
    
    setupUnderwaterAtmosphere() {
        console.log('🌫️ Configurando atmosfera subaquática (UE5 Atmosphere)...');
        
        // Partículas atmosféricas (como UE5 Volumetric Fog)
        const atmosphereGeometry = new THREE.BufferGeometry();
        const atmosphereCount = 500;
        const atmospherePositions = new Float32Array(atmosphereCount * 3);
        
        for (let i = 0; i < atmosphereCount * 3; i += 3) {
            atmospherePositions[i] = (Math.random() - 0.5) * 400;
            atmospherePositions[i + 1] = Math.random() * 100 - 50;
            atmospherePositions[i + 2] = (Math.random() - 0.5) * 400;
        }
        
        atmosphereGeometry.setAttribute('position', new THREE.BufferAttribute(atmospherePositions, 3));
        
        const atmosphereMaterial = new THREE.PointsMaterial({
            color: 0x4682b4,
            size: 1.5,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        const atmosphereParticles = new THREE.Points(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(atmosphereParticles);
        
        this.atmosphereSystem = atmosphereParticles;
        
        console.log('✅ Atmosfera subaquática UE5 configurada');
    }
    
    startAnimationLoop() {
        console.log('🔄 Iniciando loop de animação UE5...');
        
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            this.time += 0.016; // ~60fps
            
            // Atualizar uniforms do oceano
            if (this.oceanMaterial) {
                this.oceanMaterial.uniforms.time.value = this.time;
                this.oceanMaterial.uniforms.cameraPosition.value.copy(this.camera.position);
            }
            
            // Atualizar caustics
            if (this.causticSystem) {
                this.causticSystem.material.uniforms.time.value = this.time;
            }
            
            // Atualizar partículas Niagara
            this.updateNiagaraParticles();
            
            // Simular buoyancy physics (como UE5 Buoyancy Component)
            this.updateBuoyancyPhysics();
            
            // Movimento cinematográfico da câmera (como UE5 Cine Camera)
            this.updateCinematicCamera();
            
            // Renderizar
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
        console.log('✅ Loop de animação UE5 iniciado');
    }
    
    updateNiagaraParticles() {
        if (!this.niagaraParticles) return;
        
        const positions = this.niagaraParticles.geometry.attributes.position.array;
        const velocities = this.niagaraParticles.geometry.attributes.velocity.array;
        const lifetimes = this.niagaraParticles.geometry.attributes.lifetime.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const idx = i / 3;
            
            // Atualizar posições baseado nas velocidades
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Atualizar lifetime
            lifetimes[idx] += 0.016;
            
            // Adicionar turbulência (como UE5 Curl Noise Force)
            const turbulence = 0.001;
            velocities[i] += (Math.random() - 0.5) * turbulence;
            velocities[i + 2] += (Math.random() - 0.5) * turbulence;
            
            // Reset partículas que saem dos limites
            if (positions[i + 1] > 30 || lifetimes[idx] > 10) {
                positions[i] = (Math.random() - 0.5) * 300;
                positions[i + 1] = -30;
                positions[i + 2] = (Math.random() - 0.5) * 300;
                lifetimes[idx] = 0;
                
                // Reset velocidade
                velocities[i] = (Math.random() - 0.5) * 0.05;
                velocities[i + 1] = Math.random() * 0.02 + 0.01;
                velocities[i + 2] = (Math.random() - 0.5) * 0.05;
            }
        }
        
        this.niagaraParticles.geometry.attributes.position.needsUpdate = true;
        this.niagaraParticles.geometry.attributes.lifetime.needsUpdate = true;
        this.niagaraParticles.material.uniforms.time.value = this.time;
    }
    
    updateBuoyancyPhysics() {
        // Simular física de flutuabilidade (como UE5 Buoyancy Component)
        this.buoyancyObjects.forEach(obj => {
            const userData = obj.userData;
            
            if (userData.type === 'kelp') {
                // Algas balançam com corrente subaquática
                obj.rotation.z = Math.sin(this.time * userData.swaySpeed) * userData.swayAmount;
                obj.position.y = userData.originalY + Math.sin(this.time * 0.8) * 0.2;
            } else {
                // Objetos flutuantes seguem as ondas
                const waveHeight = this.calculateWaveHeightAt(obj.position.x, obj.position.z);
                const targetY = waveHeight * userData.buoyancy;
                
                // Interpolação suave (como UE5 Physics Damping)
                obj.position.y += (targetY - obj.position.y) * 0.05;
                
                // Rotação baseada na inclinação das ondas
                obj.rotation.x = Math.sin(this.time + obj.position.x * 0.01) * 0.1;
                obj.rotation.z = Math.cos(this.time + obj.position.z * 0.01) * 0.1;
            }
        });
    }
    
    calculateWaveHeightAt(x, z) {
        // Calcular altura das ondas Gerstner em uma posição específica
        let height = 0;
        
        this.config.waveDirections.forEach(wave => {
            const k = this.config.waveFrequency;
            const direction = new THREE.Vector2(wave.x, wave.z).normalize();
            const phase = k * (direction.x * x + direction.y * z) - this.time * this.config.waveSpeed;
            height += Math.sin(phase) * this.config.waveHeight * wave.steepness;
        });
        
        return height;
    }
    
    updateCinematicCamera() {
        // Movimento cinematográfico da câmera (como UE5 Sequencer)
        const radius = 60 + Math.sin(this.time * 0.1) * 10;
        const height = 25 + Math.cos(this.time * 0.08) * 5;
        const angle = this.time * 0.02;
        
        this.camera.position.x = Math.sin(angle) * radius;
        this.camera.position.y = height;
        this.camera.position.z = Math.cos(angle) * radius;
        
        // Olhar sempre para o centro com oscilação suave
        const lookAtY = Math.sin(this.time * 0.05) * 2;
        this.camera.lookAt(0, lookAtY, 0);
    }
    
    setupResponsiveHandling() {
        window.addEventListener('resize', () => {
            if (!this.camera || !this.renderer) return;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    // Interface pública para controles
    toggleWaves(enabled) {
        if (this.oceanMaterial) {
            this.oceanMaterial.uniforms.waveA.value.w = enabled ? this.config.waveHeight : 0;
            this.oceanMaterial.uniforms.waveB.value.w = enabled ? this.config.waveHeight * 0.7 : 0;
            this.oceanMaterial.uniforms.waveC.value.w = enabled ? this.config.waveHeight * 0.4 : 0;
            this.oceanMaterial.uniforms.waveD.value.w = enabled ? this.config.waveHeight * 0.3 : 0;
        }
        console.log(`🌊 Ondas UE5: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    toggleCaustics(enabled) {
        if (this.causticSystem) {
            this.causticSystem.visible = enabled;
            this.causticSystem.material.uniforms.intensity.value = enabled ? this.config.causticsIntensity : 0;
        }
        console.log(`✨ Caustics UE5: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    toggleParticles(enabled) {
        if (this.niagaraParticles) {
            this.niagaraParticles.visible = enabled;
        }
        if (this.atmosphereSystem) {
            this.atmosphereSystem.visible = enabled;
        }
        console.log(`✨ Partículas Niagara: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    toggleBuoyancy(enabled) {
        this.config.buoyancyEnabled = enabled;
        console.log(`⚓ Buoyancy Physics UE5: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    // Ajustar qualidade dinamicamente (como UE5 Scalability Settings)
    setQuality(level) {
        const qualitySettings = {
            low: { tessellation: 64, particles: 500, shadows: false },
            medium: { tessellation: 128, particles: 1000, shadows: true },
            high: { tessellation: 256, particles: 2000, shadows: true },
            ultra: { tessellation: 512, particles: 3000, shadows: true }
        };
        
        const settings = qualitySettings[level] || qualitySettings.medium;
        
        // Aplicar configurações
        if (this.oceanMesh && this.oceanMesh.geometry) {
            // Recrear geometria com nova tessellation
            this.recreateOceanWithTessellation(settings.tessellation);
        }
        
        if (this.niagaraParticles) {
            // Ajustar contagem de partículas
            this.adjustParticleCount(settings.particles);
        }
        
        if (this.renderer) {
            this.renderer.shadowMap.enabled = settings.shadows;
        }
        
        console.log(`🎮 Qualidade UE5 ajustada para: ${level}`);
    }
    
    recreateOceanWithTessellation(tessellation) {
        if (this.oceanMesh) {
            this.scene.remove(this.oceanMesh);
            
            const newGeometry = new THREE.PlaneGeometry(
                this.config.oceanSize,
                this.config.oceanSize,
                tessellation,
                tessellation
            );
            
            this.oceanMesh = new THREE.Mesh(newGeometry, this.oceanMaterial);
            this.oceanMesh.rotation.x = -Math.PI / 2;
            this.scene.add(this.oceanMesh);
        }
    }
    
    fallbackToBasicOcean() {
        console.warn('⚠️ Fallback para oceano básico...');
        
        // Oceano simplificado se UE5 system falhar
        const basicGeometry = new THREE.PlaneGeometry(200, 200, 32, 32);
        const basicMaterial = new THREE.MeshLambertMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8
        });
        
        const basicOcean = new THREE.Mesh(basicGeometry, basicMaterial);
        basicOcean.rotation.x = -Math.PI / 2;
        this.scene.add(basicOcean);
        
        // Animação básica
        const animateBasic = () => {
            requestAnimationFrame(animateBasic);
            basicOcean.rotation.z += 0.001;
            if (this.renderer && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        animateBasic();
    }
    
    // Cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('🧹 UE5 Ocean System destruído');
    }
}

// Export para uso global
window.UnrealEngine5OceanSystem = UnrealEngine5OceanSystem;

console.log('🎮 Unreal Engine 5 Ocean System carregado');
