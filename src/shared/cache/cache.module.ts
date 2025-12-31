import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Módulo global de cache.
 * Disponibiliza o CacheService para toda a aplicação.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
