/**
 * Interface representando dados de cobrança da Unimed.
 * Mapeia a tabela: gc.uni_dados_cobranca
 *
 * Esta tabela armazena os dados brutos recebidos da API da Unimed.
 * Todos os processamentos e cálculos ocorrem no banco via procedures/views.
 */
export interface UnimedDadosCobranca {
  /** ID sequencial (chave primária) */
  id: number;

  /** CPF do beneficiário (sem formatação) */
  cpfBeneficiario: string;

  /** Nome completo do beneficiário */
  nomeBeneficiario: string;

  /** Número do cartão da Unimed */
  numeroCartao: string;

  /** Código do plano contratado */
  codigoPlano: string;

  /** Nome/descrição do plano */
  nomePlano: string;

  /** Tipo do beneficiário (TITULAR/DEPENDENTE) */
  tipoBeneficiario: 'TITULAR' | 'DEPENDENTE';

  /** CPF do titular (caso seja dependente) */
  cpfTitular?: string;

  /** Mês de referência da cobrança (1-12) */
  mesReferencia: number;

  /** Ano de referência da cobrança */
  anoReferencia: number;

  /** Valor da mensalidade */
  valorMensalidade: number;

  /** Valor de co-participação/consumo */
  valorCoparticipacao: number;

  /** Valor total (mensalidade + co-participação) */
  valorTotal: number;

  /** Data de vencimento da fatura */
  dataVencimento: Date;

  /** Status do beneficiário (ATIVO/INATIVO/CANCELADO) */
  status: string;

  /** Data de importação do registro */
  dataImportacao: Date;

  /** Usuário que realizou a importação */
  usuarioImportacao: string;

  /** Data de última atualização */
  dataAtualizacao?: Date;

  /** Observações adicionais */
  observacoes?: string;
}

/**
 * Interface para inserção de dados da Unimed.
 * Omite campos auto-gerenciados pelo banco.
 */
export type UnimedDadosCobrancaInsert = Omit<
  UnimedDadosCobranca,
  'id' | 'dataImportacao'
>;
