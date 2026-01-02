import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { RelatorioService } from '../services/relatorio/relatorio.service';
import { FiltroRelatorioDto } from '../dtos/relatorio';
import { TipoRelatorio } from '../interfaces/relatorio.interface';
import { LoggerService } from '@/shared/logger/logger.service';

/**
 * Controller para endpoints de relatórios em PDF
 * Substitui os endpoints do UnimedController.php do legado
 */
@ApiTags('Relatórios')
@Controller('planos-saude/relatorios')
export class RelatorioController {
  constructor(
    private readonly relatorioService: RelatorioService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * GET /relatorios/colaborador
   * Gera relatório detalhado de colaboradores
   * Equivalente ao caso 'RelatorioColaborador' do legado
   */
  @Get('colaborador')
  @ApiOperation({
    summary: 'Gera relatório de colaboradores em PDF',
    description:
      'Relatório detalhado com valores de titulares e dependentes por colaborador',
  })
  @ApiQuery({
    name: 'empresa',
    type: String,
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mês de referência (1-12)',
    example: 12,
  })
  @ApiQuery({
    name: 'ano',
    type: Number,
    description: 'Ano de referência',
    example: 2024,
  })
  @ApiQuery({
    name: 'contrato',
    type: String,
    required: false,
    description: 'Código do contrato (opcional)',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 404, description: 'Nenhum dado encontrado' })
  async gerarRelatorioColaborador(
    @Query() filtro: FiltroRelatorioDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        `Gerando relatório de colaboradores: ${JSON.stringify(filtro)}`,
      );

      const pdf = await this.relatorioService.gerarRelatorioColaborador({
        tipo: TipoRelatorio.COLABORADOR,
        empresa: filtro.empresa,
        mes: filtro.mes,
        ano: filtro.ano,
        contrato: filtro.contrato,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="relatorio-colaborador-${filtro.mes}-${filtro.ano}.pdf"`,
      );
      res.send(pdf);
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório de colaboradores',
        error.stack,
      );
      throw new HttpException(
        error.message || 'Erro ao gerar relatório',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /relatorios/empresa
   * Gera relatório resumido por empresa/contrato
   * Equivalente ao caso 'RelatorioEmpresaColaborador' do legado
   */
  @Get('empresa')
  @ApiOperation({
    summary: 'Gera relatório por empresa em PDF',
    description:
      'Relatório resumido agrupado por empresa e contrato com totalizadores',
  })
  @ApiQuery({
    name: 'empresa',
    type: String,
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mês de referência (1-12)',
    example: 12,
  })
  @ApiQuery({
    name: 'ano',
    type: Number,
    description: 'Ano de referência',
    example: 2024,
  })
  @ApiQuery({
    name: 'contrato',
    type: String,
    required: false,
    description: 'Código do contrato (opcional)',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 404, description: 'Nenhum dado encontrado' })
  async gerarRelatorioEmpresa(
    @Query() filtro: FiltroRelatorioDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        `Gerando relatório de empresa: ${JSON.stringify(filtro)}`,
      );

      const pdf = await this.relatorioService.gerarRelatorioEmpresa({
        tipo: TipoRelatorio.EMPRESA,
        empresa: filtro.empresa,
        mes: filtro.mes,
        ano: filtro.ano,
        contrato: filtro.contrato,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="relatorio-empresa-${filtro.mes}-${filtro.ano}.pdf"`,
      );
      res.send(pdf);
    } catch (error) {
      this.logger.error('Erro ao gerar relatório de empresa', error.stack);
      throw new HttpException(
        error.message || 'Erro ao gerar relatório',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /relatorios/pagamento
   * Gera relatório de pagamentos (colaboradores com exporta='S')
   * Equivalente ao caso 'RelatorioPagamento' do legado
   */
  @Get('pagamento')
  @ApiOperation({
    summary: 'Gera relatório de pagamentos em PDF',
    description:
      'Relatório de colaboradores marcados para exportação de pagamento',
  })
  @ApiQuery({
    name: 'empresa',
    type: String,
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mês de referência (1-12)',
    example: 12,
  })
  @ApiQuery({
    name: 'ano',
    type: Number,
    description: 'Ano de referência',
    example: 2024,
  })
  @ApiQuery({
    name: 'contrato',
    type: String,
    required: false,
    description: 'Código do contrato (opcional)',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 404, description: 'Nenhum pagamento encontrado' })
  async gerarRelatorioPagamento(
    @Query() filtro: FiltroRelatorioDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        `Gerando relatório de pagamentos: ${JSON.stringify(filtro)}`,
      );

      const pdf = await this.relatorioService.gerarRelatorioPagamento({
        tipo: TipoRelatorio.PAGAMENTO,
        empresa: filtro.empresa,
        mes: filtro.mes,
        ano: filtro.ano,
        contrato: filtro.contrato,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="relatorio-pagamento-${filtro.mes}-${filtro.ano}.pdf"`,
      );
      res.send(pdf);
    } catch (error) {
      this.logger.error('Erro ao gerar relatório de pagamentos', error.stack);
      throw new HttpException(
        error.message || 'Erro ao gerar relatório',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /relatorios/centro-custo
   * Gera relatório por centro de custo/departamento
   * Equivalente ao caso 'resumoDept' do legado
   */
  @Get('centro-custo')
  @ApiOperation({
    summary: 'Gera relatório por centro de custo em PDF',
    description: 'Relatório resumido agrupado por departamento/centro de custo',
  })
  @ApiQuery({
    name: 'empresa',
    type: String,
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    example: 'GSV',
  })
  @ApiQuery({
    name: 'mes',
    type: Number,
    description: 'Mês de referência (1-12)',
    example: 12,
  })
  @ApiQuery({
    name: 'ano',
    type: Number,
    description: 'Ano de referência',
    example: 2024,
  })
  @ApiQuery({
    name: 'contrato',
    type: String,
    required: false,
    description: 'Código do contrato (opcional)',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum centro de custo encontrado',
  })
  async gerarRelatorioCentroCusto(
    @Query() filtro: FiltroRelatorioDto,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(
        `Gerando relatório de centro de custo: ${JSON.stringify(filtro)}`,
      );

      const pdf = await this.relatorioService.gerarRelatorioCentroCusto({
        tipo: TipoRelatorio.CENTRO_CUSTO,
        empresa: filtro.empresa,
        mes: filtro.mes,
        ano: filtro.ano,
        contrato: filtro.contrato,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="relatorio-centro-custo-${filtro.mes}-${filtro.ano}.pdf"`,
      );
      res.send(pdf);
    } catch (error) {
      this.logger.error(
        'Erro ao gerar relatório de centro de custo',
        error.stack,
      );
      throw new HttpException(
        error.message || 'Erro ao gerar relatório',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
