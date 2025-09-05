/**
 * Production-Grade Logger for TypeScript/React
 * Inspirado em práticas do Vercel, Cloudflare e Meta
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'success' | 'warn' | 'error' | 'critical';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  performance?: {
    duration: number;
    operation: string;
  };
}

class Logger {
  private name: string;
  private context: LogContext = {};
  private enabled: boolean;
  private level: LogLevel;
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  // Cores para console em desenvolvimento
  private colors = {
    trace: '#9CA3AF',
    debug: '#06B6D4',
    info: '#10B981',
    success: '#34D399',
    warn: '#F59E0B',
    error: '#EF4444',
    critical: '#DC2626'
  };

  // Níveis numéricos para comparação
  private levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    success: 3,
    warn: 4,
    error: 5,
    critical: 6
  };

  constructor(name: string) {
    this.name = name;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enabled = process.env.NEXT_PUBLIC_LOGGING !== 'false';
    this.level = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';
  }

  /**
   * Define contexto global para todos os logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Limpa o contexto
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.level];
  }

  /**
   * Formata a mensagem para o console
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const ctx = { ...this.context, ...context };
    
    if (this.isDevelopment) {
      // Formato colorido para desenvolvimento
      const color = this.colors[level];
      const prefix = `%c[${timestamp}] [${level.toUpperCase()}] [${this.name}]`;
      const style = `color: ${color}; font-weight: bold;`;
      
      if (Object.keys(ctx).length > 0) {
        return `${prefix} ${message} %o`;
      }
      return `${prefix} ${message}`;
    } else {
      // Formato estruturado para produção
      return JSON.stringify({
        timestamp,
        level,
        logger: this.name,
        message,
        ...ctx
      });
    }
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context }
    };

    // Adicionar ao buffer para análise posterior
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Enviar para console apropriado
    const consoleMethod = this.getConsoleMethod(level);
    const formatted = this.formatMessage(level, message, context);
    
    if (this.isDevelopment && Object.keys(entry.context || {}).length > 0) {
      consoleMethod(formatted, `color: ${this.colors[level]}; font-weight: bold;`, entry.context);
    } else if (this.isDevelopment) {
      consoleMethod(formatted, `color: ${this.colors[level]}; font-weight: bold;`);
    } else {
      consoleMethod(formatted);
    }

    // Em produção, enviar para serviço de logging
    if (!this.isDevelopment && level === 'error' || level === 'critical') {
      this.sendToLoggingService(entry);
    }
  }

  /**
   * Obtém o método correto do console
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    // Em produção, não usar console.log
    if (!this.isDevelopment) {
      return () => {}; // No-op em produção
    }

    switch (level) {
      case 'trace':
      case 'debug':
        return console.debug.bind(console);
      case 'info':
      case 'success':
        return console.info.bind(console);
      case 'warn':
        return console.warn.bind(console);
      case 'error':
      case 'critical':
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }

  /**
   * Envia logs para serviço externo (Sentry, LogRocket, etc)
   */
  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // Implementar integração com serviço de logging
    // Por exemplo: Sentry, LogRocket, Datadog, etc.
    
    // Por enquanto, armazenar no localStorage como fallback
    try {
      const logs = JSON.parse(localStorage.getItem('bgapp_logs') || '[]');
      logs.push(entry);
      // Manter apenas últimos 50 logs
      if (logs.length > 50) {
        logs.shift();
      }
      localStorage.setItem('bgapp_logs', JSON.stringify(logs));
    } catch (e) {
      // Silently fail
    }
  }

  // Métodos públicos de logging
  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  success(message: string, context?: LogContext): void {
    this.log('success', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error) {
      errorContext.error = error;
    }
    
    this.log('error', message, errorContext);
  }

  critical(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error) {
      errorContext.error = error;
    }
    
    this.log('critical', message, errorContext);
  }

  /**
   * Mede performance de uma operação
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.info(`Performance: ${operation}`, {
        operation,
        duration: Math.round(duration * 100) / 100,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.error(`Performance: ${operation} failed`, error, {
        operation,
        duration: Math.round(duration * 100) / 100,
        status: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Log de auditoria para ações importantes
   */
  audit(action: string, details: LogContext): void {
    this.info(`AUDIT: ${action}`, {
      audit: true,
      action,
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
  }

  /**
   * Obtém logs do buffer
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Limpa o buffer de logs
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Exporta logs para download
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Factory para criar loggers
class LoggerFactory {
  private static loggers: Map<string, Logger> = new Map();

  static getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, new Logger(name));
    }
    return this.loggers.get(name)!;
  }

  static setGlobalContext(context: LogContext): void {
    this.loggers.forEach(logger => {
      logger.setContext(context);
    });
  }
}

// Hook para React
export function useLogger(name: string): Logger {
  return LoggerFactory.getLogger(name);
}

// Logger padrão
export const logger = LoggerFactory.getLogger('BGAPP');

// Export factory
export { LoggerFactory, Logger };

// Tipos exportados
export type { LogLevel, LogContext, LogEntry };