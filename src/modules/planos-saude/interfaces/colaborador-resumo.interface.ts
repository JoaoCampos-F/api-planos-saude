/**
 * Interface representando o resumo de um colaborador com plano de saúde.
 * Mapeia a view: gc.vw_uni_resumo_colaborador
 *
 * IMPORTANTE: Esta interface apenas define os tipos.
 * Não contém lógica - todos os cálculos estão na view do banco.
 */
export interface ColaboradorResumo {
  /** CPF do colaborador (pode conter zeros à esquerda) */
  codigoCpf: string;

  /** Nome completo do colaborador */
  colaborador: string;

  /** Nome curto/apelido */
  apelido: string;

  /** Código da empresa no sistema */
  codEmpresa: number;

  /** Código da coligada */
  codColigada: number;

  /** Código da filial */
  codFilial: number;

  /** Código da bandeira/operadora */
  codBand: string;

  /** Mês de referência (1-12) */
  mesRef: number;

  /** Ano de referência (ex: 2024) */
  anoRef: number;

  /** Valor da mensalidade do titular (formatado) */
  mTitular: string;

  /** Valor da mensalidade dos dependentes (formatado) */
  mDependente: string;

  /** Valor de consumo/co-participação (formatado) */
  valorConsumo: string;

  /** Percentual pago pela empresa (formatado) */
  percEmpresa: string;

  /** Valor total sem descontos (formatado) */
  valorTotal: string;

  /** Valor líquido a ser descontado (formatado) */
  valorLiquido: string;

  /** Se o colaborador está ativo (S/N) */
  ativo: 'S' | 'N';

  /** Se deve ser exportado para pagamento (S/N) */
  exporta: 'S' | 'N';
}
