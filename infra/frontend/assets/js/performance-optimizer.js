/**
 * 🚀 PERFORMANCE OPTIMIZER - Inspired by Unreal Engine
 * Advanced performance optimization system for BGAPP Dashboard
 * 
 * Features:
 * - Automatic Level of Detail (LOD) management
 * - Dynamic quality scaling
 * - Memory management
 * - Frame rate optimization
 * - Culling systems
 * - Resource streaming
 * - Performance profiling
 */

class PerformanceOptimizer {
    constructor() {
        this.targetFPS = 60;
        this.minFPS = 30;
        this.maxFPS = 120;
        
        this.currentFPS = 60;
        this.frameTime = 0;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        // Performance metrics
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            drawCalls: 0,
            triangles: 0,
            quality: 'high'
        };
        
        // Quality settings
        this.qualitySettings = {
            ultra: {
                pixelRatio: 2,
                shadowMapSize: 4096,
                antialiasing: true,
                postProcessing: true,
                particleDensity: 1.0,
                lodBias: 1.0
            },
            high: {
                pixelRatio: 1.5,
                shadowMapSize: 2048,
                antialiasing: true,
                postProcessing: true,
                particleDensity: 0.8,
                lodBias: 0.8
            },
            medium: {
                pixelRatio: 1.0,
                shadowMapSize: 1024,
                antialiasing: true,
                postProcessing: false,
                particleDensity: 0.6,
                lodBias: 0.6
            },
            low: {
                pixelRatio: 0.8,
                shadowMapSize: 512,
                antialiasing: false,
                postProcessing: false,
                particleDensity: 0.4,
                lodBias: 0.4
            }
        };
        
        this.currentQuality = 'high';
        this.autoQuality = true;
        
        // Systems
        this.lodManager = null;
        this.cullingSystem = null;
        this.memoryManager = new MemoryManager();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Performance Optimizer inicializado');
        
        // Start performance monitoring
        this.startMonitoring();
        
        // Setup automatic quality adjustment
        this.setupAutoQuality();
        
        // Setup memory management
        this.memoryManager.init();
        
        // Setup resize handler
        this.setupResizeHandler();
    }
    
    startMonitoring() {
        const monitor = () => {
            const currentTime = performance.now();
            this.frameTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            this.frameCount++;
            
            // Calculate FPS every second
            if (this.frameCount % 60 === 0) {
                this.currentFPS = Math.round(1000 / this.frameTime);
                this.updateMetrics();
                
                if (this.autoQuality) {
                    this.adjustQuality();
                }
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    updateMetrics() {
        this.metrics.fps = this.currentFPS;
        this.metrics.frameTime = this.frameTime;
        this.metrics.quality = this.currentQuality;
        
        // Memory usage (if available)
        if (performance.memory) {
            this.metrics.memoryUsage = Math.round(
                performance.memory.usedJSHeapSize / 1024 / 1024
            );
        }
        
        // Dispatch performance update event
        this.dispatchPerformanceUpdate();
    }
    
    dispatchPerformanceUpdate() {
        const event = new CustomEvent('performanceUpdate', {
            detail: this.metrics
        });
        window.dispatchEvent(event);
    }
    
    adjustQuality() {
        const fps = this.currentFPS;
        
        if (fps < this.minFPS && this.currentQuality !== 'low') {
            this.decreaseQuality();
        } else if (fps > this.targetFPS + 10 && this.currentQuality !== 'ultra') {
            this.increaseQuality();
        }
    }
    
    decreaseQuality() {
        const qualities = ['ultra', 'high', 'medium', 'low'];
        const currentIndex = qualities.indexOf(this.currentQuality);
        
        if (currentIndex < qualities.length - 1) {
            this.setQuality(qualities[currentIndex + 1]);
            console.log(`📉 Qualidade reduzida para ${this.currentQuality} (FPS: ${this.currentFPS})`);
        }
    }
    
    increaseQuality() {
        const qualities = ['ultra', 'high', 'medium', 'low'];
        const currentIndex = qualities.indexOf(this.currentQuality);
        
        if (currentIndex > 0) {
            // Wait a bit before increasing quality to ensure stability
            setTimeout(() => {
                if (this.currentFPS > this.targetFPS) {
                    this.setQuality(qualities[currentIndex - 1]);
                    console.log(`📈 Qualidade aumentada para ${this.currentQuality} (FPS: ${this.currentFPS})`);
                }
            }, 2000);
        }
    }
    
    setQuality(quality) {
        if (!this.qualitySettings[quality]) {
            console.warn('Configuração de qualidade inválida:', quality);
            return;
        }
        
        this.currentQuality = quality;
        const settings = this.qualitySettings[quality];
        
        // Apply quality settings
        this.applyQualitySettings(settings);
        
        // Dispatch quality change event
        const event = new CustomEvent('qualityChanged', {
            detail: { quality, settings }
        });
        window.dispatchEvent(event);
    }
    
    applyQualitySettings(settings) {
        // Apply to renderer if available
        if (window.unrealDashboard && window.unrealDashboard.renderer) {
            const renderer = window.unrealDashboard.renderer;
            
            // Pixel ratio
            renderer.setPixelRatio(Math.min(settings.pixelRatio, window.devicePixelRatio));
            
            // Shadow map size
            if (window.unrealDashboard.scene) {
                window.unrealDashboard.scene.traverse((object) => {
                    if (object.isLight && object.shadow) {
                        object.shadow.mapSize.width = settings.shadowMapSize;
                        object.shadow.mapSize.height = settings.shadowMapSize;
                        object.shadow.needsUpdate = true;
                    }
                });
            }
            
            // Antialiasing (requires renderer recreation for full effect)
            // This is a simplified version
            if (renderer.capabilities && renderer.capabilities.antialias !== settings.antialiasing) {
                console.log('Antialiasing setting changed, full effect requires restart');
            }
        }
        
        // Apply to particle systems
        this.applyParticleSettings(settings);
        
        // Apply LOD settings
        if (this.lodManager) {
            this.lodManager.setBias(settings.lodBias);
        }
    }
    
    applyParticleSettings(settings) {
        // Apply particle density settings
        if (window.unrealDashboard && window.unrealDashboard.particleSystem) {
            window.unrealDashboard.particleSystem.setDensity(settings.particleDensity);
        }
    }
    
    setupAutoQuality() {
        // Allow manual quality override
        window.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch(event.key) {
                    case '1':
                        this.setQuality('low');
                        this.autoQuality = false;
                        break;
                    case '2':
                        this.setQuality('medium');
                        this.autoQuality = false;
                        break;
                    case '3':
                        this.setQuality('high');
                        this.autoQuality = false;
                        break;
                    case '4':
                        this.setQuality('ultra');
                        this.autoQuality = false;
                        break;
                    case '0':
                        this.autoQuality = true;
                        console.log('🔄 Auto-quality habilitado');
                        break;
                }
            }
        });
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }
    
    handleResize() {
        // Optimize for new window size
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixels = width * height;
        
        // Adjust quality based on resolution
        if (pixels > 2073600 && this.autoQuality) { // > 1920x1080
            this.setQuality('medium');
        } else if (pixels < 921600 && this.autoQuality) { // < 1280x720
            this.setQuality('high');
        }
        
        console.log(`📐 Resize detectado: ${width}x${height} (${Math.round(pixels/1000)}K pixels)`);
    }
    
    // LOD Management
    initLODManager(scene, camera) {
        this.lodManager = new LODManager(scene, camera);
        return this.lodManager;
    }
    
    // Culling System
    initCullingSystem(scene, camera) {
        this.cullingSystem = new CullingSystem(scene, camera);
        return this.cullingSystem;
    }
    
    // Memory optimization
    optimizeMemory() {
        this.memoryManager.cleanup();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('🧹 Limpeza de memória executada');
    }
    
    // Performance profiling
    startProfiling(duration = 10000) {
        console.log('📊 Iniciando profiling por', duration/1000, 'segundos');
        
        const startTime = performance.now();
        const profile = {
            frames: [],
            averageFPS: 0,
            minFPS: Infinity,
            maxFPS: 0,
            memoryPeak: 0
        };
        
        const profileFrame = () => {
            const now = performance.now();
            const elapsed = now - startTime;
            
            if (elapsed < duration) {
                profile.frames.push({
                    time: elapsed,
                    fps: this.currentFPS,
                    frameTime: this.frameTime,
                    memory: this.metrics.memoryUsage
                });
                
                profile.minFPS = Math.min(profile.minFPS, this.currentFPS);
                profile.maxFPS = Math.max(profile.maxFPS, this.currentFPS);
                profile.memoryPeak = Math.max(profile.memoryPeak, this.metrics.memoryUsage);
                
                requestAnimationFrame(profileFrame);
            } else {
                // Calculate averages
                profile.averageFPS = profile.frames.reduce((sum, frame) => sum + frame.fps, 0) / profile.frames.length;
                
                console.log('📊 Profiling completo:', profile);
                
                // Dispatch profiling complete event
                const event = new CustomEvent('profilingComplete', {
                    detail: profile
                });
                window.dispatchEvent(event);
            }
        };
        
        requestAnimationFrame(profileFrame);
    }
    
    // Get current metrics
    getMetrics() {
        return { ...this.metrics };
    }
    
    // Manual quality control
    setAutoQuality(enabled) {
        this.autoQuality = enabled;
        console.log('🔄 Auto-quality', enabled ? 'habilitado' : 'desabilitado');
    }
    
    // Performance recommendations
    getRecommendations() {
        const recommendations = [];
        
        if (this.currentFPS < this.minFPS) {
            recommendations.push('Considere reduzir a qualidade das sombras');
            recommendations.push('Desabilite pós-processamento');
            recommendations.push('Reduza a densidade de partículas');
        }
        
        if (this.metrics.memoryUsage > 500) {
            recommendations.push('Memória alta detectada - considere otimizar texturas');
            recommendations.push('Execute limpeza de memória');
        }
        
        if (this.frameTime > 33) { // > 30 FPS
            recommendations.push('Frame time alto - otimize geometria complexa');
        }
        
        return recommendations;
    }
}

// Memory Manager
class MemoryManager {
    constructor() {
        this.textureCache = new Map();
        this.geometryCache = new Map();
        this.materialCache = new Map();
        
        this.maxCacheSize = 100;
        this.cleanupInterval = 60000; // 1 minute
    }
    
    init() {
        // Setup automatic cleanup
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
        
        console.log('🧹 Memory Manager inicializado');
    }
    
    cleanup() {
        // Clear caches if they're too large
        if (this.textureCache.size > this.maxCacheSize) {
            this.textureCache.clear();
            console.log('🧹 Cache de texturas limpo');
        }
        
        if (this.geometryCache.size > this.maxCacheSize) {
            this.geometryCache.clear();
            console.log('🧹 Cache de geometria limpo');
        }
        
        if (this.materialCache.size > this.maxCacheSize) {
            this.materialCache.clear();
            console.log('🧹 Cache de materiais limpo');
        }
    }
    
    cacheTexture(key, texture) {
        this.textureCache.set(key, texture);
    }
    
    getTexture(key) {
        return this.textureCache.get(key);
    }
    
    cacheGeometry(key, geometry) {
        this.geometryCache.set(key, geometry);
    }
    
    getGeometry(key) {
        return this.geometryCache.get(key);
    }
    
    cacheMaterial(key, material) {
        this.materialCache.set(key, material);
    }
    
    getMaterial(key) {
        return this.materialCache.get(key);
    }
}

// LOD Manager (Level of Detail)
class LODManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.objects = [];
        this.lodDistances = [25, 50, 100, 200];
        this.bias = 1.0;
    }
    
    addObject(object, lodLevels) {
        this.objects.push({
            object,
            lodLevels: lodLevels || this.createDefaultLODLevels(object)
        });
    }
    
    createDefaultLODLevels(object) {
        return [
            { distance: 25, visible: true, detail: 'high' },
            { distance: 50, visible: true, detail: 'medium' },
            { distance: 100, visible: true, detail: 'low' },
            { distance: 200, visible: false, detail: 'hidden' }
        ];
    }
    
    update() {
        this.objects.forEach(({ object, lodLevels }) => {
            const distance = this.camera.position.distanceTo(object.position) * this.bias;
            
            // Find appropriate LOD level
            let currentLOD = lodLevels[0];
            for (const lod of lodLevels) {
                if (distance >= lod.distance) {
                    currentLOD = lod;
                }
            }
            
            // Apply LOD
            object.visible = currentLOD.visible;
            
            if (object.userData) {
                object.userData.lodLevel = currentLOD.detail;
            }
        });
    }
    
    setBias(bias) {
        this.bias = bias;
    }
}

// Culling System
class CullingSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
    }
    
    update() {
        // Update frustum
        this.cameraMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        // Frustum culling
        this.scene.traverse((object) => {
            if (object.isMesh) {
                const inFrustum = this.frustum.intersectsObject(object);
                
                // Only hide if not in frustum and not marked as always visible
                if (!inFrustum && !object.userData.alwaysVisible) {
                    object.visible = false;
                } else if (inFrustum) {
                    object.visible = true;
                }
            }
        });
    }
}

// Initialize Performance Optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
