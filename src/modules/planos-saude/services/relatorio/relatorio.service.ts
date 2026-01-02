import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { RelatorioRepository } from '../../repositories/relatorio.repository';
import { RelatorioGeneratorService } from './relatorio-generator.service';
import {
  TipoRelatorio,
  ParametrosRelatorio,
} from '../../interfaces/relatorio.interface';

/**
 * Service principal para orquestração de relatórios
 * Coordena busca de dados + geração de PDF
 */
@Injectable()
export class RelatorioService {
  constructor(
    private readonly relatorioRepository: RelatorioRepository,
    private readonly relatorioGenerator: RelatorioGeneratorService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Gera relatório de colaboradores
   */
  async gerarRelatorioColaborador(
    params: ParametrosRelatorio,
  ): Promise<Buffer> {
    this.logger.log(
      `Gerando relatório de colaboradores: ${JSON.stringify(params)}`,
    );

    // Buscar informações da empresa
    const infoEmpresa = await this.relatorioRepository.buscarInformacoesEmpresa(
      params.empresa,
    );

    // Atualizar parâmetros com códigos da empresa
    const paramsCompletos: ParametrosRelatorio = {
      ...params,
      codEmpresa: infoEmpresa.cod_empresa,
      codColigada: infoEmpresa.cod_coligada,
      codFilial: infoEmpresa.cod_filial,
      codBand: infoEmpresa.cod_bandeira,
    };

    // Buscar dados
    const dados =
      await this.relatorioRepository.buscarDadosColaborador(paramsCompletos);

    if (dados.length === 0) {
      throw new Error(
        `Nenhum dado encontrado para o período ${params.mes}/${params.ano}`,
      );
    }

    // Gerar PDF
    return this.relatorioGenerator.gerarPdf(
      TipoRelatorio.COLABORADOR,
      dados,
      infoEmpresa,
      params.mes,
      params.ano,
    );
  }

  /**
   * Gera relatório por empresa/contrato
   */
  async gerarRelatorioEmpresa(params: ParametrosRelatorio): Promise<Buffer> {
    this.logger.log(`Gerando relatório de empresa: ${JSON.stringify(params)}`);

    const infoEmpresa = await this.relatorioRepository.buscarInformacoesEmpresa(
      params.empresa,
    );

    const paramsCompletos: ParametrosRelatorio = {
      ...params,
      codEmpresa: infoEmpresa.cod_empresa,
      codColigada: infoEmpresa.cod_coligada,
      codFilial: infoEmpresa.cod_filial,
      codBand: infoEmpresa.cod_bandeira,
    };

    const dados =
      await this.relatorioRepository.buscarDadosEmpresa(paramsCompletos);

    if (dados.length === 0) {
      throw new Error(
        `Nenhum dado encontrado para o período ${params.mes}/${params.ano}`,
      );
    }

    return this.relatorioGenerator.gerarPdf(
      TipoRelatorio.EMPRESA,
      dados,
      infoEmpresa,
      params.mes,
      params.ano,
    );
  }

  /**
   * Gera relatório de pagamentos
   */
  async gerarRelatorioPagamento(params: ParametrosRelatorio): Promise<Buffer> {
    this.logger.log(
      `Gerando relatório de pagamentos: ${JSON.stringify(params)}`,
    );

    const infoEmpresa = await this.relatorioRepository.buscarInformacoesEmpresa(
      params.empresa,
    );

    const paramsCompletos: ParametrosRelatorio = {
      ...params,
      codEmpresa: infoEmpresa.cod_empresa,
      codColigada: infoEmpresa.cod_coligada,
      codFilial: infoEmpresa.cod_filial,
      codBand: infoEmpresa.cod_bandeira,
    };

    const dados =
      await this.relatorioRepository.buscarDadosPagamento(paramsCompletos);

    if (dados.length === 0) {
      throw new Error(
        `Nenhum pagamento encontrado para o período ${params.mes}/${params.ano}`,
      );
    }

    return this.relatorioGenerator.gerarPdf(
      TipoRelatorio.PAGAMENTO,
      dados,
      infoEmpresa,
      params.mes,
      params.ano,
    );
  }

  /**
   * Gera relatório por centro de custo
   */
  async gerarRelatorioCentroCusto(
    params: ParametrosRelatorio,
  ): Promise<Buffer> {
    this.logger.log(
      `Gerando relatório de centro de custo: ${JSON.stringify(params)}`,
    );

    const infoEmpresa = await this.relatorioRepository.buscarInformacoesEmpresa(
      params.empresa,
    );

    const paramsCompletos: ParametrosRelatorio = {
      ...params,
      codEmpresa: infoEmpresa.cod_empresa,
      codColigada: infoEmpresa.cod_coligada,
      codFilial: infoEmpresa.cod_filial,
      codBand: infoEmpresa.cod_bandeira,
    };

    const dados =
      await this.relatorioRepository.buscarDadosCentroCusto(paramsCompletos);

    if (dados.length === 0) {
      throw new Error(
        `Nenhum centro de custo encontrado para o período ${params.mes}/${params.ano}`,
      );
    }

    return this.relatorioGenerator.gerarPdf(
      TipoRelatorio.CENTRO_CUSTO,
      dados,
      infoEmpresa,
      params.mes,
      params.ano,
    );
  }
}
