import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EmpresaService } from '../services/empresa/empresa.service';
import { FiltroEmpresaDto, FiltroContratoDto } from '../dtos/empresa';
import { LoggerService } from '@/shared/logger/logger.service';

/**
 * Controller para endpoints auxiliares de empresas e contratos
 * Fornece listas para uso em outros módulos e frontend
 */
@ApiTags('Utilitários')
@Controller('planos-saude/utilidades')
export class EmpresaController {
  constructor(
    private readonly empresaService: EmpresaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * GET /utilidades/empresas
   * Lista todas as empresas disponíveis
   */
  @Get('empresas')
  @ApiOperation({
    summary: 'Lista empresas disponíveis',
    description:
      'Retorna lista de empresas cadastradas, com filtros opcionais por sigla e status ativo',
  })
  @ApiQuery({
    name: 'sigla',
    type: String,
    required: false,
    description: 'Filtrar por sigla da empresa',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'ativo',
    type: String,
    required: false,
    description: 'Filtrar por status (S/N)',
    example: 'S',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        sucesso: { type: 'boolean', example: true },
        dados: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              codigo: { type: 'number', example: 1 },
              sigla: { type: 'string', example: 'GSV' },
              nome_fantasia: {
                type: 'string',
                example: 'Grupo São Vicente',
              },
              razao_social: {
                type: 'string',
                example: 'Grupo São Vicente Ltda',
              },
              cnpj: { type: 'string', example: '12.345.678/0001-90' },
              ativo: { type: 'string', example: 'S' },
            },
          },
        },
      },
    },
  })
  async listarEmpresas(@Query() filtro: FiltroEmpresaDto) {
    this.logger.log(`Listando empresas: ${JSON.stringify(filtro)}`);
    const empresas = await this.empresaService.listarEmpresas(
      filtro.sigla,
      filtro.ativo,
    );
    return { dados: empresas };
  }

  /**
   * GET /utilidades/empresas/:sigla
   * Busca detalhes de uma empresa específica com estatísticas
   */
  @Get('empresas/:sigla')
  @ApiOperation({
    summary: 'Busca detalhes de uma empresa',
    description:
      'Retorna informações detalhadas da empresa incluindo total de contratos e colaboradores',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da empresa retornados com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa não encontrada',
  })
  async buscarEmpresa(@Param('sigla') sigla: string) {
    this.logger.log(`Buscando empresa: ${sigla}`);
    const empresa = await this.empresaService.buscarEmpresaComResumo(sigla);
    return { dados: empresa };
  }

  /**
   * GET /utilidades/contratos
   * Lista todos os contratos com filtros opcionais
   */
  @Get('contratos')
  @ApiOperation({
    summary: 'Lista contratos disponíveis',
    description:
      'Retorna lista de contratos, com filtros opcionais por empresa e código do contrato',
  })
  @ApiQuery({
    name: 'empresa',
    type: String,
    required: false,
    description: 'Filtrar por sigla da empresa',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'contrato',
    type: String,
    required: false,
    description: 'Filtrar por código do contrato',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contratos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        sucesso: { type: 'boolean', example: true },
        dados: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              codigo: { type: 'string', example: '12345' },
              descricao: { type: 'string', example: '12345' },
              empresa_sigla: { type: 'string', example: 'GSV' },
              empresa_codigo: { type: 'number', example: 1 },
              ativo: { type: 'string', example: 'S' },
            },
          },
        },
      },
    },
  })
  async listarContratos(@Query() filtro: FiltroContratoDto) {
    this.logger.log(`Listando contratos: ${JSON.stringify(filtro)}`);
    const contratos = await this.empresaService.listarContratos(
      filtro.empresa,
      filtro.contrato,
    );
    return { dados: contratos };
  }

  /**
   * GET /utilidades/empresas/:sigla/contratos
   * Lista contratos de uma empresa específica
   */
  @Get('empresas/:sigla/contratos')
  @ApiOperation({
    summary: 'Lista contratos de uma empresa',
    description:
      'Retorna todos os contratos vinculados a uma empresa específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contratos da empresa retornada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa não encontrada',
  })
  async listarContratosPorEmpresa(@Param('sigla') sigla: string) {
    this.logger.log(`Listando contratos da empresa: ${sigla}`);
    const contratos =
      await this.empresaService.listarContratosPorEmpresa(sigla);
    return { dados: contratos };
  }
}
