import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Controller raiz da aplicação.
 * Endpoints básicos de informação e saúde do sistema.
 */
@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Informações básicas da API',
    description: 'Retorna nome, versão e status da API',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'API Planos de Saúde' },
        versao: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'online' },
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a aplicação está respondendo corretamente',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação está saudável',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-03-15T14:30:00.000Z' },
        uptime: { type: 'number', example: 3600.5 },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
