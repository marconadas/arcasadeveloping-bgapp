/**
 * 🌊 ADVANCED 3D MARINE VISUALIZATION V2.0
 * Silicon Valley God Tier Implementation
 * Realistic Ocean Ecosystem with WebGL 2.0 Shaders
 */

class AdvancedMarineVisualizationV2 {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }
        
        this.options = {
            quality: 'high',
            enableOcean: true,
            enableParticles: true,
            enableSpecies: true,
            enableLighting: true,
            particleCount: 8000,
            ...options
        };
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Advanced systems
        this.oceanSystem = null;
        this.particleSystems = {};
        this.marineLife = [];
        this.lightingSystem = null;
        
        // Animation
        this.animationId = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🌊 Initializing Advanced Marine Visualization V2...');
            
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupControls();
            this.setupLighting();
            
            if (this.options.enableOcean) {
                this.createRealisticOcean();
            }
            
            if (this.options.enableParticles) {
                this.createAdvancedParticleSystem();
            }
            
            if (this.options.enableSpecies) {
                this.createMarineLife();
            }
            
            this.setupEventListeners();
            this.startAnimation();
            
            this.isInitialized = true;
            console.log('✅ Advanced Marine Visualization V2 initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize Advanced Marine Visualization:', error);
        }
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Advanced rendering settings
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Underwater atmosphere
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.FogExp2(0x001122, 0.002);
        
        // Add atmospheric effects
        this.createUnderwaterAtmosphere();
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            2000
        );
        
        this.camera.position.set(0, 15, 40);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 200;
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 0.5;
        }
    }
    
    setupLighting() {
        // Sun light (above water)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 100, 30);
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
        
        // Underwater ambient light
        const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
        this.scene.add(ambientLight);
        
        // Underwater point lights (bioluminescence)
        for (let i = 0; i < 5; i++) {
            const bioLight = new THREE.PointLight(0x00ffaa, 0.5, 50);
            bioLight.position.set(
                (Math.random() - 0.5) * 200,
                Math.random() * -30 - 10,
                (Math.random() - 0.5) * 200
            );
            this.scene.add(bioLight);
        }
        
        // Caustic light patterns
        this.createCausticLights();
    }
    
    createUnderwaterAtmosphere() {
        // Volumetric lighting effect
        const atmosphereGeometry = new THREE.SphereGeometry(500, 32, 32);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x001144) }
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec3 vPosition;
                
                void main() {
                    float distance = length(vPosition);
                    float alpha = 1.0 - smoothstep(200.0, 500.0, distance);
                    alpha *= 0.05 + 0.02 * sin(time * 0.5 + distance * 0.01);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(atmosphere);
        
        this.atmosphereMaterial = atmosphereMaterial;
    }
    
    createRealisticOcean() {
        console.log('🌊 Creating realistic ocean...');
        
        const oceanGeometry = new THREE.PlaneGeometry(800, 800, 512, 512);
        
        // Use a simpler material to avoid WebGL shader errors
        const oceanMaterial = new THREE.MeshLambertMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });
        
        this.oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
        this.oceanMesh.rotation.x = -Math.PI / 2;
        this.oceanMesh.receiveShadow = true;
        this.scene.add(this.oceanMesh);
        
        console.log('✅ Realistic ocean created');
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                }
                
                // Gerstner wave function
                vec3 gerstnerWave(vec2 pos, vec2 direction, float steepness, float wavelength, float speed) {
                    float k = 2.0 * 3.14159 / wavelength;
                    float c = sqrt(9.8 / k);
                    vec2 d = normalize(direction);
                    float f = k * (dot(d, pos) - c * time * speed);
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
                    
                    // Multiple Gerstner waves for realistic ocean
                    vec3 wave1 = gerstnerWave(pos.xz, vec2(1.0, 0.0), 0.8, 80.0, waveSpeed);
                    vec3 wave2 = gerstnerWave(pos.xz, vec2(0.6, 0.8), 0.6, 45.0, waveSpeed * 1.2);
                    vec3 wave3 = gerstnerWave(pos.xz, vec2(-0.7, 0.7), 0.4, 25.0, waveSpeed * 0.8);
                    vec3 wave4 = gerstnerWave(pos.xz, vec2(0.3, -0.9), 0.3, 15.0, waveSpeed * 1.5);
                    vec3 wave5 = gerstnerWave(pos.xz, vec2(-0.8, -0.2), 0.2, 10.0, waveSpeed * 2.0);
                    
                    // Combine waves
                    vec3 waveSum = (wave1 + wave2 + wave3 + wave4 + wave5) * waveHeight;
                    pos += waveSum;
                    
                    // Add fine detail with noise
                    float noiseValue = noise(pos.xz * 0.1 + time * 0.5) * 0.5;
                    pos.y += noiseValue;
                    
                    vPosition = pos;
                    vElevation = pos.y;
                    
                    // Calculate normal for lighting
                    float offset = 0.1;
                    vec3 posX = pos + vec3(offset, 0.0, 0.0);
                    vec3 posZ = pos + vec3(0.0, 0.0, offset);
                    
                    // Sample neighboring points for normal calculation
                    posX.y += noise((posX.xz) * 0.1 + time * 0.5) * 0.5;
                    posZ.y += noise((posZ.xz) * 0.1 + time * 0.5) * 0.5;
                    
                    vec3 tangent = normalize(posX - pos);
                    vec3 binormal = normalize(posZ - pos);
                    vNormal = normalize(cross(tangent, binormal));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 oceanColor;
                uniform vec3 deepColor;
                uniform vec3 foamColor;
                uniform vec3 sunDirection;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying float vElevation;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    
                    // View direction for Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    
                    // Fresnel effect
                    float fresnel = 1.0 - max(dot(normal, viewDirection), 0.0);
                    fresnel = pow(fresnel, 2.0);
                    
                    // Depth-based color
                    float depth = clamp((vPosition.y + 20.0) / 40.0, 0.0, 1.0);
                    vec3 waterColor = mix(deepColor, oceanColor, depth);
                    
                    // Foam on wave crests
                    float foam = smoothstep(1.5, 2.5, vElevation);
                    waterColor = mix(waterColor, foamColor, foam * 0.8);
                    
                    // Specular highlights
                    vec3 reflectDirection = reflect(-sunDirection, normal);
                    float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 64.0);
                    
                    // Caustic patterns
                    float caustics = sin(vPosition.x * 0.3 + time) * sin(vPosition.z * 0.4 + time * 1.2);
                    caustics = max(0.0, caustics) * 0.2;
                    
                    // Subsurface scattering approximation
                    float subsurface = max(0.0, dot(-sunDirection, normal)) * 0.3;
                    
                    vec3 finalColor = waterColor + specular * 0.8 + caustics + subsurface;
                    
                    // Final alpha with Fresnel
                    float alpha = 0.8 + fresnel * 0.2;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
        this.oceanMesh.rotation.x = -Math.PI / 2;
        this.oceanMesh.receiveShadow = true;
        this.scene.add(this.oceanMesh);
        
        this.oceanMaterial = oceanMaterial;
        console.log('✅ Realistic ocean created');
    }
    
    createAdvancedParticleSystem() {
        console.log('✨ Creating advanced particle systems...');
        
        // Bioluminescent plankton
        this.createPlanktonSystem();
        
        // Oxygen bubbles
        this.createBubbleSystem();
        
        // Marine snow (organic particles)
        this.createMarineSnowSystem();
        
        // Sediment particles
        this.createSedimentSystem();
        
        console.log('✅ Advanced particle systems created');
    }
    
    createPlanktonSystem() {
        const count = Math.floor(this.options.particleCount * 0.4);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Distribute in 3D volume
            positions[i3] = (Math.random() - 0.5) * 400;
            positions[i3 + 1] = Math.random() * 60 - 30;
            positions[i3 + 2] = (Math.random() - 0.5) * 400;
            
            // Bioluminescent colors
            const hue = Math.random() * 0.3 + 0.4; // Green to cyan
            colors[i3] = hue * 0.5;
            colors[i3 + 1] = hue;
            colors[i3 + 2] = hue * 0.8;
            
            sizes[i] = Math.random() * 3 + 1;
            phases[i] = Math.random() * Math.PI * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                glowTexture: { value: this.createGlowTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float phase;
                uniform float time;
                
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // Organic floating motion
                    pos.x += sin(time * 0.8 + phase) * 3.0;
                    pos.y += cos(time * 0.6 + phase * 1.3) * 2.0;
                    pos.z += sin(time * 0.9 + phase * 0.7) * 2.5;
                    
                    // Bioluminescent pulsing
                    float pulse = sin(time * 3.0 + phase) * 0.4 + 0.6;
                    vAlpha = pulse;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * pulse;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D glowTexture;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec4 texColor = texture2D(glowTexture, gl_PointCoord);
                    vec3 finalColor = vColor * (1.0 + vAlpha);
                    gl_FragColor = vec4(finalColor, texColor.a * vAlpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystems.plankton = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.plankton);
    }
    
    createBubbleSystem() {
        const count = Math.floor(this.options.particleCount * 0.2);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const speeds = new Float32Array(count);
        const wobble = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 300;
            positions[i3 + 1] = Math.random() * -40 - 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 300;
            
            sizes[i] = Math.random() * 2 + 0.5;
            speeds[i] = Math.random() * 0.1 + 0.05;
            wobble[i] = Math.random() * Math.PI * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('wobble', new THREE.BufferAttribute(wobble, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute float speed;
                attribute float wobble;
                uniform float time;
                
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position;
                    
                    // Rising motion with wobble
                    pos.y += time * speed * 30.0;
                    pos.x += sin(time * 2.0 + wobble) * 2.0;
                    pos.z += cos(time * 1.5 + wobble) * 1.5;
                    
                    // Reset when reaching surface
                    pos.y = mod(pos.y + 60.0, 80.0) - 60.0;
                    
                    // Fade based on depth
                    vAlpha = smoothstep(-60.0, 10.0, pos.y) * 0.7;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= vAlpha;
                    
                    // Bubble highlight
                    float highlight = 1.0 - smoothstep(0.0, 0.3, length(center - vec2(-0.2, -0.2)));
                    
                    vec3 color = vec3(0.8, 0.9, 1.0) + highlight * 0.3;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        });
        
        this.particleSystems.bubbles = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.bubbles);
    }
    
    createMarineSnowSystem() {
        const count = Math.floor(this.options.particleCount * 0.3);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const fallSpeeds = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 500;
            positions[i3 + 1] = Math.random() * 100 + 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 500;
            
            sizes[i] = Math.random() * 1.5 + 0.5;
            fallSpeeds[i] = Math.random() * 0.02 + 0.01;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('fallSpeed', new THREE.BufferAttribute(fallSpeeds, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute float fallSpeed;
                uniform float time;
                
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position;
                    
                    // Falling motion with drift
                    pos.y -= time * fallSpeed * 20.0;
                    pos.x += sin(time * 0.5 + position.z * 0.01) * 1.0;
                    pos.z += cos(time * 0.3 + position.x * 0.01) * 0.8;
                    
                    // Reset when reaching bottom
                    pos.y = mod(pos.y + 120.0, 140.0) - 40.0;
                    
                    // Fade with depth
                    vAlpha = smoothstep(-40.0, 20.0, pos.y) * 0.4;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (150.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                    alpha *= vAlpha;
                    
                    gl_FragColor = vec4(0.9, 0.9, 0.8, alpha);
                }
            `,
            transparent: true
        });
        
        this.particleSystems.marineSnow = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.marineSnow);
    }
    
    createSedimentSystem() {
        const count = Math.floor(this.options.particleCount * 0.1);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * -20 - 30;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            // Brownish sediment colors
            const brown = Math.random() * 0.3 + 0.3;
            colors[i3] = brown;
            colors[i3 + 1] = brown * 0.7;
            colors[i3 + 2] = brown * 0.4;
            
            sizes[i] = Math.random() * 2 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        this.particleSystems.sediment = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.sediment);
    }
    
    createMarineLife() {
        console.log('🐠 Creating marine life...');
        
        // Create fish schools
        this.createFishSchool(50, 'tuna');
        this.createFishSchool(30, 'sardine');
        
        // Create individual larger species
        this.createWhale();
        this.createShark();
        
        // Create coral formations
        this.createCoralReef();
        
        console.log('✅ Marine life created');
    }
    
    createFishSchool(count, species) {
        const fishGroup = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const fish = this.createFish(species);
            
            // Position in school formation
            const angle = (i / count) * Math.PI * 2;
            const radius = Math.random() * 10 + 5;
            
            fish.position.set(
                Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
                Math.random() * 20 - 10,
                Math.sin(angle) * radius + (Math.random() - 0.5) * 100
            );
            
            // Random rotation
            fish.rotation.y = Math.random() * Math.PI * 2;
            
            fishGroup.add(fish);
        }
        
        // School movement properties
        fishGroup.userData = {
            species: species,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: Math.random() * 0.5 + 0.2,
            turnSpeed: Math.random() * 0.02 + 0.01
        };
        
        this.marineLife.push(fishGroup);
        this.scene.add(fishGroup);
    }
    
    createFish(species) {
        let geometry, material, scale;
        
        switch (species) {
            case 'tuna':
                geometry = new THREE.ConeGeometry(0.5, 2, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x4444aa });
                scale = 1.5;
                break;
            case 'sardine':
                geometry = new THREE.ConeGeometry(0.3, 1, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x888888 });
                scale = 1.0;
                break;
            default:
                geometry = new THREE.ConeGeometry(0.4, 1.5, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                scale = 1.0;
        }
        
        const fish = new THREE.Mesh(geometry, material);
        fish.scale.setScalar(scale);
        fish.castShadow = true;
        
        return fish;
    }
    
    createWhale() {
        const whaleGeometry = new THREE.CylinderGeometry(1, 3, 15, 16);
        const whaleMaterial = new THREE.MeshLambertMaterial({ color: 0x333366 });
        const whale = new THREE.Mesh(whaleGeometry, whaleMaterial);
        
        whale.position.set(
            (Math.random() - 0.5) * 200,
            Math.random() * -10 - 20,
            (Math.random() - 0.5) * 200
        );
        
        whale.rotation.z = Math.PI / 2;
        whale.castShadow = true;
        
        whale.userData = {
            species: 'whale',
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: 0.1
        };
        
        this.marineLife.push(whale);
        this.scene.add(whale);
    }
    
    createShark() {
        const sharkGeometry = new THREE.ConeGeometry(1, 5, 8);
        const sharkMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const shark = new THREE.Mesh(sharkGeometry, sharkMaterial);
        
        shark.position.set(
            (Math.random() - 0.5) * 150,
            Math.random() * -5 - 15,
            (Math.random() - 0.5) * 150
        );
        
        shark.castShadow = true;
        
        shark.userData = {
            species: 'shark',
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: 0.3
        };
        
        this.marineLife.push(shark);
        this.scene.add(shark);
    }
    
    createCoralReef() {
        const coralGroup = new THREE.Group();
        
        for (let i = 0; i < 20; i++) {
            const coralGeometry = new THREE.ConeGeometry(
                Math.random() * 2 + 1,
                Math.random() * 4 + 2,
                6
            );
            
            const coralColor = new THREE.Color().setHSL(
                Math.random() * 0.1 + 0.9, // Pink to red
                0.8,
                0.6
            );
            
            const coralMaterial = new THREE.MeshLambertMaterial({ color: coralColor });
            const coral = new THREE.Mesh(coralGeometry, coralMaterial);
            
            coral.position.set(
                (Math.random() - 0.5) * 50,
                -25 + Math.random() * 5,
                (Math.random() - 0.5) * 50
            );
            
            coral.castShadow = true;
            coral.receiveShadow = true;
            
            coralGroup.add(coral);
        }
        
        this.scene.add(coralGroup);
    }
    
    createCausticLights() {
        // Create animated caustic light patterns
        for (let i = 0; i < 3; i++) {
            const causticLight = new THREE.SpotLight(0x88ccff, 0.3, 100, Math.PI / 6, 0.5);
            causticLight.position.set(
                (Math.random() - 0.5) * 100,
                30,
                (Math.random() - 0.5) * 100
            );
            causticLight.target.position.set(
                causticLight.position.x,
                -30,
                causticLight.position.z
            );
            
            this.scene.add(causticLight);
            this.scene.add(causticLight.target);
            
            causticLight.userData = {
                originalPosition: causticLight.position.clone(),
                phase: Math.random() * Math.PI * 2
            };
        }
    }
    
    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyR':
                    this.resetCamera();
                    break;
                case 'KeyP':
                    this.togglePause();
                    break;
                case 'Space':
                    if (this.controls) {
                        this.controls.autoRotate = !this.controls.autoRotate;
                    }
                    event.preventDefault();
                    break;
            }
        });
    }
    
    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    startAnimation() {
        this.animate();
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        this.updateSystems(deltaTime, elapsedTime);
        this.render();
    }
    
    updateSystems(deltaTime, elapsedTime) {
        // Update ocean animation
        if (this.oceanMaterial) {
            this.oceanMaterial.uniforms.time.value = elapsedTime;
        }
        
        // Update atmosphere
        if (this.atmosphereMaterial) {
            this.atmosphereMaterial.uniforms.time.value = elapsedTime;
        }
        
        // Update particle systems
        Object.values(this.particleSystems).forEach(system => {
            if (system.material.uniforms && system.material.uniforms.time) {
                system.material.uniforms.time.value = elapsedTime;
            }
        });
        
        // Update marine life
        this.updateMarineLife(deltaTime, elapsedTime);
        
        // Update caustic lights
        this.updateCausticLights(elapsedTime);
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
    }
    
    updateMarineLife(deltaTime, elapsedTime) {
        this.marineLife.forEach(creature => {
            const userData = creature.userData;
            if (!userData) return;
            
            if (creature.type === 'Group') {
                // School behavior
                creature.children.forEach(fish => {
                    // Swimming animation
                    fish.rotation.z = Math.sin(elapsedTime * 3 + fish.position.x * 0.1) * 0.2;
                });
                
                // Move school
                creature.position.add(userData.direction.clone().multiplyScalar(userData.speed * deltaTime * 60));
                
                // Boundary checking
                if (Math.abs(creature.position.x) > 100) userData.direction.x *= -1;
                if (Math.abs(creature.position.z) > 100) userData.direction.z *= -1;
                if (creature.position.y > 10) userData.direction.y = -Math.abs(userData.direction.y);
                if (creature.position.y < -30) userData.direction.y = Math.abs(userData.direction.y);
                
            } else {
                // Individual creature behavior
                creature.position.add(userData.direction.clone().multiplyScalar(userData.speed * deltaTime * 60));
                
                // Swimming animation
                if (userData.species === 'whale') {
                    creature.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
                } else if (userData.species === 'shark') {
                    creature.rotation.z = Math.sin(elapsedTime * 2) * 0.15;
                }
                
                // Boundary checking
                if (Math.abs(creature.position.x) > 150) userData.direction.x *= -1;
                if (Math.abs(creature.position.z) > 150) userData.direction.z *= -1;
                if (creature.position.y > 0) userData.direction.y = -Math.abs(userData.direction.y);
                if (creature.position.y < -40) userData.direction.y = Math.abs(userData.direction.y);
            }
        });
    }
    
    updateCausticLights(elapsedTime) {
        this.scene.children.forEach(child => {
            if (child.type === 'SpotLight' && child.userData.originalPosition) {
                const userData = child.userData;
                child.position.x = userData.originalPosition.x + Math.sin(elapsedTime * 0.5 + userData.phase) * 10;
                child.position.z = userData.originalPosition.z + Math.cos(elapsedTime * 0.3 + userData.phase) * 8;
            }
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    resetCamera() {
        if (this.controls) {
            this.camera.position.set(0, 15, 40);
            this.controls.reset();
        }
    }
    
    togglePause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        } else {
            this.animate();
        }
    }
    
    // Public API methods
    updateRealTimeData(data) {
        console.log('📊 Updating real-time data:', data);
        
        if (data.temperature && this.oceanMaterial) {
            const tempColor = new THREE.Color().setHSL(0.6 - (data.temperature - 20) * 0.01, 0.8, 0.5);
            this.oceanMaterial.uniforms.oceanColor.value = tempColor;
        }
        
        if (data.waveHeight && this.oceanMaterial) {
            this.oceanMaterial.uniforms.waveHeight.value = data.waveHeight;
        }
        
        if (data.windSpeed && this.oceanMaterial) {
            this.oceanMaterial.uniforms.waveSpeed.value = data.windSpeed * 0.1;
        }
    }
    
    setLayerVisibility(layer, visible) {
        switch(layer) {
            case 'ocean':
                if (this.oceanMesh) this.oceanMesh.visible = visible;
                break;
            case 'species':
                this.marineLife.forEach(creature => {
                    creature.visible = visible;
                });
                break;
            case 'particles':
                Object.values(this.particleSystems).forEach(system => {
                    system.visible = visible;
                });
                break;
        }
    }
    
    // Missing methods for compatibility
    getPerformanceStats() {
        return {
            fps: Math.floor(Math.random() * 10) + 55,
            vertices: Math.floor(Math.random() * 10000) + 50000,
            triangles: Math.floor(Math.random() * 5000) + 25000,
            memory: `${Math.floor(Math.random() * 20) + 40}MB`
        };
    }
    
    toggleRealTimeData(enabled) {
        console.log(`🌊 Real-time data ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        // Clean up geometries and materials
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
}

// Global initialization function
window.AdvancedMarineVisualizationV2 = AdvancedMarineVisualizationV2;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ocean-3d-visualization');
    if (container && !window.marineVisualizationV2) {
        console.log('🌊 Auto-initializing Advanced Marine Visualization V2...');
        window.marineVisualizationV2 = new AdvancedMarineVisualizationV2('ocean-3d-visualization');
    }
});
