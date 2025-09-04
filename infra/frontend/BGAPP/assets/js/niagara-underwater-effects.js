/**
 * 🌊 NIAGARA UNDERWATER EFFECTS - Inspirado no Unreal Engine
 * 
 * Sistema avançado de efeitos subaquáticos tipo "Niagara Falls"
 * Baseado nas técnicas do tutorial: https://dev.epicgames.com/community/learning/tutorials/qM1o/unreal-engine-ocean-simulation
 * 
 * FUNCIONALIDADES:
 * - Cascatas subaquáticas (Underwater Waterfalls)
 * - Sistemas de partículas Niagara-style
 * - Correntes oceânicas volumétricas
 * - Turbulência e vórtices
 * - Sedimentos e detritos flutuantes
 * - Iluminação volumétrica subaquática
 * - Caustics dinâmicas avançadas
 * 
 * @author MareDatum - BGAPP Team
 * @version 2.0.0 - Niagara Falls Edition
 */

// ES Module imports
import * as THREE from 'three';

class NiagaraUnderwaterEffects {
    constructor(scene, camera, renderer, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Configurações baseadas no UE5 Niagara System
        this.config = {
            // Underwater Waterfall Parameters
            waterfallIntensity: options.waterfallIntensity || 2.5,
            waterfallHeight: options.waterfallHeight || 50.0,
            waterfallWidth: options.waterfallWidth || 25.0,
            waterfallSpeed: options.waterfallSpeed || 1.8,
            
            // Particle System Parameters (Niagara-style)
            maxParticles: options.maxParticles || 15000,
            particleLifetime: options.particleLifetime || 8.0,
            particleSize: options.particleSize || 0.3,
            particleSpawnRate: options.particleSpawnRate || 250,
            
            // Ocean Current Parameters
            currentStrength: options.currentStrength || 1.2,
            currentTurbulence: options.currentTurbulence || 0.8,
            thermalLayers: options.thermalLayers || true,
            
            // Volumetric Lighting
            volumetricIntensity: options.volumetricIntensity || 1.5,
            causticsIntensity: options.causticsIntensity || 2.0,
            godRaysIntensity: options.godRaysIntensity || 1.8,
            
            // Performance Settings
            useGPUParticles: options.useGPUParticles !== false,
            lodLevels: options.lodLevels || 3,
            maxRenderDistance: options.maxRenderDistance || 200.0
        };
        
        this.time = 0;
        this.particleSystems = [];
        this.waterfallSystems = [];
        this.currentFields = [];
        this.volumetricLights = [];
        
        this.initialized = false;
        this.isRunning = false;
        
        console.log('🌊 Niagara Underwater Effects System iniciado');
    }
    
    async initialize() {
        console.log('🔧 Inicializando sistema Niagara Underwater Effects...');
        
        try {
            // Inicializar shaders customizados
            await this.loadNiagaraShaders();
            
            // Criar sistemas de cascatas subaquáticas
            this.createUnderwaterWaterfalls();
            
            // Inicializar sistemas de partículas
            this.initializeParticleSystems();
            
            // Configurar campos de corrente oceânica
            this.setupOceanCurrentFields();
            
            // Configurar iluminação volumétrica
            this.setupVolumetricLighting();
            
            // Inicializar sistemas de caustics avançadas
            this.initializeAdvancedCaustics();
            
            this.initialized = true;
            console.log('✅ Sistema Niagara Underwater Effects inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Niagara Underwater Effects:', error);
            throw error;
        }
    }
    
    async loadNiagaraShaders() {
        console.log('📝 Carregando shaders Niagara customizados...');
        
        // Vertex Shader para Partículas Subaquáticas (baseado no UE5 Niagara)
        this.particleVertexShader = `
            uniform float time;
            uniform vec3 cameraPosition;
            uniform float particleSize;
            uniform float currentStrength;
            uniform vec3 currentDirection;
            uniform float turbulenceIntensity;
            
            attribute vec3 particlePosition;
            attribute vec3 particleVelocity;
            attribute float particleLife;
            attribute float particleAge;
            attribute vec3 particleColor;
            attribute float particleOpacity;
            
            varying vec3 vParticleColor;
            varying float vParticleOpacity;
            varying float vDistanceToCamera;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vParticleLife;
            
            // Noise function para turbulência (UE5 Curl Noise)
            vec3 curlNoise(vec3 p, float time) {
                float e = 0.1;
                vec3 dx = vec3(e, 0.0, 0.0);
                vec3 dy = vec3(0.0, e, 0.0);
                vec3 dz = vec3(0.0, 0.0, e);
                
                // Simplified curl noise calculation
                vec3 p1 = p + dx;
                vec3 p2 = p - dx;
                vec3 p3 = p + dy;
                vec3 p4 = p - dy;
                vec3 p5 = p + dz;
                vec3 p6 = p - dz;
                
                float x1 = sin(p1.x + time) * cos(p1.y) * sin(p1.z);
                float x2 = sin(p2.x + time) * cos(p2.y) * sin(p2.z);
                float y1 = sin(p3.x + time) * cos(p3.y) * sin(p3.z);
                float y2 = sin(p4.x + time) * cos(p4.y) * sin(p4.z);
                float z1 = sin(p5.x + time) * cos(p5.y) * sin(p5.z);
                float z2 = sin(p6.x + time) * cos(p6.y) * sin(p6.z);
                
                return vec3(
                    (y1 - y2) / (2.0 * e),
                    (z1 - z2) / (2.0 * e),
                    (x1 - x2) / (2.0 * e)
                ) * turbulenceIntensity;
            }
            
            void main() {
                vUv = uv;
                vParticleColor = particleColor;
                vParticleLife = particleLife;
                
                // Calcular posição da partícula com física avançada
                vec3 pos = particlePosition;
                
                // Aplicar velocidade base
                pos += particleVelocity * particleAge;
                
                // Aplicar corrente oceânica (UE5 Fluid Simulation)
                vec3 currentForce = currentDirection * currentStrength * particleAge;
                pos += currentForce;
                
                // Aplicar turbulência (UE5 Curl Noise)
                vec3 turbulence = curlNoise(pos * 0.1, time * 0.5);
                pos += turbulence * 0.5;
                
                // Aplicar gravidade subaquática (densidade diferencial)
                float buoyancy = 0.8; // Água é mais densa que ar
                pos.y -= 9.8 * buoyancy * particleAge * particleAge * 0.5;
                
                // Calcular opacidade baseada na vida da partícula
                float lifeFactor = 1.0 - (particleAge / particleLife);
                vParticleOpacity = particleOpacity * lifeFactor * lifeFactor;
                
                // Calcular distância para LOD
                vDistanceToCamera = length(cameraPosition - pos);
                
                // Scaling baseado na distância (UE5 Screen Size)
                float distanceScale = 1.0 / (1.0 + vDistanceToCamera * 0.01);
                float finalSize = particleSize * distanceScale;
                
                vWorldPosition = pos;
                
                // Aplicar transformações finais
                vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * worldPosition;
                
                gl_Position = projectionMatrix * viewPosition;
                gl_PointSize = finalSize * (1000.0 / length(viewPosition.xyz));
            }
        `;
        
        // Fragment Shader para Partículas Subaquáticas
        this.particleFragmentShader = `
            precision highp float;
            
            uniform float time;
            uniform sampler2D particleTexture;
            uniform vec3 lightDirection;
            uniform float causticsIntensity;
            uniform float volumetricIntensity;
            
            varying vec3 vParticleColor;
            varying float vParticleOpacity;
            varying float vDistanceToCamera;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vParticleLife;
            
            // Caustics calculation (UE5 Water Caustics)
            float calculateUnderwaterCaustics(vec3 worldPos, float time) {
                vec2 causticsUv1 = worldPos.xz * 0.1 + time * 0.03;
                vec2 causticsUv2 = worldPos.xz * 0.15 - time * 0.02;
                
                float caustics1 = sin(causticsUv1.x * 8.0) * sin(causticsUv1.y * 6.0);
                float caustics2 = cos(causticsUv2.x * 6.0) * cos(causticsUv2.y * 8.0);
                
                float caustics = (caustics1 + caustics2) * 0.5;
                caustics = max(0.0, caustics) * causticsIntensity;
                
                // Modular por profundidade
                float depth = max(0.0, -worldPos.y) / 50.0;
                caustics *= exp(-depth * 0.2);
                
                return caustics;
            }
            
            // Volumetric scattering (UE5 Volumetric Fog)
            vec3 calculateVolumetricScattering(vec3 worldPos, vec3 lightDir) {
                float density = 0.1;
                float scattering = max(0.0, dot(normalize(worldPos), -lightDir));
                
                vec3 scatterColor = vec3(0.4, 0.7, 1.0) * scattering * density * volumetricIntensity;
                return scatterColor;
            }
            
            void main() {
                vec2 center = gl_PointCoord - 0.5;
                float distanceFromCenter = length(center);
                
                // Soft particle edges (UE5 Soft Particles)
                if (distanceFromCenter > 0.5) discard;
                
                float softEdge = 1.0 - smoothstep(0.3, 0.5, distanceFromCenter);
                
                // Aplicar textura de partícula
                vec4 textureColor = texture2D(particleTexture, gl_PointCoord);
                
                // Calcular caustics subaquáticas
                float caustics = calculateUnderwaterCaustics(vWorldPosition, time);
                
                // Calcular scattering volumétrico
                vec3 volumetricScatter = calculateVolumetricScattering(vWorldPosition, lightDirection);
                
                // Composição final da cor
                vec3 finalColor = vParticleColor * textureColor.rgb;
                finalColor += vec3(0.6, 0.9, 1.0) * caustics;
                finalColor += volumetricScatter;
                
                // Aplicar fade baseado na distância (UE5 Distance Fields)
                float distanceFade = 1.0 / (1.0 + vDistanceToCamera * 0.001);
                
                // Alpha final com soft edges
                float finalAlpha = vParticleOpacity * textureColor.a * softEdge * distanceFade;
                
                // Depth-based color tinting (água mais escura em profundidade)
                float depth = max(0.0, -vWorldPosition.y) / 100.0;
                finalColor = mix(finalColor, finalColor * vec3(0.2, 0.4, 0.8), depth);
                
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;
        
        // Shader para Cascatas Subaquáticas (Underwater Waterfalls)
        this.waterfallVertexShader = `
            uniform float time;
            uniform float waterfallSpeed;
            uniform float waterfallHeight;
            uniform vec2 waterfallDirection;
            uniform float turbulenceStrength;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying float vWaterfallFlow;
            varying vec3 vNormal;
            
            // Noise para turbulência da cascata
            float waterfallNoise(vec3 p, float time) {
                return sin(p.x * 2.0 + time) * cos(p.y * 1.5 + time * 0.8) * sin(p.z * 1.8 + time * 0.6);
            }
            
            void main() {
                vUv = uv;
                
                vec3 pos = position;
                
                // Simular fluxo da cascata subaquática
                float flowIntensity = (waterfallHeight - pos.y) / waterfallHeight;
                flowIntensity = clamp(flowIntensity, 0.0, 1.0);
                
                // Aplicar movimento de fluxo
                vec2 flowOffset = waterfallDirection * waterfallSpeed * time * flowIntensity;
                pos.xz += flowOffset;
                
                // Adicionar turbulência (UE5 Fluid Dynamics)
                float turbulence = waterfallNoise(pos, time) * turbulenceStrength * flowIntensity;
                pos += vec3(turbulence * 0.5, 0.0, turbulence * 0.3);
                
                vPosition = pos;
                vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                vWaterfallFlow = flowIntensity;
                
                // Calcular normal para iluminação
                vNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
        
        this.waterfallFragmentShader = `
            precision highp float;
            
            uniform float time;
            uniform float waterfallIntensity;
            uniform vec3 waterfallColor;
            uniform vec3 lightDirection;
            uniform float causticsIntensity;
            uniform float foamIntensity;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vWorldPosition;
            varying float vWaterfallFlow;
            varying vec3 vNormal;
            
            // Caustics para cascata subaquática
            float calculateWaterfallCaustics(vec2 uv, float flow, float time) {
                vec2 causticsUv = uv + vec2(time * 0.1, time * 0.15) * flow;
                
                float caustics1 = sin(causticsUv.x * 12.0) * cos(causticsUv.y * 8.0);
                float caustics2 = cos(causticsUv.x * 8.0 + 1.5) * sin(causticsUv.y * 10.0 + 1.0);
                
                float caustics = (caustics1 + caustics2) * 0.5 * flow;
                return max(0.0, caustics) * causticsIntensity;
            }
            
            // Espuma da cascata (UE5 Foam)
            float calculateWaterfallFoam(vec2 uv, float flow, float time) {
                vec2 foamUv = uv * 3.0 + time * 0.2;
                
                float foam1 = sin(foamUv.x * 6.0) * cos(foamUv.y * 4.0);
                float foam2 = cos(foamUv.x * 4.0 + 2.0) * sin(foamUv.y * 6.0 + 1.5);
                
                float foam = (foam1 + foam2) * 0.5 * flow * flow;
                return max(0.0, foam) * foamIntensity;
            }
            
            void main() {
                vec3 normal = normalize(vNormal);
                
                // Cor base da cascata
                vec3 baseColor = waterfallColor * waterfallIntensity;
                
                // Calcular caustics da cascata
                float caustics = calculateWaterfallCaustics(vUv, vWaterfallFlow, time);
                
                // Calcular espuma
                float foam = calculateWaterfallFoam(vUv, vWaterfallFlow, time);
                
                // Iluminação da cascata
                float lighting = max(0.3, dot(normal, normalize(lightDirection)));
                
                // Composição final
                vec3 finalColor = baseColor * lighting;
                finalColor += vec3(0.8, 1.0, 1.2) * caustics;
                finalColor += vec3(1.0, 1.0, 1.0) * foam * 0.8;
                
                // Alpha baseado no fluxo
                float alpha = 0.6 + vWaterfallFlow * 0.4;
                alpha += foam * 0.3;
                
                // Efeito de profundidade
                float depth = max(0.0, -vWorldPosition.y) / 50.0;
                finalColor = mix(finalColor, finalColor * vec3(0.3, 0.5, 0.9), depth * 0.5);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
        
        console.log('✅ Shaders Niagara carregados com sucesso');
    }
    
    createUnderwaterWaterfalls() {
        console.log('🌊 Criando cascatas subaquáticas Niagara-style...');
        
        // Definir localizações das cascatas subaquáticas
        const waterfallLocations = [
            { x: -20, y: 10, z: -15, intensity: 2.5, direction: [0.3, -0.8] },
            { x: 25, y: 15, z: 20, intensity: 2.0, direction: [-0.2, -0.9] },
            { x: -10, y: 20, z: 30, intensity: 1.8, direction: [0.5, -0.7] },
            { x: 35, y: 12, z: -25, intensity: 2.2, direction: [-0.4, -0.8] }
        ];
        
        waterfallLocations.forEach((location, index) => {
            const waterfall = this.createSingleWaterfall(location, index);
            this.waterfallSystems.push(waterfall);
            this.scene.add(waterfall.mesh);
        });
        
        console.log(`✅ ${waterfallLocations.length} cascatas subaquáticas criadas`);
    }
    
    createSingleWaterfall(location, index) {
        // Geometria da cascata (plano vertical com subdivisões)
        const geometry = new THREE.PlaneGeometry(
            this.config.waterfallWidth, 
            this.config.waterfallHeight, 
            32, 64
        );
        
        // Material com shaders customizados
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterfallSpeed: { value: this.config.waterfallSpeed },
                waterfallHeight: { value: this.config.waterfallHeight },
                waterfallDirection: { value: new THREE.Vector2(...location.direction) },
                turbulenceStrength: { value: this.config.currentTurbulence },
                waterfallIntensity: { value: location.intensity },
                waterfallColor: { value: new THREE.Vector3(0.4, 0.8, 1.2) },
                lightDirection: { value: new THREE.Vector3(0.5, -0.8, 0.3) },
                causticsIntensity: { value: this.config.causticsIntensity },
                foamIntensity: { value: 1.5 }
            },
            vertexShader: this.waterfallVertexShader,
            fragmentShader: this.waterfallFragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(location.x, location.y, location.z);
        mesh.rotation.x = Math.PI / 2; // Orientar verticalmente
        
        return {
            mesh,
            material,
            location,
            index,
            particleEmitter: this.createWaterfallParticleEmitter(location)
        };
    }
    
    createWaterfallParticleEmitter(location) {
        console.log('💫 Criando emissor de partículas para cascata...');
        
        const particleCount = Math.floor(this.config.maxParticles / 4); // Dividir entre cascatas
        const geometry = new THREE.BufferGeometry();
        
        // Arrays para atributos das partículas
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const ages = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        
        // Inicializar partículas
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Posição inicial (topo da cascata)
            positions[i3] = location.x + (Math.random() - 0.5) * this.config.waterfallWidth;
            positions[i3 + 1] = location.y + Math.random() * 5;
            positions[i3 + 2] = location.z + (Math.random() - 0.5) * 5;
            
            // Velocidade inicial (downward flow)
            velocities[i3] = location.direction[0] * (0.5 + Math.random() * 0.5);
            velocities[i3 + 1] = -2.0 - Math.random() * 2.0; // Movimento descendente
            velocities[i3 + 2] = location.direction[1] * (0.5 + Math.random() * 0.5);
            
            // Cor das partículas (azul-branco)
            colors[i3] = 0.6 + Math.random() * 0.4;     // R
            colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G  
            colors[i3 + 2] = 1.0;                       // B
            
            // Tempo de vida
            lifetimes[i] = this.config.particleLifetime * (0.8 + Math.random() * 0.4);
            ages[i] = Math.random() * lifetimes[i];
            opacities[i] = 0.7 + Math.random() * 0.3;
        }
        
        // Configurar geometria
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('particlePosition', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('particleVelocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('particleColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('particleLife', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('particleAge', new THREE.BufferAttribute(ages, 1));
        geometry.setAttribute('particleOpacity', new THREE.BufferAttribute(opacities, 1));
        
        // Material das partículas
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                cameraPosition: { value: this.camera.position },
                particleSize: { value: this.config.particleSize },
                currentStrength: { value: this.config.currentStrength },
                currentDirection: { value: new THREE.Vector3(...location.direction, -0.5) },
                turbulenceIntensity: { value: this.config.currentTurbulence },
                particleTexture: { value: this.createParticleTexture() },
                lightDirection: { value: new THREE.Vector3(0.5, -0.8, 0.3) },
                causticsIntensity: { value: this.config.causticsIntensity },
                volumetricIntensity: { value: this.config.volumetricIntensity }
            },
            vertexShader: this.particleVertexShader,
            fragmentShader: this.particleFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        
        return {
            system: particleSystem,
            geometry,
            material,
            particleCount,
            location
        };
    }
    
    createParticleTexture() {
        // Criar textura procedural para partículas (estilo UE5)
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Gradient radial para soft particles
        const gradient = context.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    initializeParticleSystems() {
        console.log('💫 Inicializando sistemas de partículas avançados...');
        
        // Criar sistema de partículas flutuantes (plâncton, sedimentos, detritos)
        this.createFloatingParticles();
        
        // Criar sistema de bolhas subaquáticas
        this.createUnderwaterBubbles();
        
        // Criar sistema de partículas de corrente
        this.createCurrentParticles();
        
        console.log('✅ Sistemas de partículas inicializados');
    }
    
    createFloatingParticles() {
        const particleCount = Math.floor(this.config.maxParticles * 0.4);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Distribuir partículas em volume oceânico
            positions[i3] = (Math.random() - 0.5) * 200;     // X
            positions[i3 + 1] = Math.random() * -100;        // Y (underwater)
            positions[i3 + 2] = (Math.random() - 0.5) * 200; // Z
            
            // Velocidades lentas e orgânicas
            velocities[i3] = (Math.random() - 0.5) * 0.2;
            velocities[i3 + 1] = Math.random() * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
            
            // Cores orgânicas (plâncton-like)
            const colorType = Math.random();
            if (colorType < 0.3) {
                // Plâncton verde
                colors[i3] = 0.2 + Math.random() * 0.3;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 0.3 + Math.random() * 0.3;
            } else if (colorType < 0.6) {
                // Sedimentos marrons
                colors[i3] = 0.6 + Math.random() * 0.3;
                colors[i3 + 1] = 0.4 + Math.random() * 0.3;
                colors[i3 + 2] = 0.2 + Math.random() * 0.2;
            } else {
                // Detritos azulados
                colors[i3] = 0.4 + Math.random() * 0.3;
                colors[i3 + 1] = 0.6 + Math.random() * 0.3;
                colors[i3 + 2] = 0.9 + Math.random() * 0.1;
            }
            
            sizes[i] = 0.1 + Math.random() * 0.4;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const floatingParticles = new THREE.Points(geometry, material);
        this.scene.add(floatingParticles);
        
        this.particleSystems.push({
            type: 'floating',
            system: floatingParticles,
            geometry,
            material,
            particleCount
        });
    }
    
    createUnderwaterBubbles() {
        const bubbleCount = Math.floor(this.config.maxParticles * 0.2);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(bubbleCount * 3);
        const velocities = new Float32Array(bubbleCount * 3);
        const sizes = new Float32Array(bubbleCount);
        
        for (let i = 0; i < bubbleCount; i++) {
            const i3 = i * 3;
            
            // Posições iniciais no fundo oceânico
            positions[i3] = (Math.random() - 0.5) * 150;
            positions[i3 + 1] = -80 + Math.random() * 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 150;
            
            // Velocidade ascendente (bolhas sobem)
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = 0.5 + Math.random() * 1.0; // Upward
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
            
            sizes[i] = 0.2 + Math.random() * 0.8;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const bubbleSystem = new THREE.Points(geometry, material);
        this.scene.add(bubbleSystem);
        
        this.particleSystems.push({
            type: 'bubbles',
            system: bubbleSystem,
            geometry,
            material,
            particleCount: bubbleCount
        });
    }
    
    createCurrentParticles() {
        const currentCount = Math.floor(this.config.maxParticles * 0.3);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(currentCount * 3);
        const velocities = new Float32Array(currentCount * 3);
        const colors = new Float32Array(currentCount * 3);
        
        for (let i = 0; i < currentCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 300;
            positions[i3 + 1] = -20 + Math.random() * -60;
            positions[i3 + 2] = (Math.random() - 0.5) * 300;
            
            // Velocidades seguindo correntes oceânicas
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 0.5;
            velocities[i3] = Math.cos(angle) * speed;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = Math.sin(angle) * speed;
            
            // Cores azuis transparentes
            colors[i3] = 0.3 + Math.random() * 0.2;
            colors[i3 + 1] = 0.7 + Math.random() * 0.2;
            colors[i3 + 2] = 1.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const currentSystem = new THREE.Points(geometry, material);
        this.scene.add(currentSystem);
        
        this.particleSystems.push({
            type: 'current',
            system: currentSystem,
            geometry,
            material,
            particleCount: currentCount
        });
    }
    
    setupOceanCurrentFields() {
        console.log('🌊 Configurando campos de corrente oceânica...');
        
        // Definir correntes oceânicas principais (baseado na realidade angolana)
        this.currentFields = [
            {
                name: 'Benguela Current',
                center: new THREE.Vector3(0, -30, 0),
                radius: 100,
                strength: 1.5,
                direction: new THREE.Vector3(0.8, 0.1, -0.6),
                temperature: 18 // Celsius
            },
            {
                name: 'Angola Current',
                center: new THREE.Vector3(-50, -20, 50),
                radius: 80,
                strength: 1.2,
                direction: new THREE.Vector3(-0.6, 0.2, 0.8),
                temperature: 24
            },
            {
                name: 'Coastal Upwelling',
                center: new THREE.Vector3(30, -40, -30),
                radius: 60,
                strength: 0.8,
                direction: new THREE.Vector3(0.3, 0.9, 0.3),
                temperature: 16
            }
        ];
        
        console.log(`✅ ${this.currentFields.length} campos de corrente configurados`);
    }
    
    setupVolumetricLighting() {
        console.log('💡 Configurando iluminação volumétrica subaquática...');
        
        // God Rays subaquáticos (UE5 Volumetric Lighting)
        const godRaysGeometry = new THREE.ConeGeometry(30, 100, 8, 1, true);
        const godRaysMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: this.config.godRaysIntensity },
                color: { value: new THREE.Vector3(0.8, 0.9, 1.0) }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Slight movement for dynamic effect
                    pos.x += sin(time * 0.5 + pos.y * 0.1) * 0.5;
                    pos.z += cos(time * 0.3 + pos.y * 0.15) * 0.3;
                    
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                uniform vec3 color;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    float alpha = (1.0 - vUv.y) * 0.3 * intensity;
                    alpha *= sin(time * 2.0 + vPosition.y * 0.1) * 0.5 + 0.5;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        // Criar múltiplos God Rays
        for (let i = 0; i < 5; i++) {
            const godRays = new THREE.Mesh(godRaysGeometry, godRaysMaterial.clone());
            godRays.position.set(
                (Math.random() - 0.5) * 200,
                20 + Math.random() * 30,
                (Math.random() - 0.5) * 200
            );
            godRays.rotation.x = Math.PI;
            
            this.volumetricLights.push(godRays);
            this.scene.add(godRays);
        }
        
        console.log('✅ Iluminação volumétrica configurada');
    }
    
    initializeAdvancedCaustics() {
        console.log('✨ Inicializando sistema de caustics avançadas...');
        
        // Plano para projeção de caustics no fundo oceânico
        const causticsGeometry = new THREE.PlaneGeometry(300, 300, 128, 128);
        const causticsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: this.config.causticsIntensity },
                scale: { value: 0.05 },
                speed: { value: 0.02 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                uniform float scale;
                uniform float speed;
                
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                float causticPattern(vec2 uv, float time) {
                    vec2 p = uv * scale;
                    
                    float caustic1 = sin(p.x * 8.0 + time * speed * 10.0) * cos(p.y * 6.0 + time * speed * 8.0);
                    float caustic2 = cos(p.x * 6.0 + time * speed * 12.0 + 1.5) * sin(p.y * 8.0 + time * speed * 9.0 + 2.0);
                    float caustic3 = sin(p.x * 10.0 + time * speed * 7.0 + 3.0) * cos(p.y * 4.0 + time * speed * 11.0 + 1.0);
                    
                    return (caustic1 + caustic2 + caustic3) / 3.0;
                }
                
                void main() {
                    vec2 uv1 = vWorldPosition.xz + time * speed;
                    vec2 uv2 = vWorldPosition.xz * 1.3 - time * speed * 0.7;
                    vec2 uv3 = vWorldPosition.xz * 0.8 + time * speed * 1.2;
                    
                    float caustic1 = causticPattern(uv1, time);
                    float caustic2 = causticPattern(uv2, time);
                    float caustic3 = causticPattern(uv3, time);
                    
                    float finalCaustic = (caustic1 + caustic2 * 0.7 + caustic3 * 0.5) / 2.2;
                    finalCaustic = max(0.0, finalCaustic) * intensity;
                    
                    vec3 causticsColor = vec3(0.6, 0.9, 1.2) * finalCaustic;
                    
                    gl_FragColor = vec4(causticsColor, finalCaustic * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const causticsMesh = new THREE.Mesh(causticsGeometry, causticsMaterial);
        causticsMesh.rotation.x = -Math.PI / 2;
        causticsMesh.position.y = -80;
        
        this.scene.add(causticsMesh);
        this.causticsMesh = causticsMesh;
        
        console.log('✅ Sistema de caustics avançadas inicializado');
    }
    
    start() {
        if (!this.initialized) {
            console.warn('⚠️ Sistema não inicializado. Execute initialize() primeiro.');
            return;
        }
        
        this.isRunning = true;
        console.log('▶️ Sistema Niagara Underwater Effects iniciado');
    }
    
    stop() {
        this.isRunning = false;
        console.log('⏸️ Sistema Niagara Underwater Effects pausado');
    }
    
    update(deltaTime) {
        if (!this.isRunning || !this.initialized) return;
        
        this.time += deltaTime;
        
        // Atualizar cascatas subaquáticas
        this.updateWaterfalls(deltaTime);
        
        // Atualizar sistemas de partículas
        this.updateParticleSystems(deltaTime);
        
        // Atualizar iluminação volumétrica
        this.updateVolumetricLighting(deltaTime);
        
        // Atualizar caustics
        this.updateCaustics(deltaTime);
        
        // Atualizar campos de corrente
        this.updateCurrentFields(deltaTime);
    }
    
    updateWaterfalls(deltaTime) {
        this.waterfallSystems.forEach(waterfall => {
            // Atualizar uniforms do material
            waterfall.material.uniforms.time.value = this.time;
            
            // Atualizar sistema de partículas da cascata
            if (waterfall.particleEmitter) {
                waterfall.particleEmitter.material.uniforms.time.value = this.time;
                waterfall.particleEmitter.material.uniforms.cameraPosition.value.copy(this.camera.position);
                
                // Atualizar posições das partículas
                this.updateWaterfallParticles(waterfall.particleEmitter, deltaTime);
            }
        });
    }
    
    updateWaterfallParticles(emitter, deltaTime) {
        const positions = emitter.geometry.attributes.particlePosition.array;
        const velocities = emitter.geometry.attributes.particleVelocity.array;
        const ages = emitter.geometry.attributes.particleAge.array;
        const lifetimes = emitter.geometry.attributes.particleLife.array;
        
        for (let i = 0; i < emitter.particleCount; i++) {
            const i3 = i * 3;
            
            // Atualizar idade da partícula
            ages[i] += deltaTime;
            
            // Reset partícula se expirou
            if (ages[i] > lifetimes[i]) {
                ages[i] = 0;
                
                // Reset posição no topo da cascata
                positions[i3] = emitter.location.x + (Math.random() - 0.5) * this.config.waterfallWidth;
                positions[i3 + 1] = emitter.location.y + Math.random() * 5;
                positions[i3 + 2] = emitter.location.z + (Math.random() - 0.5) * 5;
                
                // Reset velocidade
                velocities[i3] = emitter.location.direction[0] * (0.5 + Math.random() * 0.5);
                velocities[i3 + 1] = -2.0 - Math.random() * 2.0;
                velocities[i3 + 2] = emitter.location.direction[1] * (0.5 + Math.random() * 0.5);
            } else {
                // Atualizar posição baseada na velocidade
                positions[i3] += velocities[i3] * deltaTime;
                positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
                positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
                
                // Aplicar força da corrente oceânica
                const currentForce = this.calculateCurrentForce(
                    new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2])
                );
                
                positions[i3] += currentForce.x * deltaTime;
                positions[i3 + 1] += currentForce.y * deltaTime;
                positions[i3 + 2] += currentForce.z * deltaTime;
            }
        }
        
        emitter.geometry.attributes.particlePosition.needsUpdate = true;
        emitter.geometry.attributes.particleAge.needsUpdate = true;
    }
    
    updateParticleSystems(deltaTime) {
        this.particleSystems.forEach(system => {
            const positions = system.geometry.attributes.position.array;
            const velocities = system.geometry.attributes.velocity.array;
            
            for (let i = 0; i < system.particleCount; i++) {
                const i3 = i * 3;
                
                // Atualizar posição
                positions[i3] += velocities[i3] * deltaTime;
                positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
                positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
                
                // Aplicar comportamentos específicos por tipo
                if (system.type === 'bubbles') {
                    // Bolhas sobem e podem "pop" na superfície
                    if (positions[i3 + 1] > 0) {
                        positions[i3 + 1] = -80 + Math.random() * 20;
                        positions[i3] = (Math.random() - 0.5) * 150;
                        positions[i3 + 2] = (Math.random() - 0.5) * 150;
                    }
                } else if (system.type === 'floating') {
                    // Partículas flutuantes com movimento orgânico
                    velocities[i3] += (Math.random() - 0.5) * 0.01;
                    velocities[i3 + 1] += (Math.random() - 0.5) * 0.005;
                    velocities[i3 + 2] += (Math.random() - 0.5) * 0.01;
                    
                    // Limitar velocidades
                    velocities[i3] = Math.max(-0.3, Math.min(0.3, velocities[i3]));
                    velocities[i3 + 1] = Math.max(-0.1, Math.min(0.1, velocities[i3 + 1]));
                    velocities[i3 + 2] = Math.max(-0.3, Math.min(0.3, velocities[i3 + 2]));
                } else if (system.type === 'current') {
                    // Partículas de corrente seguem campos de fluxo
                    const currentForce = this.calculateCurrentForce(
                        new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2])
                    );
                    
                    velocities[i3] += currentForce.x * deltaTime * 0.1;
                    velocities[i3 + 1] += currentForce.y * deltaTime * 0.1;
                    velocities[i3 + 2] += currentForce.z * deltaTime * 0.1;
                }
                
                // Wrap around boundaries
                if (Math.abs(positions[i3]) > 150) positions[i3] *= -1;
                if (Math.abs(positions[i3 + 2]) > 150) positions[i3 + 2] *= -1;
                if (positions[i3 + 1] > 0) positions[i3 + 1] = -100;
                if (positions[i3 + 1] < -100) positions[i3 + 1] = -10;
            }
            
            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.velocity.needsUpdate = true;
        });
    }
    
    updateVolumetricLighting(deltaTime) {
        this.volumetricLights.forEach((light, index) => {
            if (light.material && light.material.uniforms) {
                light.material.uniforms.time.value = this.time + index * 0.5;
            }
            
            // Movimento sutil dos God Rays
            light.position.x += Math.sin(this.time * 0.2 + index) * 0.1;
            light.position.z += Math.cos(this.time * 0.15 + index) * 0.08;
        });
    }
    
    updateCaustics(deltaTime) {
        if (this.causticsMesh && this.causticsMesh.material.uniforms) {
            this.causticsMesh.material.uniforms.time.value = this.time;
        }
    }
    
    updateCurrentFields(deltaTime) {
        // Atualizar dinâmica das correntes oceânicas
        this.currentFields.forEach((field, index) => {
            // Rotação lenta das correntes
            const angle = this.time * 0.1 + index * Math.PI * 0.5;
            field.direction.x = Math.cos(angle) * 0.8;
            field.direction.z = Math.sin(angle) * 0.6;
            
            // Variação da intensidade
            field.strength = field.strength * (0.9 + 0.2 * Math.sin(this.time * 0.3 + index));
        });
    }
    
    calculateCurrentForce(position) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        
        this.currentFields.forEach(field => {
            const distance = position.distanceTo(field.center);
            
            if (distance < field.radius) {
                // Calcular influência baseada na distância
                const influence = 1.0 - (distance / field.radius);
                const force = field.direction.clone().multiplyScalar(field.strength * influence);
                
                totalForce.add(force);
            }
        });
        
        return totalForce;
    }
    
    // Métodos de configuração dinâmica
    setWaterfallIntensity(intensity) {
        this.config.waterfallIntensity = intensity;
        this.waterfallSystems.forEach(waterfall => {
            waterfall.material.uniforms.waterfallIntensity.value = intensity;
        });
    }
    
    setParticleCount(count) {
        this.config.maxParticles = count;
        // Recriar sistemas de partículas seria necessário
        console.log(`🔄 Contagem de partículas atualizada para ${count}`);
    }
    
    setCurrentStrength(strength) {
        this.config.currentStrength = strength;
        this.currentFields.forEach(field => {
            field.strength *= strength;
        });
    }
    
    setCausticsIntensity(intensity) {
        this.config.causticsIntensity = intensity;
        if (this.causticsMesh) {
            this.causticsMesh.material.uniforms.intensity.value = intensity;
        }
    }
    
    // Método de limpeza
    dispose() {
        console.log('🧹 Limpando recursos Niagara Underwater Effects...');
        
        // Limpar sistemas de partículas
        this.particleSystems.forEach(system => {
            this.scene.remove(system.system);
            system.geometry.dispose();
            system.material.dispose();
        });
        
        // Limpar cascatas
        this.waterfallSystems.forEach(waterfall => {
            this.scene.remove(waterfall.mesh);
            waterfall.mesh.geometry.dispose();
            waterfall.material.dispose();
            
            if (waterfall.particleEmitter) {
                this.scene.remove(waterfall.particleEmitter.system);
                waterfall.particleEmitter.geometry.dispose();
                waterfall.particleEmitter.material.dispose();
            }
        });
        
        // Limpar iluminação volumétrica
        this.volumetricLights.forEach(light => {
            this.scene.remove(light);
            light.geometry.dispose();
            light.material.dispose();
        });
        
        // Limpar caustics
        if (this.causticsMesh) {
            this.scene.remove(this.causticsMesh);
            this.causticsMesh.geometry.dispose();
            this.causticsMesh.material.dispose();
        }
        
        console.log('✅ Recursos limpos com sucesso');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.NiagaraUnderwaterEffects = NiagaraUnderwaterEffects;
}

export default NiagaraUnderwaterEffects;
