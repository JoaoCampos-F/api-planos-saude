import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Controller de importação de dados das operadoras.
 * Será implementado nas próximas fases.
 */
@ApiTags('Importação')
@Controller('importacao')
export class ImportacaoController {
  @Get()
  placeholder() {
    return { mensagem: 'Módulo de importação - em desenvolvimento' };
  }
}
