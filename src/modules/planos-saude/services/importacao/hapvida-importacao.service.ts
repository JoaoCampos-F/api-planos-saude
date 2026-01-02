import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { HapVidaRepository } from '../../repositories/hapvida.repository';
import {
  HapVidaImportData,
  HapVidaCsvRow,
  HapVidaImportError,
} from '../../interfaces';
import { ImportacaoResponseDto } from '../../dtos';
import * as fs from 'fs';
import * as readline from 'readline';

/**
 * Service para importação de dados da HapVida via CSV
 *
 * FILOSOFIA: Replica a lógica do HapVidaController.php do legacy.
 * Processa arquivo CSV e insere dados no banco.
 */
@Injectable()
export class HapVidaImportacaoService {
  constructor(
    private readonly hapVidaRepository: HapVidaRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Importar dados da HapVida a partir de arquivo CSV
   */
  async importarArquivoCsv(
    caminhoArquivo: string,
    mesRef: number,
    anoRef: number,
  ): Promise<ImportacaoResponseDto> {
    this.logger.log(
      `Iniciando importação HapVida - Arquivo: ${caminhoArquivo}, Período: ${mesRef}/${anoRef}`,
      'HapVidaImportacaoService',
    );

    const dataInicio = new Date();
    const erros: HapVidaImportError[] = [];
    const dadosParaInserir: HapVidaImportData[] = [];
    let totalLinhas = 0;

    try {
      // 1. Verificar se arquivo existe
      if (!fs.existsSync(caminhoArquivo)) {
        throw new Error('Arquivo não encontrado');
      }

      // 2. Deletar dados existentes do período
      await this.hapVidaRepository.deletarDadosPorPeriodo(mesRef, anoRef);

      // 3. Processar arquivo CSV linha por linha
      const fileStream = fs.createReadStream(caminhoArquivo, {
        encoding: 'utf8',
      });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let isHeader = true;
      let linhaAtual = 0;

      for await (const linha of rl) {
        linhaAtual++;

        // Pular cabeçalho
        if (isHeader) {
          isHeader = false;
          continue;
        }

        // Pular linhas vazias
        if (!linha.trim()) {
          continue;
        }

        totalLinhas++;

        try {
          // Parsear linha CSV
          const dados = this.parsearLinhaCsv(linha, linhaAtual);

          // Transformar para formato do banco
          const plano = this.transformarDadosCsv(dados, mesRef, anoRef);

          dadosParaInserir.push(plano);
        } catch (error) {
          erros.push({
            linha: linhaAtual,
            cpf: '',
            beneficiario: '',
            mensagem: error.message,
          });
        }
      }

      // 4. Inserir dados em lote
      const registrosImportados =
        await this.hapVidaRepository.inserirPlanosLote(dadosParaInserir);

      const dataFim = new Date();
      const duracao = (dataFim.getTime() - dataInicio.getTime()) / 1000;

      this.logger.log(
        `Importação HapVida concluída - ${registrosImportados}/${totalLinhas} registros importados em ${duracao}s`,
        'HapVidaImportacaoService',
      );

      // 5. Limpar arquivo temporário
      try {
        fs.unlinkSync(caminhoArquivo);
      } catch (err) {
        this.logger.warn(
          `Não foi possível deletar arquivo temporário: ${err.message}`,
          'HapVidaImportacaoService',
        );
      }

      return {
        sucesso: true,
        mensagem: 'Importação realizada com sucesso',
        totalRegistros: totalLinhas,
        registrosImportados: registrosImportados,
        registrosComErro: erros.length,
        erros: erros,
        dataImportacao: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Erro na importação HapVida: ${error.message}`,
        error.stack,
        'HapVidaImportacaoService',
      );

      return {
        sucesso: false,
        mensagem: `Erro na importação: ${error.message}`,
        totalRegistros: totalLinhas,
        registrosImportados: 0,
        registrosComErro: totalLinhas,
        dataImportacao: new Date(),
      };
    }
  }

  /**
   * Parsear linha CSV
   * Formato esperado: campos separados por vírgula ou ponto-e-vírgula
   */
  private parsearLinhaCsv(linha: string, numeroLinha: number): HapVidaCsvRow {
    // Detectar separador (vírgula ou ponto-e-vírgula)
    const separador = linha.includes(';') ? ';' : ',';
    const campos = linha.split(separador);

    if (campos.length < 16) {
      throw new Error(
        `Linha ${numeroLinha}: Formato inválido - esperado 16 campos, encontrado ${campos.length}`,
      );
    }

    return {
      Empresa: campos[0]?.trim() || '',
      Unidade: campos[1]?.trim() || '',
      'Nome da Empresa': campos[2]?.trim() || '',
      Credencial: campos[3]?.trim() || '',
      Matricula: campos[4]?.trim() || '',
      CPF: campos[5]?.trim() || '',
      Beneficiario: campos[6]?.trim() || '',
      'Data de Nascimento': campos[7]?.trim() || '',
      'Data de Inclusao': campos[8]?.trim() || '',
      Idade: campos[9]?.trim() || '',
      Plano: campos[10]?.trim() || '',
      AC: campos[11]?.trim() || '',
      Mensalidade: campos[12]?.trim() || '',
      Adicional: campos[13]?.trim() || '',
      Desconto: campos[14]?.trim() || '',
      'Valor Cobrado': campos[15]?.trim() || '',
    };
  }

  /**
   * Transformar dados CSV para formato do banco
   */
  private transformarDadosCsv(
    dados: HapVidaCsvRow,
    mesRef: number,
    anoRef: number,
  ): HapVidaImportData {
    // Converter valores monetários (formato: "1.234,56" -> 1234.56)
    const parseValor = (valor: string): number => {
      if (!valor) return 0;
      return parseFloat(
        valor.replace(/\./g, '').replace(',', '.').replace('R$', '').trim(),
      );
    };

    // Converter data (formato: "DD/MM/YYYY" -> Date)
    const parseData = (data: string): Date => {
      if (!data) return new Date();
      const partes = data.split('/');
      if (partes.length !== 3) return new Date();
      return new Date(
        parseInt(partes[2]),
        parseInt(partes[1]) - 1,
        parseInt(partes[0]),
      );
    };

    return {
      empresa: dados.Empresa,
      unidade: dados.Unidade,
      nomeEmpresa: dados['Nome da Empresa'],
      credencial: dados.Credencial,
      matricula: dados.Matricula,
      cpf: dados.CPF.replace(/\D/g, ''), // Remover caracteres não numéricos
      beneficiario: dados.Beneficiario,
      dataNascimento: parseData(dados['Data de Nascimento']),
      dataInclusao: parseData(dados['Data de Inclusao']),
      idade: parseInt(dados.Idade) || 0,
      plano: dados.Plano,
      ac: dados.AC,
      mensalidade: parseValor(dados.Mensalidade),
      adicional: parseValor(dados.Adicional),
      desconto: parseValor(dados.Desconto),
      valorCobrado: parseValor(dados['Valor Cobrado']),
      hapAno: anoRef,
      hapMes: mesRef,
    };
  }
}
