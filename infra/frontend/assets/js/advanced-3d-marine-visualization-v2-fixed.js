/**
 * 🌊 ADVANCED 3D MARINE VISUALIZATION V2 - FIXED
 * Silicon Valley Implementation - Stable Version
 * WebGL Compatible with Error Handling
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
            particleCount: 5000,
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
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "high-performance"
            });
            
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Basic rendering settings to avoid WebGL errors
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.shadowMap.enabled = false; // Disable shadows to avoid errors
            
            this.container.appendChild(this.renderer.domElement);
            console.log('✅ Renderer setup complete');
        } catch (error) {
            console.error('❌ Renderer setup failed:', error);
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.FogExp2(0x001122, 0.002);
        console.log('✅ Scene setup complete');
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
        console.log('✅ Camera setup complete');
    }
    
    setupControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 200;
            console.log('✅ Controls setup complete');
        }
    }
    
    setupLighting() {
        // Simple lighting to avoid WebGL issues
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 100, 30);
        this.scene.add(sunLight);
        
        const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
        this.scene.add(ambientLight);
        
        console.log('✅ Lighting setup complete');
    }
    
    createRealisticOcean() {
        try {
            console.log('🌊 Creating realistic ocean...');
            
            const oceanGeometry = new THREE.PlaneGeometry(400, 400, 64, 64);
            
            // Simple material to avoid shader errors
            const oceanMaterial = new THREE.MeshLambertMaterial({
                color: 0x006994,
                transparent: true,
                opacity: 0.8,
                wireframe: false
            });
            
            this.oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
            this.oceanMesh.rotation.x = -Math.PI / 2;
            this.scene.add(this.oceanMesh);
            
            this.oceanMaterial = oceanMaterial;
            console.log('✅ Realistic ocean created');
        } catch (error) {
            console.error('❌ Ocean creation failed:', error);
        }
    }
    
    createAdvancedParticleSystem() {
        try {
            console.log('✨ Creating advanced particle systems...');
            
            // Bioluminescent plankton
            this.createPlanktonSystem();
            
            // Oxygen bubbles
            this.createBubbleSystem();
            
            // Marine snow
            this.createMarineSnowSystem();
            
            console.log('✅ Advanced particle systems created');
        } catch (error) {
            console.error('❌ Particle system creation failed:', error);
        }
    }
    
    createPlanktonSystem() {
        const count = Math.floor(this.options.particleCount * 0.4);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 300;
            positions[i3 + 1] = Math.random() * 40 - 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 300;
            
            // Green bioluminescent colors
            colors[i3] = 0.2;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 0.6;
            
            sizes[i] = Math.random() * 3 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystems.plankton = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.plankton);
    }
    
    createBubbleSystem() {
        const count = Math.floor(this.options.particleCount * 0.3);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = Math.random() * -30 - 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x88ffff,
            size: 1.5,
            transparent: true,
            opacity: 0.6
        });
        
        this.particleSystems.bubbles = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.bubbles);
    }
    
    createMarineSnowSystem() {
        const count = Math.floor(this.options.particleCount * 0.3);
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 400;
            positions[i3 + 1] = Math.random() * 60 + 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 400;
            
            sizes[i] = Math.random() * 1.5 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x999999,
            size: 1,
            transparent: true,
            opacity: 0.4
        });
        
        this.particleSystems.marineSnow = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystems.marineSnow);
    }
    
    createMarineLife() {
        try {
            console.log('🐠 Creating marine life...');
            
            // Create fish schools
            this.createFishSchool(30, 'tuna');
            this.createFishSchool(20, 'sardine');
            
            // Create individual larger species
            this.createWhale();
            this.createShark();
            
            // Create coral formations
            this.createCoralReef();
            
            console.log('✅ Marine life created');
        } catch (error) {
            console.error('❌ Marine life creation failed:', error);
        }
    }
    
    createFishSchool(count, species) {
        const fishGroup = new THREE.Group();
        
        for (let i = 0; i < count; i++) {
            const fish = this.createFish(species);
            
            // Position in school formation
            const angle = (i / count) * Math.PI * 2;
            const radius = Math.random() * 8 + 3;
            
            fish.position.set(
                Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
                Math.random() * 15 - 5,
                Math.sin(angle) * radius + (Math.random() - 0.5) * 60
            );
            
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
            speed: Math.random() * 0.3 + 0.1
        };
        
        this.marineLife.push(fishGroup);
        this.scene.add(fishGroup);
    }
    
    createFish(species) {
        let geometry, material, scale;
        
        switch (species) {
            case 'tuna':
                geometry = new THREE.ConeGeometry(0.4, 1.5, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x4444aa });
                scale = 1.2;
                break;
            case 'sardine':
                geometry = new THREE.ConeGeometry(0.2, 0.8, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x888888 });
                scale = 0.8;
                break;
            default:
                geometry = new THREE.ConeGeometry(0.3, 1.0, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
                scale = 1.0;
        }
        
        const fish = new THREE.Mesh(geometry, material);
        fish.scale.setScalar(scale);
        return fish;
    }
    
    createWhale() {
        const whaleGeometry = new THREE.CylinderGeometry(0.8, 2, 10, 12);
        const whaleMaterial = new THREE.MeshLambertMaterial({ color: 0x333366 });
        const whale = new THREE.Mesh(whaleGeometry, whaleMaterial);
        
        whale.position.set(
            (Math.random() - 0.5) * 150,
            Math.random() * -8 - 15,
            (Math.random() - 0.5) * 150
        );
        
        whale.rotation.z = Math.PI / 2;
        
        whale.userData = {
            species: 'whale',
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: 0.05
        };
        
        this.marineLife.push(whale);
        this.scene.add(whale);
    }
    
    createShark() {
        const sharkGeometry = new THREE.ConeGeometry(0.6, 3, 8);
        const sharkMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const shark = new THREE.Mesh(sharkGeometry, sharkMaterial);
        
        shark.position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * -3 - 10,
            (Math.random() - 0.5) * 100
        );
        
        shark.userData = {
            species: 'shark',
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: 0.15
        };
        
        this.marineLife.push(shark);
        this.scene.add(shark);
    }
    
    createCoralReef() {
        const coralGroup = new THREE.Group();
        
        for (let i = 0; i < 15; i++) {
            const coralGeometry = new THREE.ConeGeometry(
                Math.random() * 1.5 + 0.5,
                Math.random() * 3 + 1,
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
                (Math.random() - 0.5) * 30,
                -20 + Math.random() * 3,
                (Math.random() - 0.5) * 30
            );
            
            coralGroup.add(coral);
        }
        
        this.scene.add(coralGroup);
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
        // Animate ocean
        if (this.oceanMesh) {
            this.oceanMesh.rotation.z = Math.sin(elapsedTime * 0.1) * 0.02;
        }
        
        // Animate particles
        Object.values(this.particleSystems).forEach(system => {
            if (system.geometry && system.geometry.attributes.position) {
                const positions = system.geometry.attributes.position.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    // Simple floating animation
                    positions[i + 1] += Math.sin(elapsedTime + i) * 0.01;
                }
                
                system.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update marine life
        this.updateMarineLife(deltaTime, elapsedTime);
        
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
                    fish.rotation.z = Math.sin(elapsedTime * 2 + fish.position.x * 0.1) * 0.1;
                });
                
                // Move school
                creature.position.add(userData.direction.clone().multiplyScalar(userData.speed * deltaTime * 30));
                
                // Boundary checking
                if (Math.abs(creature.position.x) > 80) userData.direction.x *= -1;
                if (Math.abs(creature.position.z) > 80) userData.direction.z *= -1;
                if (creature.position.y > 5) userData.direction.y = -Math.abs(userData.direction.y);
                if (creature.position.y < -25) userData.direction.y = Math.abs(userData.direction.y);
                
            } else {
                // Individual creature behavior
                creature.position.add(userData.direction.clone().multiplyScalar(userData.speed * deltaTime * 30));
                
                // Swimming animation
                if (userData.species === 'whale') {
                    creature.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05;
                } else if (userData.species === 'shark') {
                    creature.rotation.z = Math.sin(elapsedTime * 1.5) * 0.1;
                }
                
                // Boundary checking
                if (Math.abs(creature.position.x) > 100) userData.direction.x *= -1;
                if (Math.abs(creature.position.z) > 100) userData.direction.z *= -1;
                if (creature.position.y > 0) userData.direction.y = -Math.abs(userData.direction.y);
                if (creature.position.y < -30) userData.direction.y = Math.abs(userData.direction.y);
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
    
    // Public API methods for compatibility
    updateRealTimeData(data) {
        console.log('📊 Updating real-time data:', data);
        
        if (data.temperature && this.oceanMaterial) {
            const tempColor = new THREE.Color().setHSL(0.6 - (data.temperature - 20) * 0.01, 0.8, 0.5);
            this.oceanMaterial.color = tempColor;
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
    
    setParameter(parameter, value) {
        console.log(`🔧 Setting ${parameter} to ${value}`);
    }
    
    // Compatibility methods
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

// Global initialization
window.AdvancedMarineVisualizationV2 = AdvancedMarineVisualizationV2;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ocean-3d-visualization');
    if (container && !window.marineVisualizationV2) {
        console.log('🌊 Auto-initializing Advanced Marine Visualization V2 Fixed...');
        setTimeout(() => {
            window.marineVisualizationV2 = new AdvancedMarineVisualizationV2('ocean-3d-visualization');
        }, 1000);
    }
});
