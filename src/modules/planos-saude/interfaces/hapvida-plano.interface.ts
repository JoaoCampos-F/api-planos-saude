/**
 * Interface representando planos da HapVida.
 * Mapeia a tabela: nbs.hapvida_plano
 *
 * Dados importados via arquivo CSV fornecido pela HapVida.
 * Processamento e cálculos realizados no banco de dados.
 */
export interface HapVidaPlano {
  /** ID sequencial (chave primária) */
  id: number;

  /** CPF do beneficiário (sem formatação) */
  cpfBeneficiario: string;

  /** Nome completo do beneficiário */
  nomeBeneficiario: string;

  /** Matrícula do beneficiário na HapVida */
  matricula: string;

  /** Código do produto/plano */
  codigoProduto: string;

  /** Nome do produto/plano */
  nomeProduto: string;

  /** Tipo do beneficiário (TITULAR/DEPENDENTE/AGREGADO) */
  tipoBeneficiario: 'TITULAR' | 'DEPENDENTE' | 'AGREGADO';

  /** CPF do titular (caso não seja titular) */
  cpfTitular?: string;

  /** Matrícula do titular */
  matriculaTitular?: string;

  /** Mês de referência (1-12) */
  mesReferencia: number;

  /** Ano de referência */
  anoReferencia: number;

  /** Valor da mensalidade individual */
  valorMensalidade: number;

  /** Valor de co-participação */
  valorCoparticipacao: number;

  /** Valor total (mensalidade + co-participação) */
  valorTotal: number;

  /** Data de vigência inicial */
  dataVigenciaInicio: Date;

  /** Data de vigência final (null = vigente) */
  dataVigenciaFim?: Date;

  /** Status do plano (ATIVO/SUSPENSO/CANCELADO) */
  status: string;

  /** Data de importação do registro */
  dataImportacao: Date;

  /** Usuário que realizou a importação */
  usuarioImportacao: string;

  /** Nome do arquivo CSV de origem */
  arquivoOrigem: string;

  /** Linha do arquivo CSV (para rastreabilidade) */
  linhaArquivo?: number;

  /** Data de última atualização */
  dataAtualizacao?: Date;

  /** Observações */
  observacoes?: string;
}

/**
 * Interface para inserção de dados da HapVida.
 * Omite campos auto-gerenciados.
 */
export type HapVidaPlanoInsert = Omit<HapVidaPlano, 'id' | 'dataImportacao'>;
