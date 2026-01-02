/**
 * Interface para dados de empresa
 * Baseado na tabela gc.empresa
 */
export interface Empresa {
  codigo: number;
  sigla: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  cod_coligada: number;
  cod_filial: number;
  cod_bandeira: number;
  ativo: string;
}

/**
 * Interface para dados de contrato
 * Baseado em dados de contratos vinculados a empresas
 */
export interface Contrato {
  codigo: string;
  descricao: string;
  empresa_sigla: string;
  empresa_codigo: number;
  ativo: string;
}

/**
 * Interface para resumo de empresa com estatísticas
 */
export interface EmpresaResumo extends Empresa {
  total_contratos: number;
  total_colaboradores: number;
}
