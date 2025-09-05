/**
 * 🚀 URL REPLACER SILICON VALLEY - SOLUÇÃO DEFINITIVA
 * Sistema inteligente para substituir TODAS as URLs localhost automaticamente
 */

import { logger } from '@/lib/logger';
import { ENV } from '@/config/environment';

export class URLReplacerSiliconValley {
  private static readonly LOCALHOST_PATTERNS = [
    { pattern: /http:\/\/e1a322f9.bgapp-arcasadeveloping.pages.dev/g, replacement: () => 'https://bgapp-admin.pages.dev' },
    { pattern: /http:\/\/bgapp-api-worker.majearcasa.workers.dev/g, replacement: () => ENV.apiUrl },
    { pattern: /http:\/\/localhost:5080/g, replacement: () => ENV.isDevelopment ? 'http://localhost:5080' : 'https://bgapp-admin-api.majearcasa.workers.dev' },
    { pattern: /http:\/\/localhost:8082/g, replacement: () => ENV.externalServices.stacBrowser },
    { pattern: /http:\/\/localhost:5555/g, replacement: () => ENV.externalServices.flowerMonitor },
    { pattern: /http:\/\/localhost:9001/g, replacement: () => ENV.externalServices.minioConsole },
    { pattern: /http:\/\/localhost:8083/g, replacement: () => ENV.isDevelopment ? 'http://localhost:8083' : 'https://bgapp-auth.majearcasa.workers.dev' },
    { pattern: /e1a322f9.bgapp-arcasadeveloping.pages.dev/g, replacement: () => 'bgapp-admin.pages.dev' },
    { pattern: /bgapp-api-worker.majearcasa.workers.dev/g, replacement: () => ENV.apiUrl.replace('https://', '').replace('http://', '') },
    // 🐟 FISHERIES ENDPOINTS - Redirecionar para Admin API Worker
    { pattern: /localhost:5080\/collections\/fishing_ports\/items/g, replacement: () => ENV.isDevelopment ? 'localhost:5080/collections/fishing_ports/items' : 'bgapp-admin-api.majearcasa.workers.dev/collections/fishing_ports/items' },
    { pattern: /localhost:5080\/collections\/fishing_villages\/items/g, replacement: () => ENV.isDevelopment ? 'localhost:5080/collections/fishing_villages/items' : 'bgapp-admin-api.majearcasa.workers.dev/collections/fishing_villages/items' },
    { pattern: /localhost:5080\/collections\/fishing_infrastructure\/items/g, replacement: () => ENV.isDevelopment ? 'localhost:5080/collections/fishing_infrastructure/items' : 'bgapp-admin-api.majearcasa.workers.dev/collections/fishing_infrastructure/items' },
  ];

  /**
   * 🎯 Substituir URL única
   */
  static replaceUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }

    let replacedUrl = url;
    
    for (const { pattern, replacement } of this.LOCALHOST_PATTERNS) {
      replacedUrl = replacedUrl.replace(pattern, replacement());
    }

    return replacedUrl;
  }

  /**
   * 🔄 Substituir URLs em objeto
   */
  static replaceUrlsInObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceUrlsInObject(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replaceUrl(value);
      } else if (typeof value === 'object') {
        result[key] = this.replaceUrlsInObject(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 🌐 Abrir URL com substituição automática
   */
  static openUrl(url: string, target: string = '_blank'): void {
    const correctedUrl = this.replaceUrl(url);
    
    if (typeof window !== 'undefined') {
      logger.info(`🌐 Opening URL: ${url} → ${correctedUrl}`);
      window.open(correctedUrl, target);
    }
  }

  /**
   * 🔧 Interceptar todas as chamadas window.open
   */
  static interceptWindowOpen(): void {
    if (typeof window === 'undefined') return;

    const originalOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string) {
      if (url && typeof url === 'string') {
        const correctedUrl = URLReplacerSiliconValley.replaceUrl(url);
        logger.info(`🔄 Intercepted window.open: ${url} → ${correctedUrl}`);
        return originalOpen.call(window, correctedUrl, target, features);
      }
      return originalOpen.call(window, url, target, features);
    };
  }

  /**
   * 📊 Estatísticas de substituições
   */
  static getReplacementStats(text: string): { total: number, patterns: Record<string, number> } {
    const stats = { total: 0, patterns: {} as Record<string, number> };
    
    for (const { pattern } of this.LOCALHOST_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        const count = matches.length;
        stats.total += count;
        stats.patterns[pattern.source] = count;
      }
    }

    return stats;
  }
}

// 🚀 Auto-inicialização Silicon Valley
if (typeof window !== 'undefined') {
  // Interceptar window.open automaticamente
  URLReplacerSiliconValley.interceptWindowOpen();
  
  logger.info('🚀 URL Replacer Silicon Valley ativo!');
  logger.info(`🌐 Ambiente: ${ENV.isProduction ? 'Produção (Cloudflare)' : 'Desenvolvimento (Local)'}`);
}
