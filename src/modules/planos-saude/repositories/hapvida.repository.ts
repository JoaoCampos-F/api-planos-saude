import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { HapVidaImportData } from '../interfaces';

/**
 * Repository para dados da HapVida
 *
 * FILOSOFIA: Repository Pattern simplificado - apenas wrapper de queries Oracle.
 * Toda lógica de negócio está no banco (procedures, views, triggers).
 */
@Injectable()
export class HapVidaRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Inserir dados de plano HapVida
   * Insere diretamente na tabela nbs.hapvida_plano
   */
  async inserirPlano(dados: HapVidaImportData): Promise<void> {
    const sql = `
      INSERT INTO nbs.hapvida_plano (
        empresa, unidade, nome_empresa, credencial, matricula, cpf,
        beneficiario, data_nascimento, data_inclusao, idade,
        plano, ac, mensalidade, adicional, desconto, valor_cobrado,
        hap_ano, hap_mes
      ) VALUES (
        :empresa, :unidade, :nomeEmpresa, :credencial, :matricula, :cpf,
        :beneficiario, :dataNascimento, :dataInclusao, :idade,
        :plano, :ac, :mensalidade, :adicional, :desconto, :valorCobrado,
        :hapAno, :hapMes
      )
    `;

    await this.oracleService.execute(sql, dados);
  }

  /**
   * Inserir múltiplos registros em lote
   */
  async inserirPlanosLote(dadosLista: HapVidaImportData[]): Promise<number> {
    this.logger.log(
      `Inserindo ${dadosLista.length} registros HapVida em lote`,
      'HapVidaRepository',
    );

    let sucessos = 0;

    // Inserir registros um por um
    for (const dados of dadosLista) {
      try {
        await this.inserirPlano(dados);
        sucessos++;
      } catch (error) {
        this.logger.warn(
          `Erro ao inserir registro CPF ${dados.cpf}: ${error.message}`,
          'HapVidaRepository',
        );
      }
    }

    this.logger.log(
      `${sucessos}/${dadosLista.length} registros HapVida inseridos com sucesso`,
      'HapVidaRepository',
    );

    return sucessos;
  }

  /**
   * Deletar dados de um período específico
   */
  async deletarDadosPorPeriodo(
    mesRef: number,
    anoRef: number,
  ): Promise<number> {
    this.logger.log(
      `Deletando dados HapVida existentes - Período: ${mesRef}/${anoRef}`,
      'HapVidaRepository',
    );

    const sql = `
      DELETE FROM nbs.hapvida_plano
      WHERE hap_mes = :mesRef
        AND hap_ano = :anoRef
    `;

    const rowsAffected = await this.oracleService.execute(sql, {
      mesRef,
      anoRef,
    });

    this.logger.log(
      `${rowsAffected} registros HapVida deletados`,
      'HapVidaRepository',
    );

    return rowsAffected;
  }

  /**
   * Verificar se já existem dados importados para o período
   */
  async verificarDadosExistentes(
    mesRef: number,
    anoRef: number,
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as total
      FROM nbs.hapvida_plano
      WHERE hap_mes = :mesRef
        AND hap_ano = :anoRef
    `;

    const result = await this.oracleService.queryOne<{ total: number }>(sql, {
      mesRef,
      anoRef,
    });

    return (result?.total || 0) > 0;
  }

  /**
   * Buscar dados de plano por período
   */
  async buscarDadosPorPeriodo(
    mesRef: number,
    anoRef: number,
  ): Promise<HapVidaImportData[]> {
    const sql = `
      SELECT 
        empresa, unidade, nome_empresa as "nomeEmpresa",
        credencial, matricula, cpf, beneficiario,
        data_nascimento as "dataNascimento",
        data_inclusao as "dataInclusao",
        idade, plano, ac,
        mensalidade, adicional, desconto, valor_cobrado as "valorCobrado",
        hap_ano as "hapAno", hap_mes as "hapMes"
      FROM nbs.hapvida_plano
      WHERE hap_mes = :mesRef
        AND hap_ano = :anoRef
      ORDER BY beneficiario
    `;

    return await this.oracleService.query<HapVidaImportData>(sql, {
      mesRef,
      anoRef,
    });
  }
}
