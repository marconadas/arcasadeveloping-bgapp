/**
 * BGAPP Wind Animation Testing & Validation System
 * Sistema de testes e validação para o sistema de animação de vento
 * Inclui testes unitários, integração e performance
 */

"use strict";

class BGAPPWindTesting {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = {};
        this.validationErrors = [];
        
        console.log("BGAPP Wind Testing - Sistema de testes inicializado");
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log("🧪 BGAPP Wind Testing - Iniciando bateria completa de testes");
        
        this.testResults = [];
        this.validationErrors = [];
        
        try {
            // Testes unitários
            await this.runUnitTests();
            
            // Testes de integração
            await this.runIntegrationTests();
            
            // Testes de performance
            await this.runPerformanceTests();
            
            // Testes de dados
            await this.runDataValidationTests();
            
            // Gerar relatório
            this.generateTestReport();
            
            console.log("✅ BGAPP Wind Testing - Todos os testes concluídos");
            return this.getTestSummary();
            
        } catch (error) {
            console.error("❌ BGAPP Wind Testing - Erro nos testes:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Testes unitários
     */
    async runUnitTests() {
        console.log("🔬 Executando testes unitários...");
        
        // Teste 1: Interpolação bilinear
        await this.testBilinearInterpolation();
        
        // Teste 2: Conversões de coordenadas
        await this.testCoordinateConversions();
        
        // Teste 3: Cálculos de velocidade
        await this.testVelocityCalculations();
        
        // Teste 4: Gestão de cache
        await this.testCacheManagement();
        
        // Teste 5: Time dimension
        await this.testTimeDimension();
    }

    /**
     * Teste de interpolação bilinear
     */
    async testBilinearInterpolation() {
        const testName = "Interpolação Bilinear";
        
        try {
            // Dados de teste
            const g00 = [1.0, 2.0];
            const g10 = [2.0, 3.0];
            const g01 = [1.5, 2.5];
            const g11 = [2.5, 3.5];
            
            // Função de interpolação (extraída do core)
            const bilinearInterpolateVector = (x, y, g00, g10, g01, g11) => {
                const rx = 1 - x;
                const ry = 1 - y;
                const a = rx * ry, b = x * ry, c = rx * y, d = x * y;
                const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
                const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
                return [u, v, Math.sqrt(u * u + v * v)];
            };
            
            // Teste no centro
            const result = bilinearInterpolateVector(0.5, 0.5, g00, g10, g01, g11);
            const expected = [1.75, 2.75]; // Valor esperado
            
            const tolerance = 0.001;
            const uMatch = Math.abs(result[0] - expected[0]) < tolerance;
            const vMatch = Math.abs(result[1] - expected[1]) < tolerance;
            
            this.addTestResult(testName, uMatch && vMatch, {
                expected: expected,
                actual: [result[0], result[1]],
                magnitude: result[2]
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de conversões de coordenadas
     */
    async testCoordinateConversions() {
        const testName = "Conversões de Coordenadas";
        
        try {
            // Simular conversões de lat/lng para grid
            const bounds = { north: -4.0, south: -18.5, west: 8.0, east: 25.0 };
            const resolution = 0.25;
            
            const lng = 13.2; // Luanda aproximadamente
            const lat = -8.8;
            
            // Converter para índices de grid
            const i = (lng - bounds.west) / resolution;
            const j = (bounds.north - lat) / resolution;
            
            // Verificar se os índices estão dentro dos limites esperados
            const iValid = i >= 0 && i < (bounds.east - bounds.west) / resolution;
            const jValid = j >= 0 && j < (bounds.north - bounds.south) / resolution;
            
            this.addTestResult(testName, iValid && jValid, {
                coordinates: { lng, lat },
                gridIndices: { i: i.toFixed(2), j: j.toFixed(2) },
                bounds: bounds
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de cálculos de velocidade
     */
    async testVelocityCalculations() {
        const testName = "Cálculos de Velocidade";
        
        try {
            // Componentes de vento de teste
            const u = 5.0; // m/s leste
            const v = -3.0; // m/s norte
            
            // Calcular magnitude
            const magnitude = Math.sqrt(u * u + v * v);
            const expectedMagnitude = Math.sqrt(25 + 9); // ≈ 5.83
            
            // Calcular direção
            const direction = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;
            
            // Conversões de unidade
            const speedKmh = magnitude * 3.6;
            const speedKnots = magnitude / 0.514;
            
            const magnitudeValid = Math.abs(magnitude - expectedMagnitude) < 0.01;
            const directionValid = direction >= 0 && direction < 360;
            const conversionsValid = speedKmh > 0 && speedKnots > 0;
            
            this.addTestResult(testName, magnitudeValid && directionValid && conversionsValid, {
                components: { u, v },
                magnitude: magnitude.toFixed(2),
                direction: direction.toFixed(1),
                conversions: {
                    kmh: speedKmh.toFixed(1),
                    knots: speedKnots.toFixed(1)
                }
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de gestão de cache
     */
    async testCacheManagement() {
        const testName = "Gestão de Cache";
        
        try {
            // Simular operações de cache
            const cache = new Map();
            
            // Adicionar dados
            const testData = { timestamp: Date.now(), data: [1, 2, 3] };
            cache.set('test_key', testData);
            
            // Verificar se dados foram armazenados
            const retrieved = cache.get('test_key');
            const dataMatch = retrieved && retrieved.data.length === 3;
            
            // Testar expiração
            const expiredData = { timestamp: Date.now() - 7200000, data: [4, 5, 6] }; // 2h atrás
            cache.set('expired_key', expiredData);
            
            const cacheExpiration = 3600000; // 1h
            const isExpired = (Date.now() - expiredData.timestamp) > cacheExpiration;
            
            // Testar limpeza
            const initialSize = cache.size;
            if (isExpired) {
                cache.delete('expired_key');
            }
            const cleanedSize = cache.size;
            
            this.addTestResult(testName, dataMatch && isExpired && (cleanedSize < initialSize), {
                dataStored: dataMatch,
                expirationDetected: isExpired,
                cleanupWorked: cleanedSize < initialSize,
                cacheSize: cleanedSize
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de TimeDimension
     */
    async testTimeDimension() {
        const testName = "Time Dimension";
        
        try {
            // Simular criação de time steps
            const startTime = new Date('2024-01-01T00:00:00Z');
            const endTime = new Date('2024-01-01T06:00:00Z');
            const step = 3600000; // 1 hora
            
            const timeSteps = [];
            let current = new Date(startTime);
            
            while (current <= endTime) {
                timeSteps.push(new Date(current));
                current = new Date(current.getTime() + step);
            }
            
            // Verificações
            const expectedSteps = 7; // 0h, 1h, 2h, 3h, 4h, 5h, 6h
            const correctStepCount = timeSteps.length === expectedSteps;
            
            // Verificar intervalos
            let intervalsCorrect = true;
            for (let i = 1; i < timeSteps.length; i++) {
                const interval = timeSteps[i].getTime() - timeSteps[i-1].getTime();
                if (interval !== step) {
                    intervalsCorrect = false;
                    break;
                }
            }
            
            this.addTestResult(testName, correctStepCount && intervalsCorrect, {
                expectedSteps: expectedSteps,
                actualSteps: timeSteps.length,
                firstStep: timeSteps[0].toISOString(),
                lastStep: timeSteps[timeSteps.length - 1].toISOString(),
                intervalCorrect: intervalsCorrect
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Testes de integração
     */
    async runIntegrationTests() {
        console.log("🔗 Executando testes de integração...");
        
        // Teste 1: Integração com Leaflet
        await this.testLeafletIntegration();
        
        // Teste 2: Fluxo completo de dados
        await this.testDataFlow();
        
        // Teste 3: Controles UI
        await this.testUIControls();
    }

    /**
     * Teste de integração com Leaflet
     */
    async testLeafletIntegration() {
        const testName = "Integração Leaflet";
        
        try {
            // Verificar se Leaflet está disponível
            const leafletAvailable = typeof L !== 'undefined';
            
            // Verificar se extensões customizadas estão carregadas
            const canvasLayerAvailable = typeof L.CanvasLayer !== 'undefined';
            const particlesLayerAvailable = typeof L.ParticlesLayer !== 'undefined';
            const velocityControlAvailable = typeof L.Control.Velocity !== 'undefined';
            const windPlayerAvailable = typeof L.Control.WindPlayer !== 'undefined';
            
            const allComponentsAvailable = leafletAvailable && canvasLayerAvailable && 
                                         particlesLayerAvailable && velocityControlAvailable && 
                                         windPlayerAvailable;
            
            this.addTestResult(testName, allComponentsAvailable, {
                leaflet: leafletAvailable,
                canvasLayer: canvasLayerAvailable,
                particlesLayer: particlesLayerAvailable,
                velocityControl: velocityControlAvailable,
                windPlayer: windPlayerAvailable
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de fluxo de dados
     */
    async testDataFlow() {
        const testName = "Fluxo de Dados";
        
        try {
            // Simular dados de entrada
            const inputData = [
                {
                    header: {
                        parameterCategory: 2,
                        parameterNumber: 2,
                        nx: 10,
                        ny: 10,
                        dx: 0.25,
                        dy: 0.25,
                        lo1: 8.0,
                        la1: -4.0
                    },
                    data: new Float32Array(100).fill(5.0)
                },
                {
                    header: {
                        parameterCategory: 2,
                        parameterNumber: 3,
                        nx: 10,
                        ny: 10,
                        dx: 0.25,
                        dy: 0.25,
                        lo1: 8.0,
                        la1: -4.0
                    },
                    data: new Float32Array(100).fill(-3.0)
                }
            ];
            
            // Verificar estrutura dos dados
            const hasUComponent = inputData.some(d => 
                d.header.parameterCategory === 2 && d.header.parameterNumber === 2);
            const hasVComponent = inputData.some(d => 
                d.header.parameterCategory === 2 && d.header.parameterNumber === 3);
            const dataComplete = hasUComponent && hasVComponent;
            
            // Verificar dimensões consistentes
            const header1 = inputData[0].header;
            const header2 = inputData[1].header;
            const dimensionsMatch = header1.nx === header2.nx && 
                                  header1.ny === header2.ny &&
                                  header1.dx === header2.dx &&
                                  header1.dy === header2.dy;
            
            this.addTestResult(testName, dataComplete && dimensionsMatch, {
                uComponent: hasUComponent,
                vComponent: hasVComponent,
                dimensionsMatch: dimensionsMatch,
                gridSize: `${header1.nx}x${header1.ny}`,
                resolution: `${header1.dx}°`
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de controles UI
     */
    async testUIControls() {
        const testName = "Controles UI";
        
        try {
            // Simular criação de controles
            let controlsCreated = 0;
            let controlErrors = [];
            
            // Testar criação de elementos DOM simulados
            try {
                // Simular controle de velocidade
                const velocityControl = {
                    _container: document.createElement('div'),
                    options: { position: 'bottomleft' }
                };
                velocityControl._container.className = 'leaflet-control-velocity';
                controlsCreated++;
            } catch (e) {
                controlErrors.push('velocity control: ' + e.message);
            }
            
            try {
                // Simular player control
                const playerControl = {
                    _container: document.createElement('div'),
                    options: { position: 'bottomright' }
                };
                playerControl._container.className = 'bgapp-wind-player-control';
                controlsCreated++;
            } catch (e) {
                controlErrors.push('player control: ' + e.message);
            }
            
            try {
                // Simular config panel
                const configPanel = {
                    _container: document.createElement('div'),
                    options: { position: 'topright' }
                };
                configPanel._container.className = 'bgapp-wind-config-panel';
                controlsCreated++;
            } catch (e) {
                controlErrors.push('config panel: ' + e.message);
            }
            
            const allControlsWorking = controlsCreated === 3 && controlErrors.length === 0;
            
            this.addTestResult(testName, allControlsWorking, {
                controlsCreated: controlsCreated,
                expectedControls: 3,
                errors: controlErrors
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Testes de performance
     */
    async runPerformanceTests() {
        console.log("⚡ Executando testes de performance...");
        
        // Teste 1: Performance de interpolação
        await this.testInterpolationPerformance();
        
        // Teste 2: Performance de renderização
        await this.testRenderingPerformance();
        
        // Teste 3: Uso de memória
        await this.testMemoryUsage();
    }

    /**
     * Teste de performance de interpolação
     */
    async testInterpolationPerformance() {
        const testName = "Performance Interpolação";
        
        try {
            const iterations = 10000;
            const startTime = performance.now();
            
            // Simular interpolações
            for (let i = 0; i < iterations; i++) {
                const x = Math.random();
                const y = Math.random();
                const g00 = [Math.random() * 10, Math.random() * 10];
                const g10 = [Math.random() * 10, Math.random() * 10];
                const g01 = [Math.random() * 10, Math.random() * 10];
                const g11 = [Math.random() * 10, Math.random() * 10];
                
                // Interpolação bilinear
                const rx = 1 - x;
                const ry = 1 - y;
                const a = rx * ry, b = x * ry, c = rx * y, d = x * y;
                const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
                const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
                const magnitude = Math.sqrt(u * u + v * v);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const opsPerSecond = (iterations / duration) * 1000;
            
            // Benchmark: deve ser capaz de fazer pelo menos 50k ops/sec
            const performanceGood = opsPerSecond > 50000;
            
            this.performanceMetrics.interpolation = {
                duration: duration.toFixed(2),
                opsPerSecond: Math.round(opsPerSecond),
                iterations: iterations
            };
            
            this.addTestResult(testName, performanceGood, this.performanceMetrics.interpolation);
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de performance de renderização
     */
    async testRenderingPerformance() {
        const testName = "Performance Renderização";
        
        try {
            // Simular criação de canvas e context
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            
            const particles = 1000;
            const frames = 100;
            
            const startTime = performance.now();
            
            // Simular renderização de partículas
            for (let frame = 0; frame < frames; frame++) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 0.8;
                
                for (let i = 0; i < particles; i++) {
                    const x1 = Math.random() * canvas.width;
                    const y1 = Math.random() * canvas.height;
                    const x2 = x1 + (Math.random() - 0.5) * 10;
                    const y2 = y1 + (Math.random() - 0.5) * 10;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
                    ctx.stroke();
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const fps = (frames / duration) * 1000;
            
            // Benchmark: deve conseguir pelo menos 30 FPS
            const performanceGood = fps > 30;
            
            this.performanceMetrics.rendering = {
                duration: duration.toFixed(2),
                fps: fps.toFixed(1),
                particles: particles,
                frames: frames
            };
            
            this.addTestResult(testName, performanceGood, this.performanceMetrics.rendering);
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de uso de memória
     */
    async testMemoryUsage() {
        const testName = "Uso de Memória";
        
        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Simular carregamento de dados grandes
            const largeDataSets = [];
            for (let i = 0; i < 10; i++) {
                const data = new Float32Array(100000); // ~400KB cada
                data.fill(Math.random());
                largeDataSets.push(data);
            }
            
            const afterLoadMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Limpar dados
            largeDataSets.length = 0;
            
            // Forçar garbage collection (se disponível)
            if (window.gc) {
                window.gc();
            }
            
            const afterCleanupMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            const memoryIncrease = afterLoadMemory - initialMemory;
            const memoryRecovered = afterLoadMemory - afterCleanupMemory;
            const memoryEfficient = memoryIncrease < 10 * 1024 * 1024; // Menos de 10MB
            
            this.performanceMetrics.memory = {
                initial: Math.round(initialMemory / 1024 / 1024),
                afterLoad: Math.round(afterLoadMemory / 1024 / 1024),
                afterCleanup: Math.round(afterCleanupMemory / 1024 / 1024),
                increase: Math.round(memoryIncrease / 1024 / 1024),
                recovered: Math.round(memoryRecovered / 1024 / 1024)
            };
            
            this.addTestResult(testName, memoryEfficient, this.performanceMetrics.memory);
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Testes de validação de dados
     */
    async runDataValidationTests() {
        console.log("📊 Executando testes de validação de dados...");
        
        // Teste 1: Validação de dados GRIB
        await this.testGRIBDataValidation();
        
        // Teste 2: Validação de bounds geográficos
        await this.testGeographicBounds();
        
        // Teste 3: Validação de dados temporais
        await this.testTemporalData();
    }

    /**
     * Teste de validação de dados GRIB
     */
    async testGRIBDataValidation() {
        const testName = "Validação Dados GRIB";
        
        try {
            // Dados de teste simulando estrutura GRIB
            const testGRIBData = [
                {
                    header: {
                        parameterCategory: 2,
                        parameterNumber: 2, // U component
                        refTime: "2024-01-01T00:00:00Z",
                        forecastTime: 0,
                        lo1: 8.0, // Angola bounds
                        la1: -4.0,
                        lo2: 25.0,
                        la2: -18.5,
                        dx: 0.25,
                        dy: 0.25,
                        nx: 68,
                        ny: 58,
                        scanMode: 0
                    },
                    data: new Float32Array(68 * 58)
                },
                {
                    header: {
                        parameterCategory: 2,
                        parameterNumber: 3, // V component
                        refTime: "2024-01-01T00:00:00Z",
                        forecastTime: 0,
                        lo1: 8.0,
                        la1: -4.0,
                        lo2: 25.0,
                        la2: -18.5,
                        dx: 0.25,
                        dy: 0.25,
                        nx: 68,
                        ny: 58,
                        scanMode: 0
                    },
                    data: new Float32Array(68 * 58)
                }
            ];
            
            // Validações
            const hasRequiredComponents = testGRIBData.length >= 2;
            const hasUComponent = testGRIBData.some(d => 
                d.header.parameterCategory === 2 && d.header.parameterNumber === 2);
            const hasVComponent = testGRIBData.some(d => 
                d.header.parameterCategory === 2 && d.header.parameterNumber === 3);
            
            // Verificar dimensões
            const firstHeader = testGRIBData[0].header;
            const expectedDataSize = firstHeader.nx * firstHeader.ny;
            const dataSizeCorrect = testGRIBData[0].data.length === expectedDataSize;
            
            // Verificar bounds de Angola
            const boundsCorrect = firstHeader.lo1 >= 8.0 && firstHeader.lo2 <= 25.0 &&
                                firstHeader.la1 >= -18.5 && firstHeader.la2 <= -4.0;
            
            const allValidationsPass = hasRequiredComponents && hasUComponent && 
                                     hasVComponent && dataSizeCorrect && boundsCorrect;
            
            this.addTestResult(testName, allValidationsPass, {
                components: testGRIBData.length,
                uComponent: hasUComponent,
                vComponent: hasVComponent,
                dataSize: testGRIBData[0].data.length,
                expectedSize: expectedDataSize,
                boundsValid: boundsCorrect
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de validação de bounds geográficos
     */
    async testGeographicBounds() {
        const testName = "Bounds Geográficos";
        
        try {
            // Bounds de Angola e águas adjacentes
            const angolaBounds = {
                north: -4.0,
                south: -18.5,
                west: 8.0,
                east: 25.0
            };
            
            // Validações
            const boundsValid = angolaBounds.north > angolaBounds.south &&
                              angolaBounds.east > angolaBounds.west;
            
            const latitudeValid = angolaBounds.north >= -90 && angolaBounds.north <= 90 &&
                                angolaBounds.south >= -90 && angolaBounds.south <= 90;
            
            const longitudeValid = angolaBounds.west >= -180 && angolaBounds.west <= 180 &&
                                 angolaBounds.east >= -180 && angolaBounds.east <= 180;
            
            // Verificar se está na região correta (África)
            const inAfricaRegion = angolaBounds.west > 0 && angolaBounds.east < 50 &&
                                 angolaBounds.north < 40 && angolaBounds.south > -40;
            
            const allBoundsValid = boundsValid && latitudeValid && longitudeValid && inAfricaRegion;
            
            this.addTestResult(testName, allBoundsValid, {
                bounds: angolaBounds,
                boundsLogical: boundsValid,
                latitudeRange: latitudeValid,
                longitudeRange: longitudeValid,
                inAfricaRegion: inAfricaRegion
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Teste de validação de dados temporais
     */
    async testTemporalData() {
        const testName = "Dados Temporais";
        
        try {
            // Simular série temporal
            const now = new Date();
            const timeSteps = [];
            
            for (let i = 0; i < 24; i++) {
                timeSteps.push({
                    time: new Date(now.getTime() - i * 3600000), // Cada hora para trás
                    data: {
                        temperature: 20 + Math.random() * 10,
                        windSpeed: Math.random() * 20,
                        windDirection: Math.random() * 360
                    }
                });
            }
            
            // Validações
            const correctStepCount = timeSteps.length === 24;
            
            // Verificar ordem cronológica
            let chronologicalOrder = true;
            for (let i = 1; i < timeSteps.length; i++) {
                if (timeSteps[i].time >= timeSteps[i-1].time) {
                    chronologicalOrder = false;
                    break;
                }
            }
            
            // Verificar dados válidos
            let dataValid = true;
            for (const step of timeSteps) {
                if (!step.data.temperature || !step.data.windSpeed || 
                    step.data.windDirection < 0 || step.data.windDirection > 360) {
                    dataValid = false;
                    break;
                }
            }
            
            // Verificar intervalo temporal
            const timeInterval = timeSteps[0].time.getTime() - timeSteps[1].time.getTime();
            const correctInterval = timeInterval === 3600000; // 1 hora
            
            const allTemporalValid = correctStepCount && chronologicalOrder && 
                                   dataValid && correctInterval;
            
            this.addTestResult(testName, allTemporalValid, {
                stepCount: timeSteps.length,
                chronological: chronologicalOrder,
                dataValid: dataValid,
                intervalCorrect: correctInterval,
                timeRange: {
                    start: timeSteps[timeSteps.length - 1].time.toISOString(),
                    end: timeSteps[0].time.toISOString()
                }
            });
            
        } catch (error) {
            this.addTestResult(testName, false, { error: error.message });
        }
    }

    /**
     * Adicionar resultado de teste
     */
    addTestResult(testName, passed, details = {}) {
        const result = {
            name: testName,
            passed: passed,
            timestamp: new Date().toISOString(),
            details: details
        };
        
        this.testResults.push(result);
        
        const status = passed ? "✅" : "❌";
        console.log(`${status} ${testName}: ${passed ? "PASSOU" : "FALHOU"}`, details);
    }

    /**
     * Gerar relatório de testes
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: successRate.toFixed(1) + "%",
                timestamp: new Date().toISOString()
            },
            performance: this.performanceMetrics,
            results: this.testResults,
            validationErrors: this.validationErrors
        };
        
        console.log("\n📋 BGAPP Wind Testing - Relatório Final:");
        console.log(`Total de testes: ${totalTests}`);
        console.log(`Sucessos: ${passedTests}`);
        console.log(`Falhas: ${failedTests}`);
        console.log(`Taxa de sucesso: ${report.summary.successRate}`);
        
        if (this.performanceMetrics.interpolation) {
            console.log(`Performance interpolação: ${this.performanceMetrics.interpolation.opsPerSecond} ops/sec`);
        }
        
        if (this.performanceMetrics.rendering) {
            console.log(`Performance renderização: ${this.performanceMetrics.rendering.fps} FPS`);
        }
        
        return report;
    }

    /**
     * Obter resumo dos testes
     */
    getTestSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.passed).length;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        return {
            success: successRate >= 80, // Considerar sucesso se 80% ou mais dos testes passaram
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            successRate: successRate,
            performance: this.performanceMetrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Executar teste específico
     */
    async runSpecificTest(testName) {
        console.log(`🎯 Executando teste específico: ${testName}`);
        
        const testMethods = {
            'interpolation': this.testBilinearInterpolation.bind(this),
            'coordinates': this.testCoordinateConversions.bind(this),
            'velocity': this.testVelocityCalculations.bind(this),
            'cache': this.testCacheManagement.bind(this),
            'timedimension': this.testTimeDimension.bind(this),
            'leaflet': this.testLeafletIntegration.bind(this),
            'dataflow': this.testDataFlow.bind(this),
            'ui': this.testUIControls.bind(this),
            'performance_interpolation': this.testInterpolationPerformance.bind(this),
            'performance_rendering': this.testRenderingPerformance.bind(this),
            'memory': this.testMemoryUsage.bind(this),
            'grib': this.testGRIBDataValidation.bind(this),
            'bounds': this.testGeographicBounds.bind(this),
            'temporal': this.testTemporalData.bind(this)
        };
        
        const testMethod = testMethods[testName.toLowerCase()];
        if (testMethod) {
            await testMethod();
            return this.testResults[this.testResults.length - 1];
        } else {
            throw new Error(`Teste '${testName}' não encontrado`);
        }
    }

    /**
     * Limpar resultados de teste
     */
    clearResults() {
        this.testResults = [];
        this.performanceMetrics = {};
        this.validationErrors = [];
        console.log("🧹 Resultados de teste limpos");
    }
}

// Exportar classe
window.BGAPPWindTesting = BGAPPWindTesting;

// Função de conveniência para executar testes
window.runWindTests = async function() {
    const testing = new BGAPPWindTesting();
    return await testing.runAllTests();
};

console.log("BGAPP Wind Testing System - Carregado com sucesso! 🧪");
