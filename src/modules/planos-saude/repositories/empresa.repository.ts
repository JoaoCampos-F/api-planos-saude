import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { LoggerService } from '@/shared/logger/logger.service';
import {
  Empresa,
  Contrato,
  EmpresaResumo,
} from '../interfaces/empresa.interface';

/**
 * Repository para queries relacionadas a empresas e contratos
 */
@Injectable()
export class EmpresaRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca todas as empresas ou filtra por sigla
   */
  async buscarEmpresas(sigla?: string, ativo?: string): Promise<Empresa[]> {
    this.logger.log(`Buscando empresas - sigla: ${sigla}, ativo: ${ativo}`);

    const query = `
      SELECT 
        e.codigo,
        e.sigla,
        e.nome_fantasia,
        e.razao_social,
        e.cnpj,
        e.cod_coligada,
        e.cod_filial,
        e.cod_bandeira,
        e.ativo
      FROM gc.empresa e
      WHERE (:sigla IS NULL OR e.sigla = :sigla)
        AND (:ativo IS NULL OR e.ativo = :ativo)
      ORDER BY e.sigla
    `;

    const result = await this.oracleService.query<Empresa>(query, {
      sigla: sigla || null,
      ativo: ativo || null,
    });

    this.logger.log(`Encontradas ${result.length} empresas`);
    return result;
  }

  /**
   * Busca uma empresa específica por sigla
   */
  async buscarEmpresaPorSigla(sigla: string): Promise<Empresa | null> {
    this.logger.log(`Buscando empresa por sigla: ${sigla}`);

    const query = `
      SELECT 
        e.codigo,
        e.sigla,
        e.nome_fantasia,
        e.razao_social,
        e.cnpj,
        e.cod_coligada,
        e.cod_filial,
        e.cod_bandeira,
        e.ativo
      FROM gc.empresa e
      WHERE e.sigla = :sigla
    `;

    return this.oracleService.queryOne<Empresa>(query, { sigla });
  }

  /**
   * Busca empresa com estatísticas resumidas
   */
  async buscarEmpresaComResumo(sigla: string): Promise<EmpresaResumo | null> {
    this.logger.log(`Buscando empresa com resumo: ${sigla}`);

    const query = `
      SELECT 
        e.codigo,
        e.sigla,
        e.nome_fantasia,
        e.razao_social,
        e.cnpj,
        e.cod_coligada,
        e.cod_filial,
        e.cod_bandeira,
        e.ativo,
        COUNT(DISTINCT c.contrato) as total_contratos,
        COUNT(DISTINCT c.cpf) as total_colaboradores
      FROM gc.empresa e
      LEFT JOIN gc.uni_resumo_colaborador c ON c.cod_empresa = e.codigo
      WHERE e.sigla = :sigla
      GROUP BY 
        e.codigo, e.sigla, e.nome_fantasia, e.razao_social, 
        e.cnpj, e.cod_coligada, e.cod_filial, e.cod_bandeira, e.ativo
    `;

    return this.oracleService.queryOne<EmpresaResumo>(query, { sigla });
  }

  /**
   * Busca contratos por empresa
   */
  async buscarContratos(
    empresaSigla?: string,
    contrato?: string,
  ): Promise<Contrato[]> {
    this.logger.log(
      `Buscando contratos - empresa: ${empresaSigla}, contrato: ${contrato}`,
    );

    const query = `
      SELECT DISTINCT
        c.contrato as codigo,
        c.contrato as descricao,
        e.sigla as empresa_sigla,
        e.codigo as empresa_codigo,
        'S' as ativo
      FROM gc.uni_resumo_colaborador c
      INNER JOIN gc.empresa e ON c.cod_empresa = e.codigo
      WHERE (:empresaSigla IS NULL OR e.sigla = :empresaSigla)
        AND (:contrato IS NULL OR c.contrato = :contrato)
      ORDER BY e.sigla, c.contrato
    `;

    const result = await this.oracleService.query<Contrato>(query, {
      empresaSigla: empresaSigla || null,
      contrato: contrato || null,
    });

    this.logger.log(`Encontrados ${result.length} contratos`);
    return result;
  }

  /**
   * Busca contratos de uma empresa específica
   */
  async buscarContratosPorEmpresa(sigla: string): Promise<Contrato[]> {
    return this.buscarContratos(sigla);
  }

  /**
   * Valida se empresa existe e está ativa
   */
  async validarEmpresa(sigla: string): Promise<boolean> {
    this.logger.log(`Validando empresa: ${sigla}`);

    const query = `
      SELECT COUNT(*) as count
      FROM gc.empresa e
      WHERE e.sigla = :sigla AND e.ativo = 'S'
    `;

    const result = await this.oracleService.queryOne<{ count: number }>(query, {
      sigla,
    });

    const valida = !!(result && result.count > 0);
    this.logger.log(`Empresa ${sigla} ${valida ? 'válida' : 'inválida'}`);
    return valida;
  }
}
