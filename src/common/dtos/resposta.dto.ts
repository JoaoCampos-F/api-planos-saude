import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO padrão para respostas de sucesso da API.
 * Garante consistência em todas as respostas.
 */
export class RespostaSuccessDto<T = any> {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  sucesso: boolean;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Operação realizada com sucesso',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Dados retornados pela operação',
    required: false,
  })
  dados?: T;

  @ApiProperty({
    description: 'Timestamp da resposta',
    example: '2024-03-15T14:30:00.000Z',
  })
  timestamp: string;

  constructor(mensagem: string, dados?: T) {
    this.sucesso = true;
    this.mensagem = mensagem;
    this.dados = dados;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * DTO padrão para respostas de erro da API.
 * Garante consistência no tratamento de erros.
 */
export class RespostaErroDto {
  @ApiProperty({
    description: 'Indica que a operação falhou',
    example: false,
  })
  sucesso: boolean;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Erro ao processar requisição',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Código do erro',
    example: 'ERR_INVALID_INPUT',
    required: false,
  })
  codigo?: string;

  @ApiProperty({
    description: 'Detalhes adicionais do erro',
    required: false,
  })
  detalhes?: any;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-03-15T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Path da requisição que gerou o erro',
    example: '/api/v1/planos-saude/colaboradores',
    required: false,
  })
  path?: string;

  constructor(
    mensagem: string,
    codigo?: string,
    detalhes?: any,
    path?: string,
  ) {
    this.sucesso = false;
    this.mensagem = mensagem;
    this.codigo = codigo;
    this.detalhes = detalhes;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
