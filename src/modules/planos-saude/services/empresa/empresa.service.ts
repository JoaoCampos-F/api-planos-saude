import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '@/shared/logger/logger.service';
import { EmpresaRepository } from '../../repositories/empresa.repository';
import {
  Empresa,
  Contrato,
  EmpresaResumo,
} from '../../interfaces/empresa.interface';

/**
 * Service para gerenciamento de empresas e contratos
 * Fornece métodos auxiliares para outros módulos
 */
@Injectable()
export class EmpresaService {
  constructor(
    private readonly empresaRepository: EmpresaRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Lista todas as empresas ou filtra
   */
  async listarEmpresas(sigla?: string, ativo?: string): Promise<Empresa[]> {
    this.logger.log(`Listando empresas - sigla: ${sigla}, ativo: ${ativo}`);
    return this.empresaRepository.buscarEmpresas(sigla, ativo);
  }

  /**
   * Busca empresa por sigla
   */
  async buscarEmpresaPorSigla(sigla: string): Promise<Empresa> {
    this.logger.log(`Buscando empresa: ${sigla}`);

    const empresa = await this.empresaRepository.buscarEmpresaPorSigla(sigla);

    if (!empresa) {
      throw new NotFoundException(`Empresa não encontrada: ${sigla}`);
    }

    return empresa;
  }

  /**
   * Busca empresa com estatísticas
   */
  async buscarEmpresaComResumo(sigla: string): Promise<EmpresaResumo> {
    this.logger.log(`Buscando empresa com resumo: ${sigla}`);

    const empresa = await this.empresaRepository.buscarEmpresaComResumo(sigla);

    if (!empresa) {
      throw new NotFoundException(`Empresa não encontrada: ${sigla}`);
    }

    return empresa;
  }

  /**
   * Lista contratos (com filtros opcionais)
   */
  async listarContratos(
    empresaSigla?: string,
    contrato?: string,
  ): Promise<Contrato[]> {
    this.logger.log(
      `Listando contratos - empresa: ${empresaSigla}, contrato: ${contrato}`,
    );
    return this.empresaRepository.buscarContratos(empresaSigla, contrato);
  }

  /**
   * Lista contratos de uma empresa específica
   */
  async listarContratosPorEmpresa(sigla: string): Promise<Contrato[]> {
    this.logger.log(`Listando contratos da empresa: ${sigla}`);

    // Valida se empresa existe
    await this.buscarEmpresaPorSigla(sigla);

    return this.empresaRepository.buscarContratosPorEmpresa(sigla);
  }

  /**
   * Valida se empresa existe e está ativa
   * Usado por outros services
   */
  async validarEmpresa(sigla: string): Promise<boolean> {
    return this.empresaRepository.validarEmpresa(sigla);
  }

  /**
   * Busca códigos internos da empresa (para usar em queries)
   * Método auxiliar usado em outros módulos
   */
  async obterCodigosEmpresa(sigla: string): Promise<{
    codigo: number;
    coligada: number;
    filial: number;
    bandeira: number;
  }> {
    const empresa = await this.buscarEmpresaPorSigla(sigla);

    return {
      codigo: empresa.codigo,
      coligada: empresa.cod_coligada,
      filial: empresa.cod_filial,
      bandeira: empresa.cod_bandeira,
    };
  }
}
