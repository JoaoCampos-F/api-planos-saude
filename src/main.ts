import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggerService } from './shared/logger/logger.service';

/**
 * Função de inicialização da aplicação.
 * Configura Swagger, validação global, CORS, prefixo de rotas, etc.
 */
async function bootstrap() {
  // Cria instância da aplicação
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Obtém ConfigService e LoggerService
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');

  // Configura filtro global de exceções
  app.useGlobalFilters(new AllExceptionsFilter(loggerService));

  // Configura interceptor global de transformação de respostas
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Configura prefixo global das rotas (ex: /api/v1/...)
  app.setGlobalPrefix(apiPrefix);

  // Configura versionamento da API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configura CORS para aceitar requisições do frontend
  app.enableCors({
    origin: true, // Em produção, especificar domínios permitidos
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Configura validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Retorna erro se propriedades extras forem enviadas
      transform: true, // Transforma payloads para tipos esperados
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente (string → number)
      },
    }),
  );

  // Configura documentação Swagger
  const config = new DocumentBuilder()
    .setTitle('API Planos de Saúde')
    .setDescription(
      'API para gerenciamento de planos de saúde (Unimed e HapVida).\n\n' +
        'Funcionalidades:\n' +
        '- Importação de dados das operadoras (REST API e CSV)\n' +
        '- Gestão de colaboradores e dependentes\n' +
        '- Execução de processos de fechamento e exportação\n' +
        '- Geração de relatórios gerenciais\n\n' +
        'Esta API mantém a mesma lógica de negócio do sistema legado,\n' +
        'modernizando apenas a tecnologia (NestJS + TypeScript + Oracle).',
    )
    .setVersion('1.0')
    .addTag('Importação', 'Endpoints para importar dados das operadoras')
    .addTag('Colaboradores', 'Endpoints para gerenciar colaboradores')
    .addTag('Processos', 'Endpoints para executar processos automatizados')
    .addTag('Relatórios', 'Endpoints para gerar relatórios')
    .addTag('Sistema', 'Endpoints de informações do sistema')
    .addBearerAuth() // Para autenticação futura
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Inicia servidor
  await app.listen(port);

  console.log('========================================');
  console.log(`🚀 Aplicação iniciada em: http://localhost:${port}`);
  console.log(
    `📚 Documentação Swagger: http://localhost:${port}/${apiPrefix}/docs`,
  );
  console.log(`🔗 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  console.log('========================================');
}

bootstrap();
