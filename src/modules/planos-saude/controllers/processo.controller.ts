import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProcessoExecutorService } from '../services/processo/processo-executor.service';
import {
  BuscarProcessoDto,
  ExecutarProcessoDto,
  HistoricoProcessoDto,
} from '../dtos/processo';
import { ProcessoMCW } from '../interfaces';

/**
 * Controller para processos MCW (automação de fechamento)
 *
 * Endpoints:
 * - GET /processos - Buscar processos disponíveis
 * - POST /processos/executar - Executar processos
 * - GET /processos/historico - Buscar histórico de execução
 */
@Controller('planos-saude/processos')
@ApiTags('Processos MCW')
export class ProcessoController {
  constructor(
    private readonly processoExecutorService: ProcessoExecutorService,
  ) {}

  /**
   * Buscar processos MCW disponíveis
   * Replica: UnimedController.php -> case 'Buscarprocesso'
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar processos MCW',
    description:
      'Busca processos de fechamento disponíveis por categoria e tipo de dado. Replica a lógica do legacy (case Buscarprocesso).',
  })
  @ApiQuery({
    name: 'categoria',
    description: 'Categoria (UNI)',
    example: 'UNI',
  })
  @ApiQuery({ name: 'tipoDado', description: 'Tipo de dado (U)', example: 'U' })
  @ApiQuery({
    name: 'mes',
    required: false,
    description: 'Mês de referência (1-12)',
  })
  @ApiQuery({ name: 'ano', required: false, description: 'Ano de referência' })
  @ApiResponse({
    status: 200,
    description: 'Lista de processos retornada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  async buscar(
    @Query() filtros: BuscarProcessoDto,
  ): Promise<{ dados: ProcessoMCW[] }> {
    const dados = await this.processoExecutorService.buscarProcessos(filtros);
    return { dados };
  }

  /**
   * Executar processos MCW
   * Replica: UnimedController.php -> case 'Execute'
   */
  @Post('executar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Executar processos MCW',
    description:
      'Executa processos de fechamento (stored procedures Oracle). Valida prazos e permissões. Replica a lógica do legacy (case Execute).',
  })
  @ApiResponse({
    status: 200,
    description: 'Processos executados (pode conter erros parciais)',
    schema: {
      example: {
        sucesso: ['70000001', '70000002'],
        erros: [
          {
            codigo: '70000003',
            erro: 'ORA-01403: no data found',
          },
        ],
        mensagem: 'Execução concluída: 2 sucesso(s), 1 erro(s)',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou processos fora do prazo',
  })
  async executar(@Body() dados: ExecutarProcessoDto): Promise<{
    sucesso: string[];
    erros: { codigo: string; erro: string }[];
    mensagem: string;
  }> {
    // TODO: Obter usuário autenticado e verificar permissões
    const usuario = 'SYSTEM';
    const temPermissaoEspecial = false;

    const resultado = await this.processoExecutorService.executar(
      dados,
      usuario,
      temPermissaoEspecial,
    );

    return {
      ...resultado,
      mensagem: `Execução concluída: ${resultado.sucesso.length} sucesso(s), ${resultado.erros.length} erro(s)`,
    };
  }

  /**
   * Buscar histórico de execução de um processo
   * Replica: UnimedController.php -> case 'HistoricoProcesso'
   */
  @Get('historico')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar histórico de execução',
    description:
      'Busca o histórico de execuções de um processo específico. Replica a lógica do legacy (case HistoricoProcesso).',
  })
  @ApiQuery({ name: 'categoria', description: 'Categoria', example: 'UNI' })
  @ApiQuery({
    name: 'codigo',
    description: 'Código do processo',
    example: '70000001',
  })
  @ApiQuery({ name: 'mes', description: 'Mês de referência (1-12)' })
  @ApiQuery({ name: 'ano', description: 'Ano de referência' })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  async historico(
    @Query() filtros: HistoricoProcessoDto,
  ): Promise<{ dados: any[] }> {
    const dados = await this.processoExecutorService.buscarHistorico(filtros);
    return { dados };
  }
}
