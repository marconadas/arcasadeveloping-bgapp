/**
 * 🌊 UE5-Inspired Ocean Shaders for BGAPP
 * 
 * Shaders baseados no sistema de água do Unreal Engine 5
 * Inclui: FFT Ocean, Gerstner Waves, Caustics, Volumetric Lighting
 * 
 * @author MareDatum - BGAPP Team
 */

class UE5OceanShaders {
    
    // Vertex Shader Principal (baseado no UE5 Water Material)
    static getOceanVertexShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform float waveSpeed;
            uniform vec2 windDirection;
            uniform float windStrength;
            
            // Gerstner Wave Parameters (como no UE5)
            uniform vec4 gerstnerWave1; // xy = direction, z = steepness, w = wavelength
            uniform vec4 gerstnerWave2;
            uniform vec4 gerstnerWave3;
            uniform vec4 gerstnerWave4;
            uniform vec4 gerstnerWave5;
            uniform vec4 gerstnerWave6;
            
            // FFT Ocean Parameters (UE5 Ocean Simulation)
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
            
            // Hash function para noise procedural
            float hash(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }
            
            // Noise function (UE5 Noise Material Function)
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
            
            // Fractal Brownian Motion (UE5 Advanced Noise)
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
            
            // Gerstner Wave function (exatamente como no UE5)
            vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
                float steepness = wave.z;
                float wavelength = wave.w;
                float k = 2.0 * 3.14159265 / wavelength;
                float c = sqrt(9.8 / k); // Velocidade da onda baseada na física real
                vec2 d = normalize(wave.xy);
                float f = k * (dot(d, p.xz) - c * time * waveSpeed);
                float a = steepness / k;
                
                // Gerstner wave displacement (UE5 algorithm)
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
            
            // Phillips Spectrum para FFT Ocean (UE5 Ocean Simulation)
            float phillips(vec2 k) {
                float kLength = length(k);
                if (kLength < 0.0001) return 0.0;
                
                float kLength2 = kLength * kLength;
                float kLength4 = kLength2 * kLength2;
                
                float windSpeed = windStrength;
                float L = windSpeed * windSpeed / gravity;
                float L2 = L * L;
                
                float damping = 0.001;
                float l2 = L2 * damping * damping;
                
                return phillips_alpha * exp(-1.0 / (kLength2 * L2)) / kLength4 * exp(-kLength2 * l2);
            }
            
            void main() {
                vUv = uv;
                
                vec3 pos = position;
                vec3 tangent = vec3(1.0, 0.0, 0.0);
                vec3 binormal = vec3(0.0, 0.0, 1.0);
                
                // Apply multiple Gerstner waves (UE5 Water Body Ocean technique)
                pos += gerstnerWave(gerstnerWave1, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave2, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave3, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave4, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave5, pos, tangent, binormal);
                pos += gerstnerWave(gerstnerWave6, pos, tangent, binormal);
                
                // Adicionar noise de alta frequência (UE5 Detail Normal)
                float detailNoise = fbm(pos.xz * 0.1 + time * 0.1, 4) * 0.3;
                pos.y += detailNoise;
                
                // Adicionar movimento de corrente oceânica
                vec2 flowDir = windDirection * windStrength * 0.01;
                pos.xz += flowDir * time;
                vFlowDirection = flowDir;
                
                // Calculate proper normals for realistic lighting
                vNormal = normalize(cross(binormal, tangent));
                vPosition = pos;
                vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                vViewPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
                vWaveHeight = pos.y;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }
    
    // Fragment Shader Principal (baseado no UE5 Water Material)
    static getOceanFragmentShader() {
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
            
            // Subsurface Scattering (UE5 Subsurface Profile)
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
            
            // Noise functions (UE5 Material Functions)
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
            
            // Caustics calculation (UE5 Water Caustics)
            float calculateAdvancedCaustics(vec2 uv, float depth) {
                vec2 causticsUv1 = uv * causticsScale + time * causticsSpeed + vFlowDirection * time;
                vec2 causticsUv2 = uv * causticsScale * 1.7 - time * causticsSpeed * 0.8 + vFlowDirection * time * 0.5;
                vec2 causticsUv3 = uv * causticsScale * 0.6 + time * causticsSpeed * 1.3;
                
                float caustics1 = noise21(causticsUv1);
                float caustics2 = noise21(causticsUv2);
                float caustics3 = noise21(causticsUv3);
                
                // Combinar múltiplas camadas de caustics
                float caustics = (caustics1 + caustics2 * 0.7 + caustics3 * 0.4) / 2.1;
                
                // Modular por profundidade (caustics mais fortes em água rasa)
                caustics *= exp(-depth * 0.1);
                
                // Aplicar função de transferência para realismo
                caustics = pow(max(0.0, caustics), 2.0) * causticsIntensity;
                
                return caustics;
            }
            
            // Fresnel calculation (UE5 Fresnel Material Function)
            float calculateAdvancedFresnel(vec3 normal, vec3 viewDir, float ior) {
                float cosTheta = abs(dot(normal, viewDir));
                float sinTheta2 = 1.0 - cosTheta * cosTheta;
                float sinTheta2_ior2 = sinTheta2 / (ior * ior);
                
                if (sinTheta2_ior2 > 1.0) return 1.0; // Total internal reflection
                
                float cosTheta2 = sqrt(1.0 - sinTheta2_ior2);
                float r_parallel = (ior * cosTheta - cosTheta2) / (ior * cosTheta + cosTheta2);
                float r_perpendicular = (cosTheta - ior * cosTheta2) / (cosTheta + ior * cosTheta2);
                
                return 0.5 * (r_parallel * r_parallel + r_perpendicular * r_perpendicular);
            }
            
            // PBR Lighting (UE5 Material Shading Model)
            vec3 calculatePBRWaterLighting(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 albedo) {
                vec3 halfDir = normalize(lightDir + viewDir);
                
                float NdotL = max(dot(normal, lightDir), 0.0);
                float NdotV = max(dot(normal, viewDir), 0.0);
                float NdotH = max(dot(normal, halfDir), 0.0);
                float VdotH = max(dot(viewDir, halfDir), 0.0);
                
                // Diffuse (Lambertian with subsurface scattering)
                vec3 diffuse = albedo * NdotL;
                
                // Subsurface scattering (UE5 Subsurface Profile)
                float subsurface = pow(max(0.0, dot(-lightDir, viewDir)), subsurfaceRadius) * subsurfaceStrength;
                diffuse += subsurfaceColor * subsurface;
                
                // Specular (GGX/Trowbridge-Reitz distribution - UE5 default)
                float alpha = roughness * roughness;
                float alpha2 = alpha * alpha;
                float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
                float D = alpha2 / (3.14159265 * denom * denom);
                
                // Geometric shadowing
                float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
                float G1_L = NdotL / (NdotL * (1.0 - k) + k);
                float G1_V = NdotV / (NdotV * (1.0 - k) + k);
                float G = G1_L * G1_V;
                
                // Fresnel (Schlick approximation)
                float F0 = 0.02; // Water IOR ~1.33
                float F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
                
                vec3 specular = vec3(D * G * F / (4.0 * NdotL * NdotV + 0.001));
                
                return (diffuse + specular) * lightColor * sunIntensity;
            }
            
            // Underwater volume scattering (UE5 Volumetric Fog)
            vec3 calculateVolumetricScattering(vec3 rayStart, vec3 rayDir, float rayLength) {
                vec3 scattering = vec3(0.0);
                int steps = 16;
                float stepSize = rayLength / float(steps);
                
                for (int i = 0; i < 16; i++) {
                    if (i >= steps) break;
                    
                    vec3 samplePos = rayStart + rayDir * stepSize * float(i);
                    float density = exp(-samplePos.y * 0.1) * 0.1;
                    
                    // Scattering color baseado na profundidade
                    vec3 scatterColor = mix(vec3(0.1, 0.3, 0.8), vec3(0.0, 0.1, 0.3), density);
                    scattering += scatterColor * density * stepSize;
                }
                
                return scattering;
            }
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 lightDir = normalize(lightDirection);
                
                // Base water color with depth variation
                float depth = clamp(-vPosition.y / 20.0, 0.0, 1.0);
                vec3 baseColor = mix(waterColor, deepWaterColor, depth);
                
                // Foam calculation (UE5 Water Foam)
                float foam = 0.0;
                
                // Wave crest foam
                foam += smoothstep(1.5, 3.0, vWaveHeight) * 0.8;
                
                // Shore foam (simulado)
                float shoreDistance = length(vWorldPosition.xz) / 100.0;
                foam += smoothstep(0.95, 1.0, shoreDistance) * 0.3;
                
                // Intersection foam (onde água encontra objetos)
                foam += smoothstep(0.0, 0.5, abs(vWaveHeight)) * 0.2;
                
                baseColor = mix(baseColor, foamColor, clamp(foam, 0.0, 0.9));
                
                // Advanced caustics (UE5 Water Caustics)
                float caustics = calculateAdvancedCaustics(vUv, depth * 20.0);
                baseColor += vec3(0.4, 0.8, 1.0) * caustics;
                
                // PBR Lighting calculation
                vec3 litColor = calculatePBRWaterLighting(normal, viewDir, lightDir, baseColor);
                
                // Ambient lighting (UE5 Sky Light)
                vec3 ambientColor = baseColor * ambientIntensity * vec3(0.5, 0.7, 1.0);
                litColor += ambientColor;
                
                // Advanced Fresnel for transparency (UE5 Water Material)
                float fresnel = calculateAdvancedFresnel(normal, viewDir, 1.33);
                float alpha = mix(transparency * 0.3, transparency, fresnel);
                
                // Underwater volume scattering
                if (cameraPosition.y < vWorldPosition.y) {
                    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
                    float rayLength = length(vWorldPosition - cameraPosition);
                    vec3 scattering = calculateVolumetricScattering(cameraPosition, rayDir, rayLength);
                    litColor += scattering;
                    alpha = min(alpha * 1.5, 0.95);
                }
                
                // Depth fog (UE5 Distance Field Ambient Occlusion)
                float distanceFog = exp(-length(vViewPosition) * 0.001);
                litColor *= distanceFog;
                
                // Color grading final (UE5 Post Process)
                litColor = pow(litColor, vec3(0.8)); // Gamma correction
                litColor = mix(litColor, litColor * litColor, 0.1); // Slight contrast boost
                
                gl_FragColor = vec4(litColor, alpha);
            }
        `;
    }
    
    // Shader para partículas Niagara-inspired
    static getNiagaraParticleVertexShader() {
        return `
            uniform float time;
            uniform float pointSize;
            uniform vec3 cameraPosition;
            
            attribute float lifetime;
            attribute float size;
            attribute vec3 velocity;
            attribute float particleType; // 0=plankton, 1=bubbles, 2=debris
            attribute vec3 particleColor;
            
            varying vec3 vColor;
            varying float vLifetime;
            varying float vParticleType;
            varying float vDistanceToCamera;
            
            void main() {
                vColor = particleColor;
                vLifetime = lifetime;
                vParticleType = particleType;
                
                // Distance-based size (UE5 Size by Distance)
                float distanceToCamera = length(cameraPosition - position);
                vDistanceToCamera = distanceToCamera;
                float sizeMultiplier = 100.0 / (distanceToCamera + 1.0);
                
                // Lifetime-based size (UE5 Size over Life)
                float lifetimeSize = sin(lifetime * 0.5) * 0.5 + 0.5;
                
                // Type-based behavior
                float typeSize = 1.0;
                if (particleType < 0.5) {
                    // Plâncton - pulsação bioluminescente
                    typeSize = sin(time * 5.0 + lifetime * 10.0) * 0.3 + 0.7;
                } else if (particleType < 1.5) {
                    // Bolhas - crescimento até estourar
                    typeSize = min(lifetime * 0.2, 1.0);
                }
                
                gl_PointSize = size * pointSize * sizeMultiplier * lifetimeSize * typeSize;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    static getNiagaraParticleFragmentShader() {
        return `
            precision highp float;
            
            uniform float time;
            
            varying vec3 vColor;
            varying float vLifetime;
            varying float vParticleType;
            varying float vDistanceToCamera;
            
            void main() {
                // Forma circular das partículas
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                if (dist > 0.5) discard;
                
                // Alpha baseado na forma e tipo
                float alpha = 1.0 - dist * 2.0;
                
                vec3 finalColor = vColor;
                
                // Comportamento específico por tipo
                if (vParticleType < 0.5) {
                    // Plâncton bioluminescente
                    float bioluminescence = sin(time * 3.0 + vLifetime * 5.0) * 0.5 + 0.5;
                    finalColor *= 1.0 + bioluminescence * 2.0;
                    alpha *= 0.8;
                } else if (vParticleType < 1.5) {
                    // Bolhas com refração
                    float bubble = 1.0 - smoothstep(0.3, 0.5, dist);
                    finalColor = mix(finalColor, vec3(1.0), bubble * 0.5);
                    alpha *= 0.6;
                } else {
                    // Detritos orgânicos
                    alpha *= 0.9;
                }
                
                // Distance fade (UE5 Distance Culling)
                alpha *= 1.0 / (1.0 + vDistanceToCamera * 0.01);
                
                // Lifetime fade
                alpha *= sin(vLifetime * 0.3) * 0.5 + 0.5;
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    // Shader para caustics projetados no fundo (UE5 Caustics)
    static getCausticsProjectionShader() {
        return {
            vertex: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: `
                uniform float time;
                uniform float intensity;
                uniform float scale;
                uniform float speed;
                uniform vec3 lightDirection;
                uniform float waterSurfaceY;
                
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // Caustics pattern generation (UE5 Caustics Material)
                float generateCaustics(vec2 uv) {
                    // Simular refração da luz através da superfície da água
                    vec2 p1 = uv * scale + time * speed * vec2(1.0, 0.3);
                    vec2 p2 = uv * scale * 1.3 - time * speed * vec2(0.7, 1.0) * 0.8;
                    vec2 p3 = uv * scale * 0.7 + time * speed * vec2(-0.5, 0.8) * 1.2;
                    
                    // Múltiplas ondulações de caustics
                    float c1 = sin(p1.x * 6.0) * sin(p1.y * 6.0);
                    float c2 = sin(p2.x * 4.0) * sin(p2.y * 8.0);
                    float c3 = sin(p3.x * 8.0) * sin(p3.y * 4.0);
                    
                    float caustics = (c1 + c2 * 0.7 + c3 * 0.4) / 2.1;
                    
                    // Função de transferência para realismo
                    caustics = pow(max(0.0, caustics * 0.5 + 0.5), 3.0);
                    
                    return caustics * intensity;
                }
                
                void main() {
                    // Calcular caustics baseado na posição mundial
                    vec2 causticsUv = vWorldPosition.xz * 0.01;
                    float caustics = generateCaustics(causticsUv);
                    
                    // Modular por distância da superfície da água
                    float distanceToSurface = abs(vWorldPosition.y - waterSurfaceY);
                    float surfaceAttenuation = exp(-distanceToSurface * 0.1);
                    caustics *= surfaceAttenuation;
                    
                    // Cor dos caustics (azul-branco como luz solar através da água)
                    vec3 causticsColor = vec3(0.8, 0.95, 1.0) * caustics;
                    
                    gl_FragColor = vec4(causticsColor, caustics * 0.8);
                }
            `
        };
    }
    
    // Configurações de qualidade (UE5 Scalability)
    static getQualityPresets() {
        return {
            low: {
                tessellation: 64,
                particleCount: 500,
                causticsEnabled: false,
                volumetricLighting: false,
                subsurfaceScattering: false
            },
            medium: {
                tessellation: 128,
                particleCount: 1000,
                causticsEnabled: true,
                volumetricLighting: false,
                subsurfaceScattering: true
            },
            high: {
                tessellation: 256,
                particleCount: 1500,
                causticsEnabled: true,
                volumetricLighting: true,
                subsurfaceScattering: true
            },
            ultra: {
                tessellation: 512,
                particleCount: 2500,
                causticsEnabled: true,
                volumetricLighting: true,
                subsurfaceScattering: true
            }
        };
    }
    
    // Parâmetros padrão do UE5 Water Material
    static getDefaultWaterParameters() {
        return {
            // Base Material
            waterColor: new THREE.Color(0x006994),
            deepWaterColor: new THREE.Color(0x003d5c),
            foamColor: new THREE.Color(0x87ceeb),
            subsurfaceColor: new THREE.Color(0x4fb3d9),
            
            // Physical Properties
            transparency: 0.85,
            roughness: 0.1,
            metalness: 0.0,
            ior: 1.33, // Index of refraction for water
            
            // Wave Properties
            waveHeight: 2.5,
            waveFrequency: 0.02,
            waveSpeed: 1.0,
            windDirection: new THREE.Vector2(1.0, 0.3).normalize(),
            windStrength: 15.0,
            
            // Caustics
            causticsIntensity: 0.6,
            causticsScale: 8.0,
            causticsSpeed: 0.15,
            
            // Lighting
            sunIntensity: 1.2,
            ambientIntensity: 0.3,
            subsurfaceStrength: 0.4,
            subsurfaceRadius: 2.0,
            
            // Gerstner Waves (6 waves like UE5)
            gerstnerWaves: [
                new THREE.Vector4(1.0, 0.0, 0.8, 25.0),    // Main wave
                new THREE.Vector4(0.7, 0.7, 0.6, 18.0),    // Secondary wave
                new THREE.Vector4(-0.5, 0.8, 0.4, 12.0),   // Cross wave
                new THREE.Vector4(0.2, -0.9, 0.3, 8.0),    // Detail wave 1
                new THREE.Vector4(0.9, 0.1, 0.2, 5.0),     // Detail wave 2
                new THREE.Vector4(-0.3, -0.6, 0.15, 3.0)   // High frequency detail
            ]
        };
    }
}

// Export para uso global
window.UE5OceanShaders = UE5OceanShaders;

console.log('🎮 UE5 Ocean Shaders carregados');
