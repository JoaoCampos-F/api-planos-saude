import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { ColaboradorRepository } from '../../repositories/colaborador.repository';
import { EmpresaService } from '../empresa/empresa.service';
import {
  BuscarColaboradorDto,
  AtualizarColaboradorDto,
  AtualizarTodosColaboradoresDto,
} from '../../dtos/colaborador';
import { ColaboradorResumo } from '../../interfaces';

/**
 * Service para gestão de colaboradores
 *
 * FILOSOFIA: "Same logic, modern technology"
 * - Replicar exatamente a lógica do UnimedController.php
 * - Adicionar validações, logs estruturados e tratamento de erros
 * - NÃO alterar regras de negócio
 */
@Injectable()
export class ColaboradorService {
  constructor(
    private readonly colaboradorRepository: ColaboradorRepository,
    private readonly empresaService: EmpresaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.log('ColaboradorService inicializado', 'ColaboradorService');
  }

  /**
   * Buscar colaboradores com filtros
   * Replica: UnimedController.php -> case 'Buscar'
   */
  async buscar(filtros: BuscarColaboradorDto): Promise<ColaboradorResumo[]> {
    this.logger.log(
      `Buscando colaboradores: ${JSON.stringify(filtros)}`,
      'ColaboradorService',
    );

    const colaboradores = await this.colaboradorRepository.buscar(filtros);

    this.logger.log(
      `Encontrados ${colaboradores.length} colaboradores`,
      'ColaboradorService',
    );

    return colaboradores;
  }

  /**
   * Atualizar status de exportação de um colaborador
   * Replica: UnimedController.php -> case 'update'
   */
  async atualizarExportacao(
    dados: AtualizarColaboradorDto,
  ): Promise<{ mensagem: string }> {
    this.logger.log(
      `Atualizando exportação: CPF=${dados.cpf}, Período=${dados.mes}/${dados.ano}, Exporta=${dados.exporta}`,
      'ColaboradorService',
    );

    await this.colaboradorRepository.atualizarExportacao(
      dados.cpf,
      dados.mes,
      dados.ano,
      dados.exporta,
    );

    const mensagem =
      dados.exporta === 'S'
        ? `O valor da Unimed referente ao mês ${dados.mes} foi readicionado ao colaborador`
        : `O valor da Unimed referente ao mês ${dados.mes} não será enviado`;

    this.logger.log(mensagem, 'ColaboradorService');

    return { mensagem };
  }

  /**
   * Atualizar status de exportação de todos colaboradores de uma empresa
   * Replica: UnimedController.php -> case 'updateTodosColaborador'
   */
  async atualizarExportacaoTodos(
    dados: AtualizarTodosColaboradoresDto,
  ): Promise<{ mensagem: string }> {
    this.logger.log(
      `Atualizando exportação em lote: Empresa=${dados.empresa}, Período=${dados.mes}/${dados.ano}, Exporta=${dados.exporta}`,
      'ColaboradorService',
    );

    // Buscar códigos da empresa
    const { codigo, coligada, filial } =
      await this.empresaService.obterCodigosEmpresa(dados.empresa);

    await this.colaboradorRepository.atualizarExportacaoTodos(
      codigo,
      coligada,
      filial,
      dados.mes,
      dados.ano,
      dados.exporta,
    );

    return {
      mensagem: 'Todos os colaboradores foram atualizados com sucesso',
    };
  }

  /**
   * Atualizar valor pago pela empresa
   * Replica: UnimedController.php -> case 'updateValor'
   */
  async atualizarValorEmpresa(
    empresa: string,
    valor: number,
  ): Promise<{ mensagem: string }> {
    this.logger.log(
      `Atualizando valor empresa: Empresa=${empresa}, Valor=${valor}`,
      'ColaboradorService',
    );

    // Buscar códigos da empresa
    const { codigo, coligada, filial } =
      await this.empresaService.obterCodigosEmpresa(empresa);

    await this.colaboradorRepository.atualizarValorEmpresa(
      codigo,
      coligada,
      filial,
      valor,
    );

    return {
      mensagem: `Valor da empresa ${empresa} atualizado para R$ ${valor}`,
    };
  }
}
