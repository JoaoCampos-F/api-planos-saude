import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import {
  DadosRelatorioColaborador,
  DadosRelatorioEmpresa,
  DadosRelatorioPagamento,
  DadosRelatorioCentroCusto,
  ParametrosRelatorio,
} from '../interfaces/relatorio.interface';

/**
 * Repository para queries de relatórios
 * Mantém as mesmas queries do legado em com/lib/jasper/uni/
 */
@Injectable()
export class RelatorioRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca dados para relatório de colaboradores
   * Query baseada no template relatorioColaboradores.jrxml do legado
   */
  async buscarDadosColaborador(
    params: ParametrosRelatorio,
  ): Promise<DadosRelatorioColaborador[]> {
    this.logger.log(
      `Buscando dados de colaboradores para relatório: ${JSON.stringify(params)}`,
    );

    const query = `
      SELECT 
        c.nome,
        c.cpf,
        c.contrato,
        e.sigla as empresa,
        c.categoria,
        c.valor_titular,
        c.valor_dependente,
        c.qtd_dependentes,
        (c.valor_titular + (c.valor_dependente * c.qtd_dependentes)) as valor_total,
        c.mes_ref,
        c.ano_ref
      FROM gc.vw_uni_resumo_colaborador c
      INNER JOIN gc.empresa e ON c.cod_empresa = e.codigo
      WHERE c.mes_ref = :mes
        AND c.ano_ref = :ano
        AND (:contrato IS NULL OR c.contrato = :contrato)
        AND (:codEmpresa IS NULL OR c.cod_empresa = :codEmpresa)
      ORDER BY e.sigla, c.nome
    `;

    const result = await this.oracleService.query<DadosRelatorioColaborador>(
      query,
      {
        mes: params.mes,
        ano: params.ano,
        contrato: params.contrato || null,
        codEmpresa: params.codEmpresa || null,
      },
    );

    this.logger.log(
      `Encontrados ${result.length} colaboradores para o relatório`,
    );
    return result;
  }

  /**
   * Busca dados para relatório de empresa/contrato
   * Query agregada por empresa e contrato
   */
  async buscarDadosEmpresa(
    params: ParametrosRelatorio,
  ): Promise<DadosRelatorioEmpresa[]> {
    this.logger.log(
      `Buscando dados de empresa para relatório: ${JSON.stringify(params)}`,
    );

    const query = `
      SELECT 
        e.sigla as empresa,
        c.contrato,
        COUNT(DISTINCT c.cpf) as qtd_colaboradores,
        SUM(c.qtd_dependentes) as qtd_dependentes,
        SUM(c.valor_titular) as valor_total_titular,
        SUM(c.valor_dependente * c.qtd_dependentes) as valor_total_dependente,
        SUM(c.valor_titular + (c.valor_dependente * c.qtd_dependentes)) as valor_total,
        c.mes_ref,
        c.ano_ref
      FROM gc.vw_uni_resumo_colaborador c
      INNER JOIN gc.empresa e ON c.cod_empresa = e.codigo
      WHERE c.mes_ref = :mes
        AND c.ano_ref = :ano
        AND (:contrato IS NULL OR c.contrato = :contrato)
        AND (:codEmpresa IS NULL OR c.cod_empresa = :codEmpresa)
      GROUP BY e.sigla, c.contrato, c.mes_ref, c.ano_ref
      ORDER BY e.sigla, c.contrato
    `;

    const result = await this.oracleService.query<DadosRelatorioEmpresa>(
      query,
      {
        mes: params.mes,
        ano: params.ano,
        contrato: params.contrato || null,
        codEmpresa: params.codEmpresa || null,
      },
    );

    this.logger.log(
      `Encontradas ${result.length} linhas de empresa para o relatório`,
    );
    return result;
  }

  /**
   * Busca dados para relatório de pagamentos
   * Mostra colaboradores com valores a serem exportados
   */
  async buscarDadosPagamento(
    params: ParametrosRelatorio,
  ): Promise<DadosRelatorioPagamento[]> {
    this.logger.log(
      `Buscando dados de pagamento para relatório: ${JSON.stringify(params)}`,
    );

    const query = `
      SELECT 
        c.nome,
        c.cpf,
        e.sigla as empresa,
        c.contrato,
        (c.valor_titular + (c.valor_dependente * c.qtd_dependentes)) as valor_total,
        c.exporta as exportado,
        c.mes_ref,
        c.ano_ref
      FROM gc.uni_resumo_colaborador c
      INNER JOIN gc.empresa e ON c.cod_empresa = e.codigo
      WHERE c.mes_ref = :mes
        AND c.ano_ref = :ano
        AND c.exporta = 'S'
        AND (:contrato IS NULL OR c.contrato = :contrato)
        AND (:codEmpresa IS NULL OR c.cod_empresa = :codEmpresa)
      ORDER BY e.sigla, c.nome
    `;

    const result = await this.oracleService.query<DadosRelatorioPagamento>(
      query,
      {
        mes: params.mes,
        ano: params.ano,
        contrato: params.contrato || null,
        codEmpresa: params.codEmpresa || null,
      },
    );

    this.logger.log(`Encontrados ${result.length} pagamentos para o relatório`);
    return result;
  }

  /**
   * Busca dados para relatório de centro de custo
   * Agrupamento por departamento
   */
  async buscarDadosCentroCusto(
    params: ParametrosRelatorio,
  ): Promise<DadosRelatorioCentroCusto[]> {
    this.logger.log(
      `Buscando dados de centro de custo para relatório: ${JSON.stringify(params)}`,
    );

    const query = `
      SELECT 
        c.centro_custo,
        cc.descricao,
        e.sigla as empresa,
        COUNT(DISTINCT c.cpf) as qtd_colaboradores,
        SUM(c.valor_titular + (c.valor_dependente * c.qtd_dependentes)) as valor_total,
        c.mes_ref,
        c.ano_ref
      FROM gc.vw_uni_resumo_colaborador c
      INNER JOIN gc.empresa e ON c.cod_empresa = e.codigo
      LEFT JOIN nbs.centro_custo cc ON c.centro_custo = cc.codigo
      WHERE c.mes_ref = :mes
        AND c.ano_ref = :ano
        AND (:contrato IS NULL OR c.contrato = :contrato)
        AND (:codEmpresa IS NULL OR c.cod_empresa = :codEmpresa)
      GROUP BY c.centro_custo, cc.descricao, e.sigla, c.mes_ref, c.ano_ref
      ORDER BY e.sigla, c.centro_custo
    `;

    const result = await this.oracleService.query<DadosRelatorioCentroCusto>(
      query,
      {
        mes: params.mes,
        ano: params.ano,
        contrato: params.contrato || null,
        codEmpresa: params.codEmpresa || null,
      },
    );

    this.logger.log(
      `Encontrados ${result.length} centros de custo para o relatório`,
    );
    return result;
  }

  /**
   * Busca informações da empresa para cabeçalho do relatório
   */
  async buscarInformacoesEmpresa(sigla: string): Promise<any> {
    this.logger.log(`Buscando informações da empresa: ${sigla}`);

    const query = `
      SELECT 
        e.codigo as cod_empresa,
        e.sigla,
        e.nome_fantasia,
        e.razao_social,
        e.cnpj,
        e.cod_coligada,
        e.cod_filial,
        e.cod_bandeira
      FROM gc.empresa e
      WHERE e.sigla = :sigla
    `;

    const result = await this.oracleService.queryOne(query, { sigla });

    if (!result) {
      throw new Error(`Empresa não encontrada: ${sigla}`);
    }

    return result;
  }
}
