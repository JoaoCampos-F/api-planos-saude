import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { CacheModule } from './shared/cache/cache.module';
import databaseConfig from './config/database.config';
import integrationsConfig from './config/integrations.config';
import appConfig from './config/app.config';

/**
 * Módulo raiz da aplicação.
 *
 * Importa módulos globais:
 * - ConfigModule: Gerenciamento de configurações via .env
 * - DatabaseModule: Conexão com Oracle Database
 * - LoggerModule: Sistema de logging centralizado
 * - CacheModule: Cache em memória
 */
@Module({
  imports: [
    // ConfigModule carrega variáveis de ambiente e configurações
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, integrationsConfig, appConfig],
      cache: true,
    }),

    // Módulos globais de infraestrutura
    DatabaseModule,
    LoggerModule,
    CacheModule,

    // Módulos de negócio serão adicionados aqui conforme desenvolvimento
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
