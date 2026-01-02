/**
 * Interface para dados de plano HapVida (formato de importação CSV)
 * Representa um registro temporário antes de ser inserido na tabela nbs.hapvida_plano
 */
export interface HapVidaImportData {
  empresa: string;
  unidade: string;
  nomeEmpresa: string;
  credencial: string;
  matricula: string;
  cpf: string;
  beneficiario: string;
  dataNascimento: Date;
  dataInclusao: Date;
  idade: number;
  plano: string;
  ac: string; // Acomodação
  mensalidade: number;
  adicional: number;
  desconto: number;
  valorCobrado: number;
  hapAno: number;
  hapMes: number;
}

/**
 * Interface para linha do CSV HapVida
 */
export interface HapVidaCsvRow {
  Empresa: string;
  Unidade: string;
  'Nome da Empresa': string;
  Credencial: string;
  Matricula: string;
  CPF: string;
  Beneficiario: string;
  'Data de Nascimento': string;
  'Data de Inclusao': string;
  Idade: string;
  Plano: string;
  AC: string;
  Mensalidade: string;
  Adicional: string;
  Desconto: string;
  'Valor Cobrado': string;
}

/**
 * Interface para resultado da importação HapVida
 */
export interface HapVidaImportResult {
  totalLinhas: number;
  registrosImportados: number;
  registrosComErro: number;
  erros: HapVidaImportError[];
}

/**
 * Interface para erro na importação HapVida
 */
export interface HapVidaImportError {
  linha: number;
  cpf: string;
  beneficiario: string;
  mensagem: string;
}
