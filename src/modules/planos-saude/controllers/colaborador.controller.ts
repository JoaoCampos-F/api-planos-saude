import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ColaboradorService } from '../services/colaborador/colaborador.service';
import {
  BuscarColaboradorDto,
  AtualizarColaboradorDto,
  AtualizarTodosColaboradoresDto,
} from '../dtos/colaborador';
import { ColaboradorResumo } from '../interfaces';

/**
 * Controller para gestão de colaboradores
 *
 * Endpoints:
 * - GET /colaboradores - Buscar colaboradores com filtros
 * - PATCH /colaboradores/exportacao - Atualizar status de exportação individual
 * - PATCH /colaboradores/exportacao/lote - Atualizar status de exportação em lote
 */
@Controller('planos-saude/colaboradores')
@ApiTags('Colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  /**
   * Buscar colaboradores com filtros
   * Replica: UnimedController.php -> case 'Buscar'
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar colaboradores',
    description:
      'Busca colaboradores por empresa, contrato, CPF, mês e ano. Replica a lógica do legacy (case Buscar).',
  })
  @ApiQuery({
    name: 'empresa',
    required: false,
    description: 'Sigla da empresa',
  })
  @ApiQuery({
    name: 'contrato',
    required: false,
    description: 'Código do contrato',
  })
  @ApiQuery({ name: 'cpf', required: false, description: 'CPF do colaborador' })
  @ApiQuery({
    name: 'mes',
    required: false,
    description: 'Mês de referência (1-12)',
  })
  @ApiQuery({ name: 'ano', required: false, description: 'Ano de referência' })
  @ApiResponse({
    status: 200,
    description: 'Lista de colaboradores retornada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  async buscar(
    @Query() filtros: BuscarColaboradorDto,
  ): Promise<{ dados: ColaboradorResumo[] }> {
    const dados = await this.colaboradorService.buscar(filtros);
    return { dados };
  }

  /**
   * Atualizar status de exportação de um colaborador
   * Replica: UnimedController.php -> case 'update'
   */
  @Patch('exportacao')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar status de exportação',
    description:
      'Atualiza o status de exportação (S/N) de um colaborador específico. Replica a lógica do legacy (case update).',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de exportação atualizado com sucesso',
    schema: {
      example: {
        mensagem:
          'O valor da Unimed referente ao mês 12 foi readicionado ao colaborador',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async atualizarExportacao(
    @Body() dados: AtualizarColaboradorDto,
  ): Promise<{ mensagem: string }> {
    return this.colaboradorService.atualizarExportacao(dados);
  }

  /**
   * Atualizar status de exportação de todos colaboradores de uma empresa
   * Replica: UnimedController.php -> case 'updateTodosColaborador'
   */
  @Patch('exportacao/lote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar status de exportação em lote',
    description:
      'Atualiza o status de exportação (S/N) de todos os colaboradores de uma empresa. Replica a lógica do legacy (case updateTodosColaborador).',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de exportação atualizado em lote com sucesso',
    schema: {
      example: {
        mensagem: 'Todos os colaboradores foram atualizados com sucesso',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa não encontrada',
  })
  async atualizarExportacaoTodos(
    @Body() dados: AtualizarTodosColaboradoresDto,
  ): Promise<{ mensagem: string }> {
    return this.colaboradorService.atualizarExportacaoTodos(dados);
  }
}
