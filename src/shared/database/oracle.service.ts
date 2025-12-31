import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

/**
 * Serviço central para gerenciar conexões com Oracle Database.
 * 
 * Este serviço:
 * - Cria e mantém um pool de conexões
 * - Fornece métodos para executar queries e procedures
 * - Garante fechamento adequado de conexões
 * - Trata erros do Oracle de forma padronizada
 * 
 * IMPORTANTE: Este é apenas um wrapper sobre oracledb.
 * Toda a lógica de negócio está no banco (procedures, views, functions).
 */
@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private pool: oracledb.Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.logger.log('Inicializando pool de conexões Oracle...');
      
      const dbConfig = this.configService.get('database.oracle');
      
      this.pool = await oracledb.createPool({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString: dbConfig.connectString,
        poolMin: dbConfig.poolMin,
        poolMax: dbConfig.poolMax,
        poolIncrement: dbConfig.poolIncrement,
      });

      this.logger.log(
        `Pool Oracle criado com sucesso (min: ${dbConfig.poolMin}, max: ${dbConfig.poolMax})`,
      );
    } catch (error) {
      this.logger.error('Erro ao criar pool de conexões Oracle', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.pool) {
        await this.pool.close(10);
        this.logger.log('Pool de conexões Oracle fechado');
      }
    } catch (error) {
      this.logger.error('Erro ao fechar pool Oracle', error.stack);
    }
  }

  /**
   * Executa uma query SELECT e retorna os resultados tipados.
   * 
   * @template T - Tipo do objeto retornado
   * @param sql - Query SQL a ser executada
   * @param params - Parâmetros nomeados da query
   * @returns Array de objetos tipados
   * 
   * @example
   * ```typescript
   * const colaboradores = await this.oracleService.query<ColaboradorResumo>(
   *   'SELECT * FROM gc.vw_uni_resumo_colaborador WHERE mes_ref = :mes',
   *   { mes: 12 }
   * );
   * ```
   */
  async query<T>(
    sql: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    const connection = await this.getConnection();
    
    try {
      this.logger.debug(`Executando query: ${sql.substring(0, 100)}...`);
      
      const result = await connection.execute<T>(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      this.logger.debug(`Query retornou ${result.rows?.length || 0} registros`);
      
      return (result.rows || []) as T[];
    } catch (error) {
      this.logger.error(`Erro ao executar query: ${error.message}`, error.stack);
      throw this.handleOracleError(error);
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Executa um único resultado (query que retorna 1 registro).
   * 
   * @template T - Tipo do objeto retornado
   * @param sql - Query SQL
   * @param params - Parâmetros nomeados
   * @returns Objeto tipado ou null
   */
  async queryOne<T>(
    sql: string,
    params: Record<string, any> = {},
  ): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Executa um comando que modifica dados (INSERT, UPDATE, DELETE).
   * 
   * @param sql - Comando SQL
   * @param params - Parâmetros nomeados
   * @returns Número de linhas afetadas
   * 
   * @example
   * ```typescript
   * await this.oracleService.execute(
   *   'UPDATE gc.uni_resumo_colaborador SET exporta = :exporta WHERE codigo_cpf = :cpf',
   *   { exporta: 'S', cpf: '12345678900' }
   * );
   * ```
   */
  async execute(
    sql: string,
    params: Record<string, any> = {},
  ): Promise<number> {
    const connection = await this.getConnection();
    
    try {
      this.logger.debug(`Executando comando: ${sql.substring(0, 100)}...`);
      
      const result = await connection.execute(sql, params, {
        autoCommit: true,
      });

      const rowsAffected = result.rowsAffected || 0;
      this.logger.debug(`Comando afetou ${rowsAffected} registro(s)`);
      
      return rowsAffected;
    } catch (error) {
      this.logger.error(`Erro ao executar comando: ${error.message}`, error.stack);
      throw this.handleOracleError(error);
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Chama uma stored procedure do Oracle.
   * 
   * IMPORTANTE: As procedures contêm a lógica de negócio.
   * Este método apenas executa a chamada, não reimplementa a lógica.
   * 
   * @param procedureName - Nome completo da procedure (schema.package.procedure)
   * @param params - Parâmetros da procedure
   * 
   * @example
   * ```typescript
   * // Chama a mesma procedure que o legacy
   * await this.oracleService.callProcedure(
   *   'gc.PKG_UNI_SAUDE.p_uni_resumo',
   *   { mes: 12, ano: 2024 }
   * );
   * ```
   */
  async callProcedure(
    procedureName: string,
    params: Record<string, any> = {},
  ): Promise<void> {
    const connection = await this.getConnection();
    
    try {
      this.logger.log(`Chamando procedure: ${procedureName}`);
      
      const paramNames = Object.keys(params);
      const paramPlaceholders = paramNames.map((name) => `:${name}`).join(', ');
      
      const sql = paramPlaceholders
        ? `BEGIN ${procedureName}(${paramPlaceholders}); END;`
        : `BEGIN ${procedureName}; END;`;

      await connection.execute(sql, params, {
        autoCommit: true,
      });

      this.logger.log(`Procedure ${procedureName} executada com sucesso`);
    } catch (error) {
      this.logger.error(
        `Erro ao executar procedure ${procedureName}: ${error.message}`,
        error.stack,
      );
      throw this.handleOracleError(error);
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Executa múltiplos comandos em uma transação.
   * Se um falhar, todos são revertidos.
   * 
   * @param callback - Função que recebe a conexão para executar comandos
   */
  async transaction<T>(
    callback: (connection: oracledb.Connection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.getConnection();
    
    try {
      this.logger.debug('Iniciando transação');
      const result = await callback(connection);
      await connection.commit();
      this.logger.debug('Transação commitada com sucesso');
      return result;
    } catch (error) {
      this.logger.error('Erro na transação, fazendo rollback', error.stack);
      await connection.rollback();
      throw this.handleOracleError(error);
    } finally {
      await this.releaseConnection(connection);
    }
  }

  /**
   * Obtém uma conexão do pool.
   */
  private async getConnection(): Promise<oracledb.Connection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      this.logger.error('Erro ao obter conexão do pool', error.stack);
      throw new InternalServerErrorException(
        'Erro ao conectar ao banco de dados',
      );
    }
  }

  /**
   * Libera uma conexão de volta para o pool.
   */
  private async releaseConnection(connection: oracledb.Connection): Promise<void> {
    try {
      if (connection) {
        await connection.close();
      }
    } catch (error) {
      this.logger.error('Erro ao liberar conexão', error.stack);
    }
  }

  /**
   * Trata erros do Oracle e retorna exceções apropriadas do NestJS.
   */
  private handleOracleError(error: any): Error {
    const oracleError = error as oracledb.DBError;
    
    // ORA-00001: Constraint violation (unique, primary key, etc.)
    if (oracleError.errorNum === 1) {
      return new InternalServerErrorException(
        'Registro duplicado. Os dados já existem no sistema.',
      );
    }
    
    // ORA-01403: No data found
    if (oracleError.errorNum === 1403) {
      return new InternalServerErrorException(
        'Nenhum dado encontrado para os parâmetros informados.',
      );
    }
    
    // ORA-01422: Exact fetch returns more than requested number of rows
    if (oracleError.errorNum === 1422) {
      return new InternalServerErrorException(
        'Consulta retornou mais registros que o esperado.',
      );
    }

    // Erro genérico do Oracle
    if (oracleError.errorNum) {
      this.logger.error(
        `Oracle Error ${oracleError.errorNum}: ${oracleError.message}`,
      );
      return new InternalServerErrorException(
        `Erro no banco de dados: ${oracleError.message}`,
      );
    }

    // Erro desconhecido
    return new InternalServerErrorException('Erro inesperado no banco de dados');
  }
}
