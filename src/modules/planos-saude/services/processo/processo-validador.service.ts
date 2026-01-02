import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { ProcessoRepository } from '../../repositories/processo.repository';

/**
 * Service para validação de processos MCW
 *
 * FILOSOFIA: "Same logic, modern technology"
 * - Validar prazos de execução
 * - Validar período de fechamento
 * - Validar permissões (será implementado posteriormente)
 */
@Injectable()
export class ProcessoValidadorService {
  constructor(
    private readonly processoRepository: ProcessoRepository,
    private readonly logger: LoggerService,
  ) {
    this.logger.log(
      'ProcessoValidadorService inicializado',
      'ProcessoValidadorService',
    );
  }

  /**
   * Validar se o período está dentro do prazo permitido
   * Replica: UnimedDAO.php -> processarUnimed() -> validação de prazos
   *
   * @param codigo - Código do processo
   * @param mes - Mês de referência
   * @param ano - Ano de referência
   * @param temPermissaoEspecial - Se usuário tem permissão para processar fora do prazo
   */
  async validarPrazo(
    codigo: string,
    mes: number,
    ano: number,
    temPermissaoEspecial: boolean = false,
  ): Promise<{ valido: boolean; mensagem?: string }> {
    // Se mês/ano não é o atual, permitir sempre (dados históricos)
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();

    if (ano !== anoAtual || mes !== mesAtual) {
      this.logger.log(
        `Período ${mes}/${ano} é histórico, validação de prazo ignorada`,
        'ProcessoValidadorService',
      );
      return { valido: true };
    }

    // Buscar período de fechamento
    const periodo = await this.processoRepository.buscarPeriodoFechamento(
      mes,
      ano,
    );

    if (!periodo) {
      throw new BadRequestException(
        `Período de fechamento não encontrado para ${mes}/${ano}`,
      );
    }

    // Buscar informações do processo (dias de prazo)
    const processo =
      await this.processoRepository.buscarProcessoPorCodigo(codigo);

    if (!processo) {
      throw new BadRequestException(`Processo ${codigo} não encontrado`);
    }

    // Calcular data limite (data_final + dias)
    const dataFinal = new Date(periodo.DATA_FINAL);
    const dataLimite = new Date(dataFinal);
    dataLimite.setDate(dataLimite.getDate() + parseInt(processo.DIAS));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataLimite.setHours(0, 0, 0, 0);

    // Se está dentro do prazo OU tem permissão especial, permitir
    if (hoje <= dataLimite || temPermissaoEspecial) {
      this.logger.log(
        `Prazo válido: Processo=${codigo}, Limite=${dataLimite.toISOString().split('T')[0]}`,
        'ProcessoValidadorService',
      );
      return { valido: true };
    }

    // Fora do prazo
    const mensagem = `Processo "${processo.DESCRICAO}" passou da data limite de execução. Data máxima: ${dataLimite.toLocaleDateString('pt-BR')}. Necessário permissão especial para processar fora do prazo.`;

    this.logger.warn(mensagem, 'ProcessoValidadorService');

    return { valido: false, mensagem };
  }

  /**
   * Validar múltiplos processos
   */
  async validarPrazos(
    codigos: string[],
    mes: number,
    ano: number,
    temPermissaoEspecial: boolean = false,
  ): Promise<{
    validos: string[];
    invalidos: { codigo: string; mensagem: string }[];
  }> {
    const validos: string[] = [];
    const invalidos: { codigo: string; mensagem: string }[] = [];

    for (const codigo of codigos) {
      const resultado = await this.validarPrazo(
        codigo,
        mes,
        ano,
        temPermissaoEspecial,
      );

      if (resultado.valido) {
        validos.push(codigo);
      } else {
        invalidos.push({
          codigo,
          mensagem: resultado.mensagem || 'Prazo expirado',
        });
      }
    }

    return { validos, invalidos };
  }

  /**
   * Validar se período de fechamento existe
   */
  async validarPeriodoExiste(
    mes: number,
    ano: number,
  ): Promise<{ existe: boolean; mensagem?: string }> {
    const periodo = await this.processoRepository.buscarPeriodoFechamento(
      mes,
      ano,
    );

    if (!periodo) {
      return {
        existe: false,
        mensagem: `Período de fechamento não cadastrado para ${mes}/${ano}`,
      };
    }

    return { existe: true };
  }
}
