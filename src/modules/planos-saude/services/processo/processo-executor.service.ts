import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { ProcessoRepository } from '../../repositories/processo.repository';
import { ProcessoValidadorService } from './processo-validador.service';
import {
  ExecutarProcessoDto,
  BuscarProcessoDto,
  HistoricoProcessoDto,
} from '../../dtos/processo';
import { ProcessoMCW } from '../../interfaces';

/**
 * Service para execução de processos MCW
 *
 * FILOSOFIA: "Same logic, modern technology"
 * - Replicar exatamente a lógica do UnimedController.php -> case 'Execute'
 * - Validar prazos antes de executar
 * - Executar stored procedures Oracle
 * - Registrar logs de execução
 */
@Injectable()
export class ProcessoExecutorService {
  constructor(
    private readonly processoRepository: ProcessoRepository,
    private readonly processoValidador: ProcessoValidadorService,
    private readonly logger: LoggerService,
  ) {
    this.logger.log(
      'ProcessoExecutorService inicializado',
      'ProcessoExecutorService',
    );
  }

  /**
   * Buscar processos MCW disponíveis
   * Replica: UnimedController.php -> case 'Buscarprocesso'
   */
  async buscarProcessos(filtros: BuscarProcessoDto): Promise<ProcessoMCW[]> {
    this.logger.log(
      `Buscando processos: ${JSON.stringify(filtros)}`,
      'ProcessoExecutorService',
    );

    // Validar se período existe
    if (filtros.mes && filtros.ano) {
      const validacao = await this.processoValidador.validarPeriodoExiste(
        filtros.mes,
        filtros.ano,
      );

      if (!validacao.existe) {
        throw new BadRequestException(validacao.mensagem);
      }
    }

    const processos = await this.processoRepository.buscarProcessos(filtros);

    this.logger.log(
      `Encontrados ${processos.length} processos`,
      'ProcessoExecutorService',
    );

    return processos;
  }

  /**
   * Buscar histórico de execução de um processo
   * Replica: UnimedController.php -> case 'HistoricoProcesso'
   */
  async buscarHistorico(filtros: HistoricoProcessoDto): Promise<any[]> {
    this.logger.log(
      `Buscando histórico: ${JSON.stringify(filtros)}`,
      'ProcessoExecutorService',
    );

    const historico = await this.processoRepository.buscarHistorico(filtros);

    this.logger.log(
      `Encontrados ${historico.length} registros de histórico`,
      'ProcessoExecutorService',
    );

    return historico;
  }

  /**
   * Executar processos MCW
   * Replica: UnimedController.php -> case 'Execute'
   */
  async executar(
    dados: ExecutarProcessoDto,
    usuario: string = 'SYSTEM',
    temPermissaoEspecial: boolean = false,
  ): Promise<{ sucesso: string[]; erros: { codigo: string; erro: string }[] }> {
    this.logger.log(
      `Iniciando execução de processos: ${dados.processos.join(', ')}`,
      'ProcessoExecutorService',
    );

    // Validações iniciais
    this.validarDadosExecucao(dados);

    // Validar prazos de todos os processos
    const validacaoPrazos = await this.processoValidador.validarPrazos(
      dados.processos,
      dados.mes,
      dados.ano,
      temPermissaoEspecial,
    );

    // Se há processos inválidos e não tem permissão especial, lançar erro
    if (validacaoPrazos.invalidos.length > 0 && !temPermissaoEspecial) {
      const mensagens = validacaoPrazos.invalidos
        .map((inv) => `${inv.codigo}: ${inv.mensagem}`)
        .join('\n');
      throw new BadRequestException(`Processos fora do prazo:\n${mensagens}`);
    }

    // Determinar parâmetros de execução
    const todasEmpresas = !dados.empresa || dados.empresa === 'T' ? 'S' : 'N';
    const codEmpresa =
      dados.empresa && dados.empresa !== 'T' ? dados.empresa : '';
    const codBand =
      dados.codBand || (todasEmpresas === 'S' ? dados.codBand || '' : '');
    const cpf = dados.cpf || '';

    // Validar CPF sem empresa
    if (cpf && todasEmpresas === 'S') {
      throw new BadRequestException(
        'Necessário informar empresa para processar CPF específico',
      );
    }

    // Executar cada processo
    const sucesso: string[] = [];
    const erros: { codigo: string; erro: string }[] = [];

    for (const codigoProcesso of dados.processos) {
      try {
        // Buscar informações do processo
        const processo =
          await this.processoRepository.buscarProcessoPorCodigo(codigoProcesso);

        if (!processo) {
          erros.push({
            codigo: codigoProcesso,
            erro: 'Processo não encontrado',
          });
          continue;
        }

        this.logger.log(
          `Executando: ${processo.DESCRICAO} (${codigoProcesso})`,
          'ProcessoExecutorService',
        );

        // Executar stored procedure
        await this.processoRepository.executarProcedure({
          codigo: codigoProcesso,
          mes: dados.mes,
          ano: dados.ano,
          previa: dados.previa || 'N',
          apagar: dados.apagar || 'N',
          usuario,
          todasEmpresas,
          codEmpresa,
          codBand,
          tipoDado: dados.tipoDado,
          categoria: dados.categoria,
          cpf,
        });

        sucesso.push(codigoProcesso);
        this.logger.log(
          `Processo ${codigoProcesso} executado com sucesso`,
          'ProcessoExecutorService',
        );
      } catch (error) {
        this.logger.error(
          `Erro ao executar processo ${codigoProcesso}: ${error.message}`,
          error.stack,
          'ProcessoExecutorService',
        );

        erros.push({
          codigo: codigoProcesso,
          erro: error.message,
        });
      }
    }

    const mensagemFinal = `Execução concluída: ${sucesso.length} sucesso(s), ${erros.length} erro(s)`;
    this.logger.log(mensagemFinal, 'ProcessoExecutorService');

    return { sucesso, erros };
  }

  /**
   * Validar dados de execução
   */
  private validarDadosExecucao(dados: ExecutarProcessoDto): void {
    if (!dados.processos || dados.processos.length === 0) {
      throw new BadRequestException(
        'Necessário informar ao menos um processo para executar',
      );
    }

    if (!dados.mes || dados.mes < 1 || dados.mes > 12) {
      throw new BadRequestException('Mês inválido (1-12)');
    }

    if (!dados.ano || dados.ano < 2000) {
      throw new BadRequestException('Ano inválido (>= 2000)');
    }

    if (!dados.categoria) {
      throw new BadRequestException('Categoria é obrigatória');
    }

    if (!dados.tipoDado) {
      throw new BadRequestException('Tipo de dado é obrigatório');
    }

    // Validar apagar = 'S' apenas com processos específicos
    if (dados.apagar === 'S' && dados.processos.length === 0) {
      throw new BadRequestException(
        'Necessário informar processos para apagar dados',
      );
    }
  }
}
