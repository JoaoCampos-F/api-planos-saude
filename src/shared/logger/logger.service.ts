import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Serviço customizado de logging.
 * Centraliza logs da aplicação com níveis e formatação consistentes.
 * 
 * Em produção, pode ser estendido para integrar com ferramentas
 * como Winston, Pino, ou enviar para serviços externos (Datadog, New Relic).
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly appName: string;
  private readonly logLevel: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get<string>('app.name', 'API-Planos-Saude');
    this.logLevel = this.configService.get<string>('app.logLevel', 'info');
  }

  /**
   * Registra log de nível INFO.
   * Usado para informações gerais de execução.
   */
  log(message: string, context?: string): void {
    if (this.shouldLog('info')) {
      this.print('INFO', message, context);
    }
  }

  /**
   * Registra log de nível ERROR.
   * Usado para erros que precisam atenção.
   */
  error(message: string, trace?: string, context?: string): void {
    if (this.shouldLog('error')) {
      this.print('ERROR', message, context, trace);
    }
  }

  /**
   * Registra log de nível WARN.
   * Usado para situações anormais que não são erros críticos.
   */
  warn(message: string, context?: string): void {
    if (this.shouldLog('warn')) {
      this.print('WARN', message, context);
    }
  }

  /**
   * Registra log de nível DEBUG.
   * Usado para informações detalhadas de depuração.
   */
  debug(message: string, context?: string): void {
    if (this.shouldLog('debug')) {
      this.print('DEBUG', message, context);
    }
  }

  /**
   * Registra log de nível VERBOSE.
   * Usado para informações muito detalhadas.
   */
  verbose(message: string, context?: string): void {
    if (this.shouldLog('verbose')) {
      this.print('VERBOSE', message, context);
    }
  }

  /**
   * Verifica se deve registrar log baseado no nível configurado.
   */
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex <= currentLevelIndex;
  }

  /**
   * Imprime log formatado no console.
   */
  private print(
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const formattedMessage = `${timestamp} [${this.appName}] ${level} ${contextStr} ${message}`;

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        if (trace) {
          console.error(trace);
        }
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'DEBUG':
      case 'VERBOSE':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * Registra log de operação de banco de dados.
   * Útil para rastreamento de queries executadas.
   */
  logDatabase(operation: string, sql: string, params?: any): void {
    if (this.shouldLog('debug')) {
      const sanitizedSql = sql.replace(/\s+/g, ' ').trim();
      this.debug(
        `DB ${operation}: ${sanitizedSql.substring(0, 100)}${sanitizedSql.length > 100 ? '...' : ''}`,
        'DatabaseLog',
      );
      if (params && Object.keys(params).length > 0) {
        this.debug(`Params: ${JSON.stringify(params)}`, 'DatabaseLog');
      }
    }
  }

  /**
   * Registra log de requisição HTTP externa.
   * Útil para rastreamento de chamadas a APIs externas.
   */
  logHttpRequest(method: string, url: string, status?: number, duration?: number): void {
    const message = `HTTP ${method} ${url}${status ? ` - ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    if (status && status >= 400) {
      this.warn(message, 'HttpClient');
    } else {
      this.log(message, 'HttpClient');
    }
  }
}
