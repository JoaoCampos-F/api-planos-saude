/**
 * Interface para dados de cobrança da Unimed (formato da API)
 * Usada para transformação antes de inserir na tabela gc.uni_dados_cobranca
 */
export interface UnimedDadosCobrancaApi {
  // Dados do Contrato
  contrato: string;
  cnpj: string;
  contratante: string;
  nomePlano: string;
  abrangencia: string;
  codFatura: string;
  valorFatura: number;
  periodo: string; // Formato: MM-YYYY

  // Dados do Titular
  codTitular: string;
  titular: string;
  cpfTitular: string;
  matricula: string;
  acomodacao: string;

  // Dados do Beneficiário
  codBeneficiario: string;
  beneficiario: string;
  cpf: string;
  idade: number;
  nascimento: Date;
  inclusao: Date;
  dependencia: 'T' | 'D'; // T=Titular, D=Dependente

  // Valores
  valorCobrado: number;
  descricao: string;

  // Controle
  mesRef: number;
  anoRef: number;
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: string;
  exporta: 'S' | 'N';
  dataImport: Date;
}

/**
 * Interface para resposta da API Unimed (REST)
 */
export interface UnimedApiResponse {
  success: boolean;
  data: UnimedApiDemonstrativo[];
  message?: string;
}

/**
 * Interface para dados de demonstrativo retornados pela API Unimed
 */
export interface UnimedApiDemonstrativo {
  contrato: string;
  cnpj: string;
  contratante: string;
  nomePlano: string;
  abrangencia: string;
  codFatura: string;
  valorFatura: number;
  periodo: string;
  beneficiarios: UnimedApiBeneficiario[];
}

/**
 * Interface para dados de beneficiário da API Unimed
 */
export interface UnimedApiBeneficiario {
  codTitular: string;
  titular: string;
  cpfTitular: string;
  matricula: string;
  acomodacao: string;
  codBeneficiario: string;
  beneficiario: string;
  cpf: string;
  idade: number;
  nascimento: string;
  inclusao: string;
  dependencia: 'T' | 'D';
  valorCobrado: number;
  descricao: string;
}

/**
 * Interface para token de autenticação da Unimed
 */
export interface UnimedAuthToken {
  token: string;
  expiresAt: Date;
  tokenType: string;
}

/**
 * Interface para cache de token no banco
 */
export interface UnimedCachedToken {
  identificador: string;
  token: string;
  dataExpiracao: Date;
  dataGeracao: Date;
}
