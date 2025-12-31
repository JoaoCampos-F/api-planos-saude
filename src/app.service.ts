import { Injectable } from '@nestjs/common';

/**
 * Service raiz da aplicação.
 * Fornece informações básicas do sistema.
 */
@Injectable()
export class AppService {
  private readonly startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Retorna informações básicas da API.
   */
  getInfo() {
    return {
      nome: 'API Planos de Saúde',
      versao: '1.0.0',
      status: 'online',
      descricao: 'API para gerenciamento de planos de saúde (Unimed e HapVida)',
    };
  }

  /**
   * Retorna status de saúde da aplicação.
   * Indica que a aplicação está respondendo corretamente.
   */
  getHealth() {
    const uptime = (Date.now() - this.startTime) / 1000; // em segundos
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime * 100) / 100, // 2 casas decimais
      memoria: {
        usada: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
    };
  }
}
