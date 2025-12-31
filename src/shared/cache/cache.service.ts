import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Serviço de cache em memória simples.
 * Utiliza Map nativo do JavaScript com TTL (Time To Live).
 * 
 * IMPORTANTE: Este é um cache em memória local.
 * Para ambientes distribuídos (múltiplas instâncias), considere Redis.
 * 
 * O cache mantém os dados em memória até expiração ou reinicialização.
 * Ideal para dados que mudam pouco (configurações, lookups, etc).
 */
@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    // TTL padrão em segundos (ex: 3600 = 1 hora)
    this.defaultTTL = this.configService.get<number>('app.cacheTTL', 3600);
    
    // Limpa cache expirado a cada 5 minutos
    setInterval(() => this.clearExpired(), 300000);
  }

  /**
   * Armazena valor no cache com TTL opcional.
   * 
   * @param key - Chave única para o valor
   * @param value - Valor a ser armazenado (qualquer tipo)
   * @param ttlSeconds - TTL em segundos (opcional, usa default se omitido)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl * 1000;
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Recupera valor do cache.
   * Retorna undefined se não encontrado ou expirado.
   * 
   * @param key - Chave do valor a recuperar
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Verifica se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Remove valor específico do cache.
   * 
   * @param key - Chave do valor a remover
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Remove todos os valores do cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove todos os valores que começam com determinado prefixo.
   * Útil para invalidar grupos de cache relacionados.
   * 
   * @param prefix - Prefixo das chaves a remover
   */
  deleteByPrefix(prefix: string): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Verifica se chave existe no cache e não expirou.
   * 
   * @param key - Chave a verificar
   */
  has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * Obtém valor do cache ou executa função para gerá-lo.
   * Se valor não existir ou estiver expirado, executa a função,
   * armazena o resultado no cache e o retorna.
   * 
   * @param key - Chave do cache
   * @param fn - Função que gera o valor (pode ser async)
   * @param ttlSeconds - TTL opcional
   */
  async getOrSet<T>(
    key: string,
    fn: () => T | Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await fn();
    this.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Remove itens expirados do cache.
   * Executado automaticamente a cada 5 minutos.
   */
  private clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[CacheService] Removidos ${keysToDelete.length} itens expirados`);
    }
  }

  /**
   * Retorna estatísticas do cache.
   * Útil para monitoramento.
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      totalKeys: this.cache.size,
      activeKeys: this.cache.size - expiredCount,
      expiredKeys: expiredCount,
      defaultTTL: this.defaultTTL,
    };
  }
}
