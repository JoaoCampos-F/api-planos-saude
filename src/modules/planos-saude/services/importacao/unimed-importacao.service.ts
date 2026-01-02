import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { UnimedApiService } from '../integracao/unimed-api.service';
import { UnimedRepository } from '../../repositories/unimed.repository';
import {
  UnimedDadosCobrancaApi,
  UnimedApiBeneficiario,
  UnimedApiDemonstrativo,
} from '../../interfaces';
import { ImportacaoResponseDto } from '../../dtos';

/**
 * Service para importação de dados da Unimed
 *
 * FILOSOFIA: Orquestra chamadas entre API e Repository.
 * Mantém EXATAMENTE a mesma lógica do legacy PHP, apenas moderniza a tecnologia.
 */
@Injectable()
export class UnimedImportacaoService {
  constructor(
    private readonly unimedApiService: UnimedApiService,
    private readonly unimedRepository: UnimedRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Importar dados da Unimed por CNPJ
   * Replica a lógica do UnimedController.php do legacy
   */
  async importarPorCnpj(
    cnpj: string,
    mesRef: number,
    anoRef: number,
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    codBand: string,
  ): Promise<ImportacaoResponseDto> {
    this.logger.log(
      `Iniciando importação Unimed por CNPJ - CNPJ: ${cnpj}, Período: ${mesRef}/${anoRef}`,
      'UnimedImportacaoService',
    );

    const dataInicio = new Date();

    try {
      // 1. Buscar dados na API Unimed
      const apiResponse =
        await this.unimedApiService.buscarDemonstrativoPorCnpj(
          cnpj,
          mesRef,
          anoRef,
        );

      if (!apiResponse.success || !apiResponse.data) {
        return {
          sucesso: false,
          mensagem: 'Nenhum dado retornado pela API Unimed',
          totalRegistros: 0,
          registrosImportados: 0,
          registrosComErro: 0,
          dataImportacao: new Date(),
        };
      }

      // 2. Deletar dados existentes do período (mesma lógica do legacy)
      await this.unimedRepository.deletarDadosPorPeriodo(
        mesRef,
        anoRef,
        codEmpresa,
      );

      // 3. Transformar dados da API para formato do banco
      const dadosParaInserir = this.transformarDadosApi(
        apiResponse.data,
        mesRef,
        anoRef,
        codEmpresa,
        codColigada,
        codFilial,
        codBand,
      );

      // 4. Inserir dados em lote
      const registrosImportados =
        await this.unimedRepository.inserirDadosCobrancaLote(dadosParaInserir);

      const dataFim = new Date();
      const duracao = (dataFim.getTime() - dataInicio.getTime()) / 1000;

      this.logger.log(
        `Importação concluída - ${registrosImportados}/${dadosParaInserir.length} registros importados em ${duracao}s`,
        'UnimedImportacaoService',
      );

      return {
        sucesso: true,
        mensagem: 'Importação realizada com sucesso',
        totalRegistros: dadosParaInserir.length,
        registrosImportados: registrosImportados,
        registrosComErro: dadosParaInserir.length - registrosImportados,
        dataImportacao: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Erro na importação Unimed: ${error.message}`,
        error.stack,
        'UnimedImportacaoService',
      );

      return {
        sucesso: false,
        mensagem: `Erro na importação: ${error.message}`,
        totalRegistros: 0,
        registrosImportados: 0,
        registrosComErro: 0,
        dataImportacao: new Date(),
      };
    }
  }

  /**
   * Importar dados da Unimed por Contrato
   */
  async importarPorContrato(
    contrato: string,
    mesRef: number,
    anoRef: number,
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    codBand: string,
  ): Promise<ImportacaoResponseDto> {
    this.logger.log(
      `Iniciando importação Unimed por Contrato - Contrato: ${contrato}, Período: ${mesRef}/${anoRef}`,
      'UnimedImportacaoService',
    );

    const dataInicio = new Date();

    try {
      // 1. Buscar dados na API Unimed
      const apiResponse =
        await this.unimedApiService.buscarDemonstrativoPorContrato(
          contrato,
          mesRef,
          anoRef,
        );

      if (!apiResponse.success || !apiResponse.data) {
        return {
          sucesso: false,
          mensagem: 'Nenhum dado retornado pela API Unimed',
          totalRegistros: 0,
          registrosImportados: 0,
          registrosComErro: 0,
          dataImportacao: new Date(),
        };
      }

      // 2. Deletar dados existentes do período
      await this.unimedRepository.deletarDadosPorPeriodo(
        mesRef,
        anoRef,
        codEmpresa,
      );

      // 3. Transformar dados da API para formato do banco
      const dadosParaInserir = this.transformarDadosApi(
        apiResponse.data,
        mesRef,
        anoRef,
        codEmpresa,
        codColigada,
        codFilial,
        codBand,
      );

      // 4. Inserir dados em lote
      const registrosImportados =
        await this.unimedRepository.inserirDadosCobrancaLote(dadosParaInserir);

      const dataFim = new Date();
      const duracao = (dataFim.getTime() - dataInicio.getTime()) / 1000;

      this.logger.log(
        `Importação concluída - ${registrosImportados}/${dadosParaInserir.length} registros importados em ${duracao}s`,
        'UnimedImportacaoService',
      );

      return {
        sucesso: true,
        mensagem: 'Importação realizada com sucesso',
        totalRegistros: dadosParaInserir.length,
        registrosImportados: registrosImportados,
        registrosComErro: dadosParaInserir.length - registrosImportados,
        dataImportacao: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Erro na importação Unimed: ${error.message}`,
        error.stack,
        'UnimedImportacaoService',
      );

      return {
        sucesso: false,
        mensagem: `Erro na importação: ${error.message}`,
        totalRegistros: 0,
        registrosImportados: 0,
        registrosComErro: 0,
        dataImportacao: new Date(),
      };
    }
  }

  /**
   * Transformar dados da API Unimed para formato do banco
   * Replica a lógica de transformação do legacy
   */
  private transformarDadosApi(
    demonstrativos: UnimedApiDemonstrativo[],
    mesRef: number,
    anoRef: number,
    codEmpresa: number,
    codColigada: number,
    codFilial: number,
    codBand: string,
  ): UnimedDadosCobrancaApi[] {
    const dadosTransformados: UnimedDadosCobrancaApi[] = [];

    for (const demo of demonstrativos) {
      for (const beneficiario of demo.beneficiarios) {
        const dados: UnimedDadosCobrancaApi = {
          // Dados do Contrato
          contrato: demo.contrato,
          cnpj: demo.cnpj,
          contratante: demo.contratante,
          nomePlano: demo.nomePlano,
          abrangencia: demo.abrangencia,
          codFatura: demo.codFatura,
          valorFatura: demo.valorFatura,
          periodo: demo.periodo,

          // Dados do Titular
          codTitular: beneficiario.codTitular,
          titular: beneficiario.titular,
          cpfTitular: beneficiario.cpfTitular,
          matricula: beneficiario.matricula,
          acomodacao: beneficiario.acomodacao,

          // Dados do Beneficiário
          codBeneficiario: beneficiario.codBeneficiario,
          beneficiario: beneficiario.beneficiario,
          cpf: beneficiario.cpf,
          idade: beneficiario.idade,
          nascimento: new Date(beneficiario.nascimento),
          inclusao: new Date(beneficiario.inclusao),
          dependencia: beneficiario.dependencia,

          // Valores
          valorCobrado: beneficiario.valorCobrado,
          descricao: beneficiario.descricao,

          // Controle
          mesRef: mesRef,
          anoRef: anoRef,
          codEmpresa: codEmpresa,
          codColigada: codColigada,
          codFilial: codFilial,
          codBand: codBand,
          exporta: 'N', // Sempre inicia como não exportado
          dataImport: new Date(),
        };

        dadosTransformados.push(dados);
      }
    }

    return dadosTransformados;
  }
}
