import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta para importação de dados
 */
export class ImportacaoResponseDto {
  @ApiProperty({
    description: 'Indica se a importação foi realizada com sucesso',
    example: true,
  })
  sucesso: boolean;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Importação realizada com sucesso',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Total de registros processados',
    example: 150,
  })
  totalRegistros: number;

  @ApiProperty({
    description: 'Total de registros importados com sucesso',
    example: 145,
  })
  registrosImportados: number;

  @ApiProperty({
    description: 'Total de registros com erro',
    example: 5,
  })
  registrosComErro: number;

  @ApiProperty({
    description: 'Detalhes dos erros encontrados',
    example: [
      {
        linha: 10,
        cpf: '12345678900',
        mensagem: 'CPF inválido',
      },
    ],
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        linha: { type: 'number' },
        cpf: { type: 'string' },
        mensagem: { type: 'string' },
      },
    },
  })
  erros?: Array<{
    linha: number;
    cpf: string;
    mensagem: string;
  }>;

  @ApiProperty({
    description: 'Data e hora da importação',
    example: '2024-12-31T10:30:00.000Z',
  })
  dataImportacao: Date;
}

/**
 * DTO de resposta para busca de token Unimed
 */
export class UnimedTokenResponseDto {
  @ApiProperty({
    description: 'Token de autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Data de expiração do token',
    example: '2024-12-31T23:59:59.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Indica se o token veio do cache',
    example: false,
  })
  fromCache: boolean;
}
