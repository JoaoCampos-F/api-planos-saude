/**
 * Interface representando processos do sistema MCW (Workflow).
 * Mapeia a tabela: gc.mcw_processo
 *
 * Representa processos automatizados como importações, exportações,
 * execuções de procedures, geração de relatórios, etc.
 */
export interface ProcessoMCW {
  /** ID sequencial do processo */
  id: number;

  /** Código identificador do tipo de processo */
  codigoProcesso: string;

  /** Descrição do processo */
  descricao: string;

  /** Status atual (AGUARDANDO/PROCESSANDO/CONCLUIDO/ERRO) */
  status: 'AGUARDANDO' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';

  /** Data/hora de criação do processo */
  dataCriacao: Date;

  /** Data/hora de início da execução */
  dataInicio?: Date;

  /** Data/hora de conclusão */
  dataFim?: Date;

  /** Usuário que iniciou o processo */
  usuarioCriacao: string;

  /** Percentual de progresso (0-100) */
  percentualProgresso: number;

  /** Mensagem de status/progresso */
  mensagemStatus?: string;

  /** Mensagem de erro (se status = ERRO) */
  mensagemErro?: string;

  /** Quantidade de registros processados */
  registrosProcessados: number;

  /** Quantidade de registros com erro */
  registrosErro: number;

  /** Quantidade de registros ignorados */
  registrosIgnorados: number;

  /** Parâmetros do processo (JSON serializado) */
  parametros?: string;

  /** Resultado do processo (JSON serializado) */
  resultado?: string;

  /** Logs detalhados (JSON array serializado) */
  logs?: string;

  /** Nome da máquina/servidor que processou */
  nomeServidor?: string;

  /** PID do processo no sistema operacional */
  pidProcesso?: number;
}

/**
 * Interface para criação de novos processos.
 * Omite campos gerenciados automaticamente.
 */
export type ProcessoMCWCreate = Pick<
  ProcessoMCW,
  'codigoProcesso' | 'descricao' | 'usuarioCriacao' | 'parametros'
>;

/**
 * Interface para atualização de status do processo.
 */
export interface ProcessoMCWUpdate {
  status?: ProcessoMCW['status'];
  percentualProgresso?: number;
  mensagemStatus?: string;
  mensagemErro?: string;
  registrosProcessados?: number;
  registrosErro?: number;
  registrosIgnorados?: number;
  dataInicio?: Date;
  dataFim?: Date;
  resultado?: string;
  logs?: string;
}
