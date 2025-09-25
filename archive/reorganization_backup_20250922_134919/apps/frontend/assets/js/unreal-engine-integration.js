/**
 * 🎮 UNREAL ENGINE INTEGRATION - BGAPP Scientific Dashboard
 * Advanced integration layer for future Unreal Engine implementations
 * 
 * Features:
 * - Blueprint-style visual scripting concepts
 * - Unreal Engine asset pipeline integration
 * - Advanced material system for data visualization
 * - Cinematic sequencer for data animations
 * - Level streaming for large datasets
 * - Actor component system for modular visualization
 * - Physics simulation for ocean dynamics
 * - Niagara-inspired particle effects
 */

class UnrealEngineIntegration {
    constructor() {
        this.actors = new Map();
        this.components = new Map();
        this.materials = new Map();
        this.sequences = new Map();
        this.levels = new Map();
        
        this.gameWorld = null;
        this.playerController = null;
        this.gameMode = null;
        
        this.blueprintNodes = [];
        this.materialInstances = [];
        
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        console.log('🎮 Inicializando Unreal Engine Integration...');
        
        this.setupGameWorld();
        this.createActorSystem();
        this.setupMaterialSystem();
        this.initializeBlueprintSystem();
        this.setupSequencerSystem();
        this.createLevelStreamingSystem();
        
        this.isInitialized = true;
        console.log('✅ Unreal Engine Integration inicializado!');
    }
    
    setupGameWorld() {
        // Simulate Unreal Engine's World concept
        this.gameWorld = {
            name: 'BGAPPOceanWorld',
            actors: [],
            levels: [],
            worldSettings: {
                gravity: -980, // cm/s²
                timeOfDay: 12.0,
                oceanLevel: 0,
                windStrength: 1.0,
                currentStrength: 1.0
            },
            postProcessSettings: {
                exposure: 1.0,
                saturation: 1.0,
                contrast: 1.0,
                gamma: 2.2,
                bloomIntensity: 0.5,
                depthOfField: false
            }
        };
        
        console.log('🌍 Game World criado:', this.gameWorld.name);
    }
    
    createActorSystem() {
        // Base Actor class inspired by Unreal Engine
        class BGAPPActor {
            constructor(name, transform = {}) {
                this.name = name;
                this.transform = {
                    location: transform.location || [0, 0, 0],
                    rotation: transform.rotation || [0, 0, 0],
                    scale: transform.scale || [1, 1, 1]
                };
                this.components = [];
                this.isVisible = true;
                this.isActive = true;
                this.tags = [];
                this.id = this.generateUUID();
            }
            
            generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            
            addComponent(component) {
                this.components.push(component);
                component.owner = this;
            }
            
            getComponent(componentType) {
                return this.components.find(c => c instanceof componentType);
            }
            
            setTransform(location, rotation, scale) {
                if (location) this.transform.location = location;
                if (rotation) this.transform.rotation = rotation;
                if (scale) this.transform.scale = scale;
            }
            
            tick(deltaTime) {
                this.components.forEach(component => {
                    if (component.tick) component.tick(deltaTime);
                });
            }
            
            destroy() {
                this.components.forEach(component => {
                    if (component.destroy) component.destroy();
                });
                this.components = [];
            }
        }
        
        // Specialized actors for oceanographic data
        class OceanographicDataActor extends BGAPPActor {
            constructor(name, dataPoint) {
                super(name);
                this.dataPoint = dataPoint;
                this.parameter = dataPoint.parameter;
                this.value = dataPoint.value;
                this.depth = dataPoint.depth;
                
                // Add visualization component
                this.addComponent(new DataVisualizationComponent(dataPoint));
            }
        }
        
        class SpeciesActor extends BGAPPActor {
            constructor(name, speciesData) {
                super(name);
                this.speciesData = speciesData;
                this.species = speciesData.species;
                this.abundance = speciesData.abundance;
                
                // Add behavior components
                this.addComponent(new MovementComponent());
                this.addComponent(new AnimationComponent());
                this.addComponent(new FlockingComponent());
            }
        }
        
        // Component system
        class BGAPPComponent {
            constructor() {
                this.owner = null;
                this.isActive = true;
            }
            
            beginPlay() {
                // Called when component starts
            }
            
            tick(deltaTime) {
                // Called every frame
            }
            
            destroy() {
                // Cleanup
            }
        }
        
        class DataVisualizationComponent extends BGAPPComponent {
            constructor(dataPoint) {
                super();
                this.dataPoint = dataPoint;
                this.visualElement = null;
                this.material = null;
            }
            
            beginPlay() {
                this.createVisualization();
            }
            
            createVisualization() {
                // Create Three.js mesh for data visualization
                const geometry = new THREE.SphereGeometry(0.5, 16, 12);
                const material = this.createDataMaterial();
                this.visualElement = new THREE.Mesh(geometry, material);
                
                // Add to scene
                if (window.unrealDashboard && window.unrealDashboard.scene) {
                    window.unrealDashboard.scene.add(this.visualElement);
                }
            }
            
            createDataMaterial() {
                const color = this.getColorForParameter();
                return new THREE.MeshPhongMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    emissive: new THREE.Color(color).multiplyScalar(0.2)
                });
            }
            
            getColorForParameter() {
                // Color mapping based on parameter type and value
                const colorMaps = {
                    temperature: [0x0000ff, 0x00ffff, 0x00ff00, 0xffff00, 0xff0000],
                    salinity: [0xff00ff, 0x0000ff, 0x00ff00, 0xffff00, 0xff0000],
                    oxygen: [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff],
                    ph: [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff]
                };
                
                const colors = colorMaps[this.dataPoint.parameter] || colorMaps.temperature;
                const index = Math.floor(this.dataPoint.value * (colors.length - 1));
                return colors[index] || 0x888888;
            }
            
            tick(deltaTime) {
                if (this.visualElement) {
                    // Animate based on data changes
                    this.visualElement.rotation.y += deltaTime * 0.5;
                    
                    // Pulse effect based on data importance
                    const pulse = Math.sin(Date.now() * 0.002) * 0.1 + 1.0;
                    this.visualElement.scale.setScalar(pulse);
                }
            }
        }
        
        class MovementComponent extends BGAPPComponent {
            constructor() {
                super();
                this.velocity = [0, 0, 0];
                this.acceleration = [0, 0, 0];
                this.maxSpeed = 2.0;
            }
            
            tick(deltaTime) {
                if (this.owner && this.owner.transform) {
                    // Simple physics simulation
                    this.velocity[0] += this.acceleration[0] * deltaTime;
                    this.velocity[1] += this.acceleration[1] * deltaTime;
                    this.velocity[2] += this.acceleration[2] * deltaTime;
                    
                    // Apply velocity to position
                    this.owner.transform.location[0] += this.velocity[0] * deltaTime;
                    this.owner.transform.location[1] += this.velocity[1] * deltaTime;
                    this.owner.transform.location[2] += this.velocity[2] * deltaTime;
                    
                    // Apply drag
                    this.velocity = this.velocity.map(v => v * 0.98);
                }
            }
        }
        
        class FlockingComponent extends BGAPPComponent {
            constructor() {
                super();
                this.separationRadius = 5.0;
                this.alignmentRadius = 10.0;
                this.cohesionRadius = 15.0;
            }
            
            tick(deltaTime) {
                // Implement boids algorithm for species flocking
                const neighbors = this.findNeighbors();
                const separation = this.calculateSeparation(neighbors);
                const alignment = this.calculateAlignment(neighbors);
                const cohesion = this.calculateCohesion(neighbors);
                
                // Apply forces to movement component
                const movementComp = this.owner.getComponent(MovementComponent);
                if (movementComp) {
                    movementComp.acceleration[0] = separation[0] + alignment[0] + cohesion[0];
                    movementComp.acceleration[1] = separation[1] + alignment[1] + cohesion[1];
                    movementComp.acceleration[2] = separation[2] + alignment[2] + cohesion[2];
                }
            }
            
            findNeighbors() {
                // Find nearby species actors
                return Array.from(window.unrealEngineIntegration.actors.values())
                    .filter(actor => actor instanceof SpeciesActor && actor !== this.owner);
            }
            
            calculateSeparation(neighbors) {
                // Avoid crowding neighbors
                return [0, 0, 0]; // Simplified
            }
            
            calculateAlignment(neighbors) {
                // Steer towards average heading of neighbors
                return [0, 0, 0]; // Simplified
            }
            
            calculateCohesion(neighbors) {
                // Steer towards average position of neighbors
                return [0, 0, 0]; // Simplified
            }
        }
        
        // Store classes globally for use
        window.BGAPPActor = BGAPPActor;
        window.OceanographicDataActor = OceanographicDataActor;
        window.SpeciesActor = SpeciesActor;
        window.DataVisualizationComponent = DataVisualizationComponent;
        window.MovementComponent = MovementComponent;
        window.FlockingComponent = FlockingComponent;
    }
    
    setupMaterialSystem() {
        // Unreal Engine-inspired material system
        class BGAPPMaterial {
            constructor(name) {
                this.name = name;
                this.parameters = new Map();
                this.textures = new Map();
                this.shaderCode = '';
                this.instances = [];
            }
            
            setParameter(name, value) {
                this.parameters.set(name, value);
                this.updateInstances();
            }
            
            setTexture(name, texture) {
                this.textures.set(name, texture);
                this.updateInstances();
            }
            
            createInstance() {
                const instance = new BGAPPMaterialInstance(this);
                this.instances.push(instance);
                return instance;
            }
            
            updateInstances() {
                this.instances.forEach(instance => instance.update());
            }
        }
        
        class BGAPPMaterialInstance {
            constructor(baseMaterial) {
                this.baseMaterial = baseMaterial;
                this.parameters = new Map(baseMaterial.parameters);
                this.threeMaterial = null;
                this.createThreeMaterial();
            }
            
            createThreeMaterial() {
                // Create Three.js material based on parameters
                const materialType = this.parameters.get('MaterialType') || 'Phong';
                
                switch(materialType) {
                    case 'Ocean':
                        this.threeMaterial = this.createOceanMaterial();
                        break;
                    case 'Data':
                        this.threeMaterial = this.createDataMaterial();
                        break;
                    case 'Species':
                        this.threeMaterial = this.createSpeciesMaterial();
                        break;
                    default:
                        this.threeMaterial = new THREE.MeshPhongMaterial();
                }
            }
            
            createOceanMaterial() {
                return new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        waveHeight: { value: this.parameters.get('WaveHeight') || 2.0 },
                        waveFrequency: { value: this.parameters.get('WaveFrequency') || 0.02 },
                        waterColor: { value: new THREE.Color(this.parameters.get('WaterColor') || 0x0066cc) }
                    },
                    vertexShader: `
                        uniform float time;
                        uniform float waveHeight;
                        uniform float waveFrequency;
                        
                        varying vec2 vUv;
                        varying vec3 vPosition;
                        
                        void main() {
                            vUv = uv;
                            
                            vec3 pos = position;
                            pos.y += sin(pos.x * waveFrequency + time) * waveHeight;
                            pos.y += sin(pos.z * waveFrequency * 1.5 + time * 1.5) * waveHeight * 0.5;
                            
                            vPosition = pos;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 waterColor;
                        uniform float time;
                        
                        varying vec2 vUv;
                        varying vec3 vPosition;
                        
                        void main() {
                            vec3 color = waterColor;
                            
                            // Add foam effect
                            float foam = sin(vPosition.y * 10.0 + time * 2.0) * 0.1 + 0.9;
                            color = mix(color, vec3(1.0), max(0.0, vPosition.y * 2.0) * foam);
                            
                            gl_FragColor = vec4(color, 0.8);
                        }
                    `,
                    transparent: true
                });
            }
            
            createDataMaterial() {
                const baseColor = this.parameters.get('BaseColor') || 0x00aaff;
                const emissive = this.parameters.get('Emissive') || 0x002244;
                
                return new THREE.MeshPhongMaterial({
                    color: baseColor,
                    emissive: emissive,
                    transparent: true,
                    opacity: this.parameters.get('Opacity') || 0.8
                });
            }
            
            createSpeciesMaterial() {
                const speciesType = this.parameters.get('SpeciesType') || 'fish';
                const colorMap = {
                    fish: 0x00aaff,
                    whale: 0x0066cc,
                    dolphin: 0x0099ff,
                    turtle: 0x00cc66,
                    coral: 0xff6600
                };
                
                return new THREE.MeshPhongMaterial({
                    color: colorMap[speciesType] || 0x888888,
                    transparent: true,
                    opacity: 0.9
                });
            }
            
            setParameter(name, value) {
                this.parameters.set(name, value);
                this.update();
            }
            
            update() {
                if (this.threeMaterial && this.threeMaterial.uniforms) {
                    // Update shader uniforms
                    Object.keys(this.threeMaterial.uniforms).forEach(key => {
                        if (this.parameters.has(key)) {
                            this.threeMaterial.uniforms[key].value = this.parameters.get(key);
                        }
                    });
                }
            }
        }
        
        // Create base materials
        const oceanMaterial = new BGAPPMaterial('M_Ocean');
        oceanMaterial.setParameter('MaterialType', 'Ocean');
        oceanMaterial.setParameter('WaveHeight', 2.0);
        oceanMaterial.setParameter('WaveFrequency', 0.02);
        
        const dataMaterial = new BGAPPMaterial('M_Data');
        dataMaterial.setParameter('MaterialType', 'Data');
        
        const speciesMaterial = new BGAPPMaterial('M_Species');
        speciesMaterial.setParameter('MaterialType', 'Species');
        
        this.materials.set('M_Ocean', oceanMaterial);
        this.materials.set('M_Data', dataMaterial);
        this.materials.set('M_Species', speciesMaterial);
        
        console.log('🎨 Material System inicializado com', this.materials.size, 'materiais');
    }
    
    initializeBlueprintSystem() {
        // Blueprint visual scripting system
        class BlueprintNode {
            constructor(type, name) {
                this.type = type;
                this.name = name;
                this.inputs = [];
                this.outputs = [];
                this.properties = new Map();
                this.id = this.generateUUID();
            }
            
            generateUUID() {
                return Math.random().toString(36).substr(2, 9);
            }
            
            addInput(name, type, defaultValue = null) {
                this.inputs.push({name, type, value: defaultValue, connected: false});
            }
            
            addOutput(name, type) {
                this.outputs.push({name, type, connections: []});
            }
            
            execute(inputs) {
                // Override in subclasses
                return {};
            }
        }
        
        // Data processing nodes
        class DataFilterNode extends BlueprintNode {
            constructor() {
                super('DataProcessing', 'Filter Data');
                this.addInput('Data', 'Array', []);
                this.addInput('Parameter', 'String', 'temperature');
                this.addInput('MinValue', 'Float', 0.0);
                this.addInput('MaxValue', 'Float', 1.0);
                this.addOutput('Filtered Data', 'Array');
            }
            
            execute(inputs) {
                const data = inputs.Data || [];
                const parameter = inputs.Parameter || 'temperature';
                const minValue = inputs.MinValue || 0.0;
                const maxValue = inputs.MaxValue || 1.0;
                
                const filtered = data.filter(item => {
                    const value = item[parameter];
                    return value >= minValue && value <= maxValue;
                });
                
                return {'Filtered Data': filtered};
            }
        }
        
        class VisualizationNode extends BlueprintNode {
            constructor() {
                super('Visualization', 'Create Visualization');
                this.addInput('Data', 'Array', []);
                this.addInput('Visualization Type', 'String', 'scatter');
                this.addInput('Color Scheme', 'String', 'temperature');
                this.addOutput('Actors', 'Array');
            }
            
            execute(inputs) {
                const data = inputs.Data || [];
                const visType = inputs['Visualization Type'] || 'scatter';
                const colorScheme = inputs['Color Scheme'] || 'temperature';
                
                const actors = data.map((dataPoint, index) => {
                    const actor = new OceanographicDataActor(`DataPoint_${index}`, dataPoint);
                    return actor;
                });
                
                return {'Actors': actors};
            }
        }
        
        // Create sample blueprint
        const dataProcessingBlueprint = {
            name: 'BP_DataVisualization',
            nodes: [
                new DataFilterNode(),
                new VisualizationNode()
            ],
            connections: []
        };
        
        this.blueprintNodes.push(dataProcessingBlueprint);
        
        console.log('📋 Blueprint System inicializado com', this.blueprintNodes.length, 'blueprints');
    }
    
    setupSequencerSystem() {
        // Cinematic sequencer for data animations
        class BGAPPSequence {
            constructor(name, duration) {
                this.name = name;
                this.duration = duration; // in seconds
                this.tracks = [];
                this.currentTime = 0;
                this.isPlaying = false;
                this.playbackRate = 1.0;
            }
            
            addTrack(track) {
                this.tracks.push(track);
            }
            
            play() {
                this.isPlaying = true;
                this.currentTime = 0;
                console.log(`▶️ Reproduzindo sequência: ${this.name}`);
            }
            
            pause() {
                this.isPlaying = false;
                console.log(`⏸️ Sequência pausada: ${this.name}`);
            }
            
            stop() {
                this.isPlaying = false;
                this.currentTime = 0;
                console.log(`⏹️ Sequência parada: ${this.name}`);
            }
            
            tick(deltaTime) {
                if (!this.isPlaying) return;
                
                this.currentTime += deltaTime * this.playbackRate;
                
                // Update all tracks
                this.tracks.forEach(track => {
                    track.evaluate(this.currentTime);
                });
                
                // Check if sequence is complete
                if (this.currentTime >= this.duration) {
                    this.stop();
                }
            }
        }
        
        class AnimationTrack {
            constructor(targetActor, property) {
                this.targetActor = targetActor;
                this.property = property; // e.g., 'transform.location'
                this.keyframes = [];
            }
            
            addKeyframe(time, value, interpolation = 'linear') {
                this.keyframes.push({time, value, interpolation});
                this.keyframes.sort((a, b) => a.time - b.time);
            }
            
            evaluate(time) {
                if (this.keyframes.length === 0) return;
                
                // Find surrounding keyframes
                let prevKeyframe = this.keyframes[0];
                let nextKeyframe = this.keyframes[this.keyframes.length - 1];
                
                for (let i = 0; i < this.keyframes.length - 1; i++) {
                    if (time >= this.keyframes[i].time && time <= this.keyframes[i + 1].time) {
                        prevKeyframe = this.keyframes[i];
                        nextKeyframe = this.keyframes[i + 1];
                        break;
                    }
                }
                
                // Interpolate between keyframes
                const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
                const interpolatedValue = this.interpolate(prevKeyframe.value, nextKeyframe.value, t);
                
                // Apply to target actor
                this.setActorProperty(this.targetActor, this.property, interpolatedValue);
            }
            
            interpolate(startValue, endValue, t) {
                if (Array.isArray(startValue)) {
                    return startValue.map((start, index) => {
                        return start + (endValue[index] - start) * t;
                    });
                } else {
                    return startValue + (endValue - startValue) * t;
                }
            }
            
            setActorProperty(actor, property, value) {
                const parts = property.split('.');
                let target = actor;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    target = target[parts[i]];
                }
                
                target[parts[parts.length - 1]] = value;
            }
        }
        
        // Create sample sequences
        const dataAnimationSequence = new BGAPPSequence('SEQ_DataAnimation', 30.0);
        this.sequences.set('SEQ_DataAnimation', dataAnimationSequence);
        
        console.log('🎬 Sequencer System inicializado com', this.sequences.size, 'sequências');
    }
    
    createLevelStreamingSystem() {
        // Level streaming for large datasets
        class BGAPPLevel {
            constructor(name, bounds) {
                this.name = name;
                this.bounds = bounds; // {min: [x,y,z], max: [x,y,z]}
                this.actors = [];
                this.isLoaded = false;
                this.isVisible = false;
                this.priority = 0;
            }
            
            load() {
                if (this.isLoaded) return;
                
                console.log(`📦 Carregando nível: ${this.name}`);
                // Simulate loading process
                setTimeout(() => {
                    this.isLoaded = true;
                    this.makeVisible();
                }, 100);
            }
            
            unload() {
                if (!this.isLoaded) return;
                
                console.log(`📦 Descarregando nível: ${this.name}`);
                this.makeHidden();
                this.actors.forEach(actor => actor.destroy());
                this.actors = [];
                this.isLoaded = false;
            }
            
            makeVisible() {
                this.isVisible = true;
                this.actors.forEach(actor => {
                    actor.isVisible = true;
                });
            }
            
            makeHidden() {
                this.isVisible = false;
                this.actors.forEach(actor => {
                    actor.isVisible = false;
                });
            }
            
            addActor(actor) {
                this.actors.push(actor);
            }
            
            isInBounds(position) {
                return position[0] >= this.bounds.min[0] && position[0] <= this.bounds.max[0] &&
                       position[1] >= this.bounds.min[1] && position[1] <= this.bounds.max[1] &&
                       position[2] >= this.bounds.min[2] && position[2] <= this.bounds.max[2];
            }
        }
        
        // Create ocean region levels
        const angolaCoastLevel = new BGAPPLevel('Level_AngolaCoast', {
            min: [10, -18, -200],
            max: [18, -5, 0]
        });
        
        const deepOceanLevel = new BGAPPLevel('Level_DeepOcean', {
            min: [5, -25, -2000],
            max: [25, 0, -200]
        });
        
        this.levels.set('Level_AngolaCoast', angolaCoastLevel);
        this.levels.set('Level_DeepOcean', deepOceanLevel);
        
        console.log('🌍 Level Streaming inicializado com', this.levels.size, 'níveis');
    }
    
    // Public API methods
    spawnActor(actorClass, transform, parameters = {}) {
        const actor = new actorClass(`${actorClass.name}_${Date.now()}`, transform);
        
        // Apply parameters
        Object.keys(parameters).forEach(key => {
            if (actor.hasOwnProperty(key)) {
                actor[key] = parameters[key];
            }
        });
        
        this.actors.set(actor.id, actor);
        this.gameWorld.actors.push(actor);
        
        // Add to appropriate level
        this.assignActorToLevel(actor);
        
        console.log(`🎭 Actor criado: ${actor.name} (${actor.id})`);
        return actor;
    }
    
    destroyActor(actorId) {
        const actor = this.actors.get(actorId);
        if (actor) {
            actor.destroy();
            this.actors.delete(actorId);
            this.gameWorld.actors = this.gameWorld.actors.filter(a => a.id !== actorId);
            console.log(`🗑️ Actor destruído: ${actor.name}`);
        }
    }
    
    assignActorToLevel(actor) {
        const position = actor.transform.location;
        
        for (const [levelName, level] of this.levels) {
            if (level.isInBounds(position)) {
                level.addActor(actor);
                break;
            }
        }
    }
    
    createMaterialInstance(baseMaterialName, parameters = {}) {
        const baseMaterial = this.materials.get(baseMaterialName);
        if (!baseMaterial) {
            console.error(`Material não encontrado: ${baseMaterialName}`);
            return null;
        }
        
        const instance = baseMaterial.createInstance();
        
        // Apply parameters
        Object.keys(parameters).forEach(key => {
            instance.setParameter(key, parameters[key]);
        });
        
        return instance;
    }
    
    playSequence(sequenceName) {
        const sequence = this.sequences.get(sequenceName);
        if (sequence) {
            sequence.play();
        } else {
            console.error(`Sequência não encontrada: ${sequenceName}`);
        }
    }
    
    tick(deltaTime) {
        // Update all actors
        this.actors.forEach(actor => {
            if (actor.isActive) {
                actor.tick(deltaTime);
            }
        });
        
        // Update sequences
        this.sequences.forEach(sequence => {
            sequence.tick(deltaTime);
        });
        
        // Update level streaming based on camera position
        this.updateLevelStreaming();
    }
    
    updateLevelStreaming() {
        // Simplified level streaming based on camera position
        if (window.unrealDashboard && window.unrealDashboard.camera) {
            const cameraPos = window.unrealDashboard.camera.position;
            const position = [cameraPos.x, cameraPos.y, cameraPos.z];
            
            this.levels.forEach(level => {
                const shouldLoad = level.isInBounds(position) || 
                                 this.getDistanceToLevel(position, level) < 100;
                
                if (shouldLoad && !level.isLoaded) {
                    level.load();
                } else if (!shouldLoad && level.isLoaded) {
                    level.unload();
                }
            });
        }
    }
    
    getDistanceToLevel(position, level) {
        const centerX = (level.bounds.min[0] + level.bounds.max[0]) / 2;
        const centerY = (level.bounds.min[1] + level.bounds.max[1]) / 2;
        const centerZ = (level.bounds.min[2] + level.bounds.max[2]) / 2;
        
        const dx = position[0] - centerX;
        const dy = position[1] - centerY;
        const dz = position[2] - centerZ;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Integration with existing systems
    integrateWithDeckGL() {
        if (window.deckGLIntegration) {
            console.log('🔗 Integrando com deck.gl...');
            
            // Create actors from deck.gl data
            const oceanData = window.deckGLIntegration.oceanographicData || [];
            oceanData.forEach(dataPoint => {
                this.spawnActor(OceanographicDataActor, {
                    location: [dataPoint.longitude, dataPoint.latitude, -dataPoint.depth]
                }, {dataPoint});
            });
        }
    }
    
    integrateWithUnrealDashboard() {
        if (window.unrealDashboard) {
            console.log('🔗 Integrando com Unreal Dashboard...');
            
            // Start tick loop
            const tick = () => {
                this.tick(0.016); // ~60fps
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }
    }
    
    exportToUnrealEngine() {
        // Export current scene to Unreal Engine format
        const exportData = {
            world: this.gameWorld,
            actors: Array.from(this.actors.values()).map(actor => ({
                name: actor.name,
                class: actor.constructor.name,
                transform: actor.transform,
                components: actor.components.map(comp => ({
                    class: comp.constructor.name,
                    properties: comp.properties || {}
                }))
            })),
            materials: Array.from(this.materials.keys()),
            sequences: Array.from(this.sequences.keys()),
            levels: Array.from(this.levels.keys())
        };
        
        console.log('📤 Dados exportados para Unreal Engine:', exportData);
        return exportData;
    }
}

// Initialize Unreal Engine Integration
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.unrealEngineIntegration = new UnrealEngineIntegration();
        
        // Integrate with other systems
        setTimeout(() => {
            if (window.unrealEngineIntegration) {
                window.unrealEngineIntegration.integrateWithDeckGL();
                window.unrealEngineIntegration.integrateWithUnrealDashboard();
            }
        }, 3000);
    }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnrealEngineIntegration;
}
