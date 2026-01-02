import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max } from 'class-validator';

/**
 * DTO para importação de dados da Unimed por CNPJ
 */
export class ImportarUnimedPorCnpjDto {
  @ApiProperty({
    description: 'CNPJ da empresa (apenas números)',
    example: '12345678000190',
    minLength: 14,
    maxLength: 14,
  })
  @IsString()
  cnpj: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  mesRef: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2000,
  })
  @IsInt()
  @Min(2000)
  anoRef: number;

  @ApiProperty({
    description: 'Código da empresa no sistema',
    example: 1,
  })
  @IsInt()
  codEmpresa: number;

  @ApiProperty({
    description: 'Código da coligada',
    example: 1,
  })
  @IsInt()
  codColigada: number;

  @ApiProperty({
    description: 'Código da filial',
    example: 1,
  })
  @IsInt()
  codFilial: number;

  @ApiProperty({
    description: 'Código da bandeira/operadora',
    example: 'UNIMED',
  })
  @IsString()
  codBand: string;
}

/**
 * DTO para importação de dados da Unimed por Contrato
 */
export class ImportarUnimedPorContratoDto {
  @ApiProperty({
    description: 'Número do contrato',
    example: '123456',
  })
  @IsString()
  contrato: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  mesRef: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2000,
  })
  @IsInt()
  @Min(2000)
  anoRef: number;

  @ApiProperty({
    description: 'Código da empresa no sistema',
    example: 1,
  })
  @IsInt()
  codEmpresa: number;

  @ApiProperty({
    description: 'Código da coligada',
    example: 1,
  })
  @IsInt()
  codColigada: number;

  @ApiProperty({
    description: 'Código da filial',
    example: 1,
  })
  @IsInt()
  codFilial: number;

  @ApiProperty({
    description: 'Código da bandeira/operadora',
    example: 'UNIMED',
  })
  @IsString()
  codBand: string;
}
