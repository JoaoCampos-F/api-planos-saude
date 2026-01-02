import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { UnimedDadosCobrancaApi } from '../interfaces';

/**
 * Repository para dados da Unimed
 *
 * FILOSOFIA: Repository Pattern simplificado - apenas wrapper de queries Oracle.
 * Toda lógica de negócio está no banco (procedures, views, triggers).
 */
@Injectable()
export class UnimedRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Inserir dados de cobrança da Unimed
   * Insere diretamente na tabela gc.uni_dados_cobranca
   */
  async inserirDadosCobranca(dados: UnimedDadosCobrancaApi): Promise<void> {
    const sql = `
      INSERT INTO gc.uni_dados_cobranca (
        contrato, cnpj, contratante, nome_plano, abrangencia,
        cod_fatura, valor_fatura, periodo,
        cod_titular, titular, cpf_titular, matricula, acomodacao,
        cod_beneficiario, beneficiario, cpf, idade, nascimento, inclusao,
        dependencia, valor_cobrado, descricao,
        mes_ref, ano_ref, cod_empresa, cod_coligada, cod_filial,
        cod_band, exporta, data_import
      ) VALUES (
        :contrato, :cnpj, :contratante, :nomePlano, :abrangencia,
        :codFatura, :valorFatura, :periodo,
        :codTitular, :titular, :cpfTitular, :matricula, :acomodacao,
        :codBeneficiario, :beneficiario, :cpf, :idade, :nascimento, :inclusao,
        :dependencia, :valorCobrado, :descricao,
        :mesRef, :anoRef, :codEmpresa, :codColigada, :codFilial,
        :codBand, :exporta, SYSDATE
      )
    `;

    await this.oracleService.execute(sql, dados);
  }

  /**
   * Inserir múltiplos registros em lote (mais eficiente)
   */
  async inserirDadosCobrancaLote(
    dadosLista: UnimedDadosCobrancaApi[],
  ): Promise<number> {
    this.logger.log(
      `Inserindo ${dadosLista.length} registros em lote`,
      'UnimedRepository',
    );

    let sucessos = 0;

    // Inserir registros um por um
    for (const dados of dadosLista) {
      try {
        await this.inserirDadosCobranca(dados);
        sucessos++;
      } catch (error) {
        this.logger.warn(
          `Erro ao inserir registro CPF ${dados.cpf}: ${error.message}`,
          'UnimedRepository',
        );
      }
    }

    this.logger.log(
      `${sucessos}/${dadosLista.length} registros inseridos com sucesso`,
      'UnimedRepository',
    );

    return sucessos;
  }

  /**
   * Deletar dados de um período específico
   * Usado antes de importar para evitar duplicatas
   */
  async deletarDadosPorPeriodo(
    mesRef: number,
    anoRef: number,
    codEmpresa: number,
  ): Promise<number> {
    this.logger.log(
      `Deletando dados existentes - Empresa: ${codEmpresa}, Período: ${mesRef}/${anoRef}`,
      'UnimedRepository',
    );

    const sql = `
      DELETE FROM gc.uni_dados_cobranca
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
        AND cod_empresa = :codEmpresa
    `;

    const rowsAffected = await this.oracleService.execute(sql, {
      mesRef,
      anoRef,
      codEmpresa,
    });

    this.logger.log(`${rowsAffected} registros deletados`, 'UnimedRepository');

    return rowsAffected;
  }

  /**
   * Verificar se já existem dados importados para o período
   */
  async verificarDadosExistentes(
    mesRef: number,
    anoRef: number,
    codEmpresa: number,
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as total
      FROM gc.uni_dados_cobranca
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
        AND cod_empresa = :codEmpresa
    `;

    const result = await this.oracleService.queryOne<{ total: number }>(sql, {
      mesRef,
      anoRef,
      codEmpresa,
    });

    return (result?.total || 0) > 0;
  }

  /**
   * Buscar dados de cobrança por período
   */
  async buscarDadosPorPeriodo(
    mesRef: number,
    anoRef: number,
    codEmpresa?: number,
  ): Promise<UnimedDadosCobrancaApi[]> {
    let sql = `
      SELECT 
        contrato, cnpj, contratante, nome_plano as "nomePlano",
        abrangencia, cod_fatura as "codFatura", valor_fatura as "valorFatura",
        periodo, cod_titular as "codTitular", titular, cpf_titular as "cpfTitular",
        matricula, acomodacao, cod_beneficiario as "codBeneficiario",
        beneficiario, cpf, idade, nascimento, inclusao, dependencia,
        valor_cobrado as "valorCobrado", descricao,
        mes_ref as "mesRef", ano_ref as "anoRef",
        cod_empresa as "codEmpresa", cod_coligada as "codColigada",
        cod_filial as "codFilial", cod_band as "codBand",
        exporta, data_import as "dataImport"
      FROM gc.uni_dados_cobranca
      WHERE mes_ref = :mesRef
        AND ano_ref = :anoRef
    `;

    const params: any = { mesRef, anoRef };

    if (codEmpresa) {
      sql += ' AND cod_empresa = :codEmpresa';
      params.codEmpresa = codEmpresa;
    }

    sql += ' ORDER BY titular, dependencia';

    return await this.oracleService.query<UnimedDadosCobrancaApi>(sql, params);
  }
}
