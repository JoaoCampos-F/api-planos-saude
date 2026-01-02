import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import { ProcessoMCW } from '../interfaces';
import { BuscarProcessoDto, HistoricoProcessoDto } from '../dtos/processo';

/**
 * Repository para processos MCW
 *
 * FILOSOFIA: Repository Pattern simplificado - apenas wrapper de queries Oracle.
 * Usa tabelas gc.mcw_processo e gc.mcw_processo_log
 */
@Injectable()
export class ProcessoRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Buscar processos MCW disponíveis para execução
   * Replica: UnimedDAO.php -> carregaProcessosProcessa()
   */
  async buscarProcessos(filtros: BuscarProcessoDto): Promise<ProcessoMCW[]> {
    const query = `
      SELECT 
        a.codigo,
        a.categoria,
        a.procedure,
        a.descricao,
        a.ordem,
        a.dias,
        a.usuario,
        a.tipo_empresa,
        a.tipo_dado,
        a.ativo,
        (
          SELECT MAX(TO_CHAR(b.data_proc, 'DD/MM/YYYY HH24:MI:SS'))
          FROM gc.mcw_processo_log b
          WHERE b.mes_ref = :mes
            AND b.ano_ref = :ano
            AND b.categoria = :categoria
            AND b.codigo = a.codigo
        ) AS data_proc
      FROM gc.mcw_processo a
      WHERE 1=1
        AND a.ativo = 'S'
        AND a.codigo NOT IN ('70000008', '70000009')
        AND a.categoria = :categoria
        AND a.tipo_dado = :tipoDado
      ORDER BY a.ordem_procedure
    `;

    const params = {
      categoria: filtros.categoria,
      tipoDado: filtros.tipoDado,
      mes: filtros.mes || null,
      ano: filtros.ano || null,
    };

    this.logger.log(
      `Buscando processos MCW: ${filtros.categoria}/${filtros.tipoDado}`,
      'ProcessoRepository',
    );

    return this.oracleService.query<ProcessoMCW>(query, params);
  }

  /**
   * Buscar histórico de execução de um processo
   * Replica: UnimedDAO.php -> carregaProcessoshistUnimed()
   */
  async buscarHistorico(filtros: HistoricoProcessoDto): Promise<any[]> {
    const query = `
      SELECT *
      FROM gc.vw_mcw_processo_log a
      WHERE 1=1
        AND a.mes_ref = :mes
        AND a.ano_ref = :ano
        AND a.categoria = :categoria
        AND a.codigo = :codigo
      ORDER BY a.data_proc DESC
    `;

    const params = {
      mes: filtros.mes,
      ano: filtros.ano,
      categoria: filtros.categoria,
      codigo: filtros.codigo,
    };

    this.logger.log(
      `Buscando histórico: Processo=${filtros.codigo}, Período=${filtros.mes}/${filtros.ano}`,
      'ProcessoRepository',
    );

    return this.oracleService.query<any>(query, params);
  }

  /**
   * Buscar período de fechamento
   * Replica: UnimedDAO.php -> carrregaPeriodoFechamento()
   */
  async buscarPeriodoFechamento(mes: number, ano: number): Promise<any> {
    const query = `
      SELECT TO_CHAR(data_final, 'YYYY-MM-DD') AS data_final
      FROM gc.mcw_periodo a
      WHERE a.mes_ref = :mes
        AND a.ano_ref = :ano
    `;

    const params = { mes, ano };

    this.logger.log(
      `Buscando período de fechamento: ${mes}/${ano}`,
      'ProcessoRepository',
    );

    return this.oracleService.queryOne<any>(query, params);
  }

  /**
   * Buscar informações de um processo específico
   * Replica: UnimedDAO.php -> carregaProcessoInterno()
   */
  async buscarProcessoPorCodigo(codigo: string): Promise<any> {
    const query = `
      SELECT dias, descricao
      FROM gc.mcw_processo a
      WHERE a.codigo = :codigo
    `;

    const params = { codigo };

    this.logger.log(`Buscando processo: ${codigo}`, 'ProcessoRepository');

    return this.oracleService.queryOne<any>(query, params);
  }

  /**
   * Executar stored procedure de fechamento global
   * Replica: UnimedDAO.php -> processarUnimed() -> chamada da procedure
   */
  async executarProcedure(params: {
    codigo: string;
    mes: number;
    ano: number;
    previa: 'S' | 'N';
    apagar: 'S' | 'N';
    usuario: string;
    todasEmpresas: 'S' | 'N';
    codEmpresa: string;
    codBand: string;
    tipoDado: string;
    categoria: string;
    cpf: string;
  }): Promise<void> {
    const procedure = `
      BEGIN
        GC.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL(
          :codigo,
          :mes,
          :ano,
          :previa,
          :apagar,
          :usuario,
          :todasEmpresas,
          :codEmpresa,
          :codBand,
          :tipoDado,
          :categoria,
          :cpf
        );
      END;
    `;

    this.logger.log(
      `Executando procedure: ${params.codigo} - Período=${params.mes}/${params.ano}`,
      'ProcessoRepository',
    );

    await this.oracleService.execute(procedure, params);
  }
}
