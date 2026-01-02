import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '@/shared/database/database.module';
import { LoggerModule } from '@/shared/logger/logger.module';
import { CacheModule } from '@/shared/cache/cache.module';

// Controllers
import { ImportacaoController } from './controllers/importacao.controller';
import { ColaboradorController } from './controllers/colaborador.controller';
import { ProcessoController } from './controllers/processo.controller';
import { RelatorioController } from './controllers/relatorio.controller';
import { EmpresaController } from './controllers/empresa.controller';

// Services
import { UnimedApiService } from './services/integracao/unimed-api.service';
import { UnimedImportacaoService } from './services/importacao/unimed-importacao.service';
import { HapVidaImportacaoService } from './services/importacao/hapvida-importacao.service';
import { ColaboradorService } from './services/colaborador/colaborador.service';
import { ProcessoExecutorService } from './services/processo/processo-executor.service';
import { ProcessoValidadorService } from './services/processo/processo-validador.service';
import { RelatorioService } from './services/relatorio/relatorio.service';
import { RelatorioGeneratorService } from './services/relatorio/relatorio-generator.service';
import { EmpresaService } from './services/empresa/empresa.service';

// Repositories
import { UnimedRepository } from './repositories/unimed.repository';
import { HapVidaRepository } from './repositories/hapvida.repository';
import { ColaboradorRepository } from './repositories/colaborador.repository';
import { ProcessoRepository } from './repositories/processo.repository';
import { RelatorioRepository } from './repositories/relatorio.repository';
import { EmpresaRepository } from './repositories/empresa.repository';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    DatabaseModule,
    LoggerModule,
    CacheModule,
  ],
  controllers: [
    ImportacaoController,
    ColaboradorController,
    ProcessoController,
    RelatorioController,
    EmpresaController,
  ],
  providers: [
    // Services - Integração
    UnimedApiService,

    // Services - Importação
    UnimedImportacaoService,
    HapVidaImportacaoService,

    // Services - Colaborador
    ColaboradorService,

    // Services - Processo
    ProcessoExecutorService,
    ProcessoValidadorService,

    // Services - Relatório
    RelatorioService,
    RelatorioGeneratorService,

    // Services - Empresa
    EmpresaService,

    // Repositories
    UnimedRepository,
    HapVidaRepository,
    ColaboradorRepository,
    ProcessoRepository,
    RelatorioRepository,
    EmpresaRepository,
  ],
  exports: [
    UnimedApiService,
    UnimedImportacaoService,
    HapVidaImportacaoService,
    ColaboradorService,
    ProcessoExecutorService,
    RelatorioService,
    EmpresaService,
  ],
})
export class PlanosSaudeModule {}
