/**
 * Tipo de relatório disponível
 */
export enum TipoRelatorio {
  COLABORADOR = 'colaborador',
  EMPRESA = 'empresa',
  PAGAMENTO = 'pagamento',
  CENTRO_CUSTO = 'centro-custo',
}

/**
 * Dados de colaborador para relatório
 * Baseado em vw_uni_resumo_colaborador
 */
export interface DadosRelatorioColaborador {
  nome: string;
  cpf: string;
  contrato: string;
  empresa: string;
  categoria: string;
  valor_titular: number;
  valor_dependente: number;
  qtd_dependentes: number;
  valor_total: number;
  mes_ref: number;
  ano_ref: number;
}

/**
 * Dados de empresa para relatório
 * Resumo por empresa/contrato
 */
export interface DadosRelatorioEmpresa {
  empresa: string;
  contrato: string;
  qtd_colaboradores: number;
  qtd_dependentes: number;
  valor_total_titular: number;
  valor_total_dependente: number;
  valor_total: number;
  mes_ref: number;
  ano_ref: number;
}

/**
 * Dados de pagamento para relatório
 * Baseado em dados de colaboradores com flag de exportação
 */
export interface DadosRelatorioPagamento {
  nome: string;
  cpf: string;
  empresa: string;
  contrato: string;
  valor_total: number;
  exportado: string;
  mes_ref: number;
  ano_ref: number;
}

/**
 * Dados de centro de custo para relatório
 * Agrupamento por departamento
 */
export interface DadosRelatorioCentroCusto {
  centro_custo: string;
  descricao: string;
  empresa: string;
  qtd_colaboradores: number;
  valor_total: number;
  mes_ref: number;
  ano_ref: number;
}

/**
 * Parâmetros para geração de relatório
 */
export interface ParametrosRelatorio {
  tipo: TipoRelatorio;
  empresa: string;
  mes: number;
  ano: number;
  contrato?: string;
  codEmpresa?: number;
  codColigada?: number;
  codFilial?: number;
  codBand?: number;
}
