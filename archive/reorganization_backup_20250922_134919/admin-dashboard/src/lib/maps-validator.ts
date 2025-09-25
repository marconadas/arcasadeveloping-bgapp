/**
 * Sistema de Validação de Mapas BGAPP
 * Validações avançadas para garantir qualidade e performance dos mapas
 */

import type { MapConfiguration, MapLayer, BGAPPMap } from '@/types';

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  performance: PerformanceMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  impact: 'performance' | 'usability' | 'accessibility' | 'seo';
}

export interface ValidationSuggestion {
  code: string;
  message: string;
  field?: string;
  category: 'optimization' | 'enhancement' | 'best_practice';
}

export interface PerformanceMetrics {
  estimatedLoadTime: number; // em segundos
  memoryUsage: number; // em MB
  layerComplexity: number; // 0-100
  renderingScore: number; // 0-100
}

export class MapsValidator {
  private static instance: MapsValidator;
  
  // Limites de performance
  private readonly PERFORMANCE_LIMITS = {
    maxLayers: 10,
    maxLayerSize: 50, // MB
    maxZoom: 20,
    minZoom: 1,
    maxBounds: {
      north: 90,
      south: -90,
      east: 180,
      west: -180
    }
  };

  // Padrões recomendados para Angola
  private readonly ANGOLA_STANDARDS = {
    recommendedBounds: {
      north: -4.2,
      south: -18.2,
      east: 17.5,
      west: 8.5
    },
    recommendedCenter: [-12.5, 13.5],
    recommendedZoom: 6,
    recommendedProjection: 'EPSG:4326'
  };

  public static getInstance(): MapsValidator {
    if (!MapsValidator.instance) {
      MapsValidator.instance = new MapsValidator();
    }
    return MapsValidator.instance;
  }

  /**
   * Validação completa de configuração de mapa
   */
  public validateMapConfiguration(config: MapConfiguration): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validações básicas
    this.validateBasicFields(config, errors);
    
    // Validações geográficas
    this.validateGeographicData(config, errors, warnings, suggestions);
    
    // Validações de camadas
    this.validateLayers(config.overlayLayers, errors, warnings, suggestions);
    
    // Validações de performance
    const performance = this.calculatePerformanceMetrics(config);
    this.validatePerformance(performance, warnings, suggestions);
    
    // Validações de acessibilidade
    this.validateAccessibility(config, warnings, suggestions);
    
    // Validações específicas para Angola
    this.validateAngolaStandards(config, suggestions);

    // Calcular score geral
    const score = this.calculateValidationScore(errors, warnings, suggestions);

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
      performance
    };
  }

  /**
   * Validação de mapa BGAPP completo
   */
  public validateBGAPPMap(map: BGAPPMap): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validar metadados
    this.validateMapMetadata(map, errors, warnings);
    
    // Validar URL e acessibilidade
    this.validateMapUrl(map.url, warnings, suggestions);
    
    // Validar configuração se disponível
    let performance: PerformanceMetrics = {
      estimatedLoadTime: 2.0,
      memoryUsage: 10,
      layerComplexity: 50,
      renderingScore: 80
    };

    if (map.configuration) {
      const configResult = this.validateMapConfiguration(map.configuration);
      errors.push(...configResult.errors);
      warnings.push(...configResult.warnings);
      suggestions.push(...configResult.suggestions);
      performance = configResult.performance;
    }

    const score = this.calculateValidationScore(errors, warnings, suggestions);

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
      performance
    };
  }

  /**
   * Validações básicas de campos obrigatórios
   */
  private validateBasicFields(config: MapConfiguration, errors: ValidationError[]): void {
    if (!config.name || config.name.trim().length === 0) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Nome do mapa é obrigatório',
        field: 'name',
        severity: 'critical'
      });
    }

    if (!config.category) {
      errors.push({
        code: 'MISSING_CATEGORY',
        message: 'Categoria do mapa é obrigatória',
        field: 'category',
        severity: 'critical'
      });
    }

    if (!config.metadata?.title) {
      errors.push({
        code: 'MISSING_METADATA_TITLE',
        message: 'Título nos metadados é obrigatório',
        field: 'metadata.title',
        severity: 'high'
      });
    }
  }

  /**
   * Validações geográficas
   */
  private validateGeographicData(
    config: MapConfiguration, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    // Validar centro do mapa
    if (!config.center || config.center.length !== 2) {
      errors.push({
        code: 'INVALID_CENTER',
        message: 'Centro do mapa deve ter exatamente 2 coordenadas [lat, lng]',
        field: 'center',
        severity: 'critical'
      });
    } else {
      const [lat, lng] = config.center;
      
      if (lat < -90 || lat > 90) {
        errors.push({
          code: 'INVALID_LATITUDE',
          message: 'Latitude deve estar entre -90 e 90',
          field: 'center[0]',
          severity: 'critical'
        });
      }
      
      if (lng < -180 || lng > 180) {
        errors.push({
          code: 'INVALID_LONGITUDE',
          message: 'Longitude deve estar entre -180 e 180',
          field: 'center[1]',
          severity: 'critical'
        });
      }
    }

    // Validar zoom
    if (config.zoom < this.PERFORMANCE_LIMITS.minZoom || config.zoom > this.PERFORMANCE_LIMITS.maxZoom) {
      errors.push({
        code: 'INVALID_ZOOM',
        message: `Zoom deve estar entre ${this.PERFORMANCE_LIMITS.minZoom} e ${this.PERFORMANCE_LIMITS.maxZoom}`,
        field: 'zoom',
        severity: 'high'
      });
    }

    // Validar bounds se especificados
    if (config.bounds) {
      const [[south, west], [north, east]] = config.bounds;
      
      if (south >= north || west >= east) {
        errors.push({
          code: 'INVALID_BOUNDS',
          message: 'Bounds inválidos: south deve ser menor que north, west menor que east',
          field: 'bounds',
          severity: 'high'
        });
      }
    }
  }

  /**
   * Validações de camadas
   */
  private validateLayers(
    layers: MapLayer[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    if (layers.length > this.PERFORMANCE_LIMITS.maxLayers) {
      warnings.push({
        code: 'TOO_MANY_LAYERS',
        message: `Muitas camadas (${layers.length}). Recomendado: máximo ${this.PERFORMANCE_LIMITS.maxLayers}`,
        field: 'overlayLayers',
        impact: 'performance'
      });
    }

    layers.forEach((layer, index) => {
      // Validar ID único
      if (!layer.id || layer.id.trim().length === 0) {
        errors.push({
          code: 'MISSING_LAYER_ID',
          message: `Camada ${index + 1} deve ter um ID único`,
          field: `overlayLayers[${index}].id`,
          severity: 'high'
        });
      }

      // Validar nome
      if (!layer.name || layer.name.trim().length === 0) {
        errors.push({
          code: 'MISSING_LAYER_NAME',
          message: `Camada ${index + 1} deve ter um nome`,
          field: `overlayLayers[${index}].name`,
          severity: 'medium'
        });
      }

      // Validar tipo
      const validTypes = ['geojson', 'wms', 'wmts', 'xyz', 'vector', 'raster'];
      if (!validTypes.includes(layer.type)) {
        errors.push({
          code: 'INVALID_LAYER_TYPE',
          message: `Tipo de camada inválido: ${layer.type}. Tipos válidos: ${validTypes.join(', ')}`,
          field: `overlayLayers[${index}].type`,
          severity: 'high'
        });
      }

      // Validar opacidade
      if (layer.opacity < 0 || layer.opacity > 1) {
        errors.push({
          code: 'INVALID_OPACITY',
          message: 'Opacidade deve estar entre 0 e 1',
          field: `overlayLayers[${index}].opacity`,
          severity: 'medium'
        });
      }

      // Sugestões de otimização
      if (layer.opacity > 0.9) {
        suggestions.push({
          code: 'HIGH_OPACITY',
          message: `Considere reduzir opacidade da camada "${layer.name}" para melhor visualização`,
          field: `overlayLayers[${index}].opacity`,
          category: 'optimization'
        });
      }
    });

    // Verificar IDs duplicados
    const ids = layers.map(l => l.id).filter(id => id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      errors.push({
        code: 'DUPLICATE_LAYER_IDS',
        message: `IDs de camadas duplicados: ${duplicateIds.join(', ')}`,
        field: 'overlayLayers',
        severity: 'high'
      });
    }
  }

  /**
   * Calcular métricas de performance
   */
  private calculatePerformanceMetrics(config: MapConfiguration): PerformanceMetrics {
    const layerCount = config.overlayLayers.length;
    const zoomRange = (config.maxZoom || 18) - (config.minZoom || 1);
    
    // Estimar tempo de carregamento baseado no número de camadas
    const estimatedLoadTime = Math.max(0.5, layerCount * 0.3 + (zoomRange > 15 ? 1 : 0));
    
    // Estimar uso de memória
    const memoryUsage = Math.max(5, layerCount * 2 + (config.zoom > 15 ? 10 : 0));
    
    // Calcular complexidade das camadas
    const layerComplexity = Math.min(100, (layerCount / this.PERFORMANCE_LIMITS.maxLayers) * 100);
    
    // Score de renderização
    const renderingScore = Math.max(0, 100 - layerComplexity - (zoomRange > 15 ? 20 : 0));

    return {
      estimatedLoadTime,
      memoryUsage,
      layerComplexity,
      renderingScore
    };
  }

  /**
   * Validações de performance
   */
  private validatePerformance(
    performance: PerformanceMetrics, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    if (performance.estimatedLoadTime > 5) {
      warnings.push({
        code: 'SLOW_LOAD_TIME',
        message: `Tempo de carregamento estimado alto: ${performance.estimatedLoadTime.toFixed(1)}s`,
        impact: 'performance'
      });
    }

    if (performance.memoryUsage > 50) {
      warnings.push({
        code: 'HIGH_MEMORY_USAGE',
        message: `Alto uso de memória estimado: ${performance.memoryUsage}MB`,
        impact: 'performance'
      });
    }

    if (performance.renderingScore < 60) {
      suggestions.push({
        code: 'OPTIMIZE_RENDERING',
        message: 'Considere otimizar configurações para melhor performance de renderização',
        category: 'optimization'
      });
    }
  }

  /**
   * Validações de acessibilidade
   */
  private validateAccessibility(
    config: MapConfiguration, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    if (!config.controls.zoom) {
      warnings.push({
        code: 'NO_ZOOM_CONTROL',
        message: 'Controle de zoom desabilitado pode afetar acessibilidade',
        impact: 'accessibility'
      });
    }

    if (!config.controls.fullscreen) {
      suggestions.push({
        code: 'ENABLE_FULLSCREEN',
        message: 'Considere habilitar controle de tela cheia para melhor experiência',
        category: 'enhancement'
      });
    }

    if (!config.metadata?.abstract) {
      suggestions.push({
        code: 'ADD_DESCRIPTION',
        message: 'Adicione uma descrição detalhada nos metadados para melhor acessibilidade',
        category: 'best_practice'
      });
    }
  }

  /**
   * Validações específicas para padrões de Angola
   */
  private validateAngolaStandards(
    config: MapConfiguration, 
    suggestions: ValidationSuggestion[]
  ): void {
    // Verificar se o centro está dentro dos bounds de Angola
    if (config.center) {
      const [lat, lng] = config.center;
      const bounds = this.ANGOLA_STANDARDS.recommendedBounds;
      
      if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) {
        suggestions.push({
          code: 'CENTER_OUTSIDE_ANGOLA',
          message: 'Centro do mapa está fora dos limites de Angola. Considere ajustar para melhor contexto',
          field: 'center',
          category: 'best_practice'
        });
      }
    }

    // Sugerir zoom apropriado para Angola
    if (config.zoom < 4 || config.zoom > 10) {
      suggestions.push({
        code: 'ADJUST_ZOOM_FOR_ANGOLA',
        message: `Zoom ${config.zoom} pode não ser ideal para Angola. Recomendado: 6-8`,
        field: 'zoom',
        category: 'best_practice'
      });
    }
  }

  /**
   * Validar metadados do mapa
   */
  private validateMapMetadata(
    map: BGAPPMap, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (!map.description || map.description.trim().length < 10) {
      warnings.push({
        code: 'SHORT_DESCRIPTION',
        message: 'Descrição muito curta. Recomendado: pelo menos 10 caracteres',
        field: 'description',
        impact: 'usability'
      });
    }

    if (!map.features || map.features.length === 0) {
      warnings.push({
        code: 'NO_FEATURES_LISTED',
        message: 'Nenhuma funcionalidade listada. Considere documentar as funcionalidades do mapa',
        field: 'features',
        impact: 'usability'
      });
    }
  }

  /**
   * Validar URL do mapa
   */
  private validateMapUrl(
    url: string, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
        warnings.push({
          code: 'INSECURE_URL',
          message: 'URL não utiliza HTTPS. Recomendado para produção',
          field: 'url',
          impact: 'seo'
        });
      }
    } catch (error) {
      warnings.push({
        code: 'INVALID_URL',
        message: 'URL inválida ou malformada',
        field: 'url',
        impact: 'usability'
      });
    }
  }

  /**
   * Calcular score de validação
   */
  private calculateValidationScore(
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): number {
    let score = 100;
    
    // Penalizar por erros
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Penalizar por avisos
    warnings.forEach(() => {
      score -= 3;
    });

    // Penalizar levemente por sugestões não implementadas
    suggestions.forEach(() => {
      score -= 1;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Gerar relatório de validação em texto
   */
  public generateValidationReport(result: ValidationResult): string {
    let report = `# Relatório de Validação de Mapa\n\n`;
    report += `**Score Geral:** ${result.score}/100\n`;
    report += `**Status:** ${result.valid ? '✅ Válido' : '❌ Inválido'}\n\n`;

    if (result.errors.length > 0) {
      report += `## ❌ Erros (${result.errors.length})\n\n`;
      result.errors.forEach((error, index) => {
        report += `${index + 1}. **${error.code}** (${error.severity})\n`;
        report += `   ${error.message}\n`;
        if (error.field) report += `   Campo: ${error.field}\n`;
        report += `\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += `## ⚠️ Avisos (${result.warnings.length})\n\n`;
      result.warnings.forEach((warning, index) => {
        report += `${index + 1}. **${warning.code}** (${warning.impact})\n`;
        report += `   ${warning.message}\n`;
        if (warning.field) report += `   Campo: ${warning.field}\n`;
        report += `\n`;
      });
    }

    if (result.suggestions.length > 0) {
      report += `## 💡 Sugestões (${result.suggestions.length})\n\n`;
      result.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. **${suggestion.code}** (${suggestion.category})\n`;
        report += `   ${suggestion.message}\n`;
        if (suggestion.field) report += `   Campo: ${suggestion.field}\n`;
        report += `\n`;
      });
    }

    report += `## 📊 Métricas de Performance\n\n`;
    report += `- **Tempo de Carregamento:** ${result.performance.estimatedLoadTime.toFixed(1)}s\n`;
    report += `- **Uso de Memória:** ${result.performance.memoryUsage}MB\n`;
    report += `- **Complexidade das Camadas:** ${result.performance.layerComplexity}/100\n`;
    report += `- **Score de Renderização:** ${result.performance.renderingScore}/100\n`;

    return report;
  }
}

// Instância singleton
export const mapsValidator = MapsValidator.getInstance();
