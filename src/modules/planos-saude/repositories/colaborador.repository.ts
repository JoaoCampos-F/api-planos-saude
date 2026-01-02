import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { ColaboradorResumo } from '../interfaces';
import { BuscarColaboradorDto } from '../dtos/colaborador';

/**
 * Repository para dados de colaboradores
 *
 * FILOSOFIA: Repository Pattern simplificado - apenas wrapper de queries Oracle.
 * Usa principalmente a view gc.vw_uni_resumo_colaborador
 */
@Injectable()
export class ColaboradorRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Buscar colaboradores com filtros
   * Replica exatamente a lógica do legacy: UnimedController.php -> case 'Buscar'
   */
  async buscar(filtros: BuscarColaboradorDto): Promise<ColaboradorResumo[]> {
    const params: any = {};
    let query = `
      SELECT * FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
    `;

    // Filtro por empresa (requer busca de códigos)
    if (filtros.empresa) {
      // TODO: Buscar cod_empresa, codcoligada via EmpresaRepository
      // Por enquanto, apenas adiciona filtro se códigos forem fornecidos
      this.logger.warn(
        'Filtro por empresa requer integração com EmpresaRepository',
      );
    }

    // Filtro por mês
    if (filtros.mes) {
      query += ` AND a.mes_ref = :mes`;
      params.mes = filtros.mes;
    }

    // Filtro por ano
    if (filtros.ano) {
      query += ` AND a.ano_ref = :ano`;
      params.ano = filtros.ano;
    }

    // Filtro por CPF (remove zeros à esquerda para comparação)
    if (filtros.cpf) {
      query += ` AND LTRIM(a.codigo_cpf, '0000') = LTRIM(:cpf, '0000')`;
      params.cpf = filtros.cpf;
    }

    query += ` ORDER BY a.cod_band, a.apelido, a.colaborador`;

    this.logger.log(
      `Buscando colaboradores com filtros: ${JSON.stringify(filtros)}`,
      'ColaboradorRepository',
    );

    return this.oracleService.query<ColaboradorResumo>(query, params);
  }

  /**
   * Atualizar status de exportação de um colaborador
   * Replica: UnimedDAO.php -> updateColaborador()
   */
  async atualizarExportacao(
    cpf: string,
    mes: number,
    ano: number,
    exporta: 'S' | 'N',
  ): Promise<void> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE codigo_cpf = :cpf
        AND mes_ref = :mes
        AND ano_ref = :ano
    `;

    const params = { cpf, mes, ano, exporta };

    this.logger.log(
      `Atualizando exportação: CPF=${cpf}, Período=${mes}/${ano}, Exporta=${exporta}`,
      'ColaboradorRepository',
    );

    await this.oracleService.execute(query, params);
  }

  /**
   * Atualizar status de exportação de todos colaboradores de uma empresa
   * Replica: UnimedDAO.php -> updateTodosColaborador()
   */
  async atualizarExportacaoTodos(
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    mes: number,
    ano: number,
    exporta: 'S' | 'N',
  ): Promise<void> {
    const query = `
      UPDATE gc.uni_resumo_colaborador
      SET exporta = :exporta
      WHERE mes_ref = :mes
        AND ano_ref = :ano
        AND cod_empresa = :codEmpresa
        AND codcoligada = :codColigada
        AND codfilial = :codFilial
    `;

    const params = { exporta, mes, ano, codEmpresa, codColigada, codFilial };

    this.logger.log(
      `Atualizando exportação em lote: Empresa=${codEmpresa}, Período=${mes}/${ano}, Exporta=${exporta}`,
      'ColaboradorRepository',
    );

    await this.oracleService.execute(query, params);
  }

  /**
   * Atualizar valor pago pela empresa
   * Replica: UnimedDAO.php -> updateValorColaborador()
   */
  async atualizarValorEmpresa(
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    valor: number,
  ): Promise<void> {
    const query = `
      UPDATE nbs.mcw_colaborador b
      SET b.unimed = :valor
      WHERE b.ativo = 'S'
        AND b.cod_empresa = :codEmpresa
        AND b.codcoligada = :codColigada
        AND b.codfilial = :codFilial
    `;

    const params = { valor, codEmpresa, codColigada, codFilial };

    this.logger.log(
      `Atualizando valor empresa: Empresa=${codEmpresa}, Valor=${valor}`,
      'ColaboradorRepository',
    );

    await this.oracleService.execute(query, params);
  }
}
