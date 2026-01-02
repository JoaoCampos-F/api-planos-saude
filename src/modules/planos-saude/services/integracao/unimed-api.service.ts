import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '@/shared/logger/logger.service';
import { OracleService } from '@/shared/database/oracle.service';
import {
  UnimedAuthToken,
  UnimedApiResponse,
  UnimedCachedToken,
} from '../../interfaces';

/**
 * Service para integração com a API REST da Unimed Cuiabá
 *
 * FILOSOFIA: Este service apenas chama a API externa e gerencia o token.
 * Não contém lógica de negócio - apenas wrapper da API.
 */
@Injectable()
export class UnimedApiService {
  private readonly apiUrl: string;
  private readonly apiUser: string;
  private readonly apiPassword: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly oracleService: OracleService,
  ) {
    // Carregar configurações da API Unimed
    const integrationsConfig = this.configService.get(
      'integrations.unimed.api',
    );
    this.apiUrl =
      integrationsConfig?.url || 'https://ws.unimedcuiaba.coop.br/api';
    this.apiUser = integrationsConfig?.user || process.env.UNIMED_API_USER;
    this.apiPassword =
      integrationsConfig?.password || process.env.UNIMED_API_PASSWORD;
    this.timeout = 30000; // 30 segundos

    this.logger.log('UnimedApiService inicializado', 'UnimedApiService');
  }

  /**
   * Obter token de autenticação (com cache)
   * Verifica cache no banco antes de gerar novo token
   */
  async getAuthToken(): Promise<UnimedAuthToken> {
    this.logger.log(
      'Verificando token de autenticação Unimed',
      'UnimedApiService',
    );

    // 1. Verificar se existe token válido em cache (banco de dados)
    const cachedToken = await this.getTokenFromCache();

    if (cachedToken && this.isTokenValid(cachedToken.dataExpiracao)) {
      this.logger.log('Token válido encontrado em cache', 'UnimedApiService');
      return {
        token: cachedToken.token,
        expiresAt: cachedToken.dataExpiracao,
        tokenType: 'Bearer',
      };
    }

    // 2. Token não existe ou expirou - gerar novo
    this.logger.log('Gerando novo token de autenticação', 'UnimedApiService');
    const newToken = await this.generateNewToken();

    // 3. Salvar token em cache
    await this.saveTokenToCache(newToken);

    return newToken;
  }

  /**
   * Buscar demonstrativo por CNPJ
   */
  async buscarDemonstrativoPorCnpj(
    cnpj: string,
    mesRef: number,
    anoRef: number,
  ): Promise<UnimedApiResponse> {
    this.logger.log(
      `Buscando demonstrativo Unimed - CNPJ: ${cnpj}, Período: ${mesRef}/${anoRef}`,
      'UnimedApiService',
    );

    try {
      // 1. Obter token de autenticação
      const authToken = await this.getAuthToken();

      // 2. Montar período no formato esperado pela API (MM-YYYY)
      const periodo = `${String(mesRef).padStart(2, '0')}-${anoRef}`;

      // 3. Chamar API Unimed
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/Demonstrativo/buscaporperiodocnpj`,
          {
            cnpj: cnpj,
            periodo: periodo,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken.token}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          },
        ),
      );

      this.logger.log(
        `Demonstrativo obtido com sucesso - ${response.data?.data?.length || 0} registros`,
        'UnimedApiService',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar demonstrativo por CNPJ: ${error.message}`,
        error.stack,
        'UnimedApiService',
      );
      throw error;
    }
  }

  /**
   * Buscar demonstrativo por Contrato
   */
  async buscarDemonstrativoPorContrato(
    contrato: string,
    mesRef: number,
    anoRef: number,
  ): Promise<UnimedApiResponse> {
    this.logger.log(
      `Buscando demonstrativo Unimed - Contrato: ${contrato}, Período: ${mesRef}/${anoRef}`,
      'UnimedApiService',
    );

    try {
      // 1. Obter token de autenticação
      const authToken = await this.getAuthToken();

      // 2. Montar período no formato esperado pela API (MM-YYYY)
      const periodo = `${String(mesRef).padStart(2, '0')}-${anoRef}`;

      // 3. Chamar API Unimed
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/Demonstrativo/buscaporperiodocontrato`,
          {
            contrato: contrato,
            periodo: periodo,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken.token}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          },
        ),
      );

      this.logger.log(
        `Demonstrativo obtido com sucesso - ${response.data?.data?.length || 0} registros`,
        'UnimedApiService',
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar demonstrativo por contrato: ${error.message}`,
        error.stack,
        'UnimedApiService',
      );
      throw error;
    }
  }

  /**
   * Gerar novo token na API Unimed
   */
  private async generateNewToken(): Promise<UnimedAuthToken> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/Token/geratoken`,
          {
            usuario: this.apiUser,
            senha: this.apiPassword,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          },
        ),
      );

      const tokenData = response.data;

      // Token da Unimed é válido por 24 horas
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return {
        token: tokenData.token,
        expiresAt: expiresAt,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar token Unimed: ${error.message}`,
        error.stack,
        'UnimedApiService',
      );
      throw error;
    }
  }

  /**
   * Buscar token em cache (banco de dados)
   */
  private async getTokenFromCache(): Promise<UnimedCachedToken | null> {
    try {
      const result = await this.oracleService.queryOne<UnimedCachedToken>(
        `SELECT 
          identificador,
          token,
          data_expiracao as "dataExpiracao",
          data_geracao as "dataGeracao"
        FROM gc.api_gc_servicos
        WHERE identificador = :identificador
        AND data_expiracao > SYSDATE`,
        { identificador: 'UNIMED_AUTH_TOKEN' },
      );

      return result;
    } catch (error) {
      this.logger.warn(
        `Erro ao buscar token em cache: ${error.message}`,
        'UnimedApiService',
      );
      return null;
    }
  }

  /**
   * Salvar token em cache (banco de dados)
   */
  private async saveTokenToCache(authToken: UnimedAuthToken): Promise<void> {
    try {
      await this.oracleService.execute(
        `MERGE INTO gc.api_gc_servicos t
        USING (SELECT :identificador as identificador FROM dual) s
        ON (t.identificador = s.identificador)
        WHEN MATCHED THEN
          UPDATE SET 
            token = :token,
            data_expiracao = :dataExpiracao,
            data_geracao = SYSDATE
        WHEN NOT MATCHED THEN
          INSERT (identificador, token, data_expiracao, data_geracao)
          VALUES (:identificador, :token, :dataExpiracao, SYSDATE)`,
        {
          identificador: 'UNIMED_AUTH_TOKEN',
          token: authToken.token,
          dataExpiracao: authToken.expiresAt,
        },
      );

      this.logger.log('Token salvo em cache', 'UnimedApiService');
    } catch (error) {
      // Não falhar se não conseguir salvar em cache
      this.logger.warn(
        `Erro ao salvar token em cache: ${error.message}`,
        'UnimedApiService',
      );
    }
  }

  /**
   * Verificar se token ainda é válido
   */
  private isTokenValid(expiresAt: Date): boolean {
    const now = new Date();
    // Adicionar margem de segurança de 5 minutos
    const margin = 5 * 60 * 1000; // 5 minutos em milissegundos
    return expiresAt.getTime() - now.getTime() > margin;
  }
}
