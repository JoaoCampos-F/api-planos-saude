import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

/**
 * DTO para filtros de mês e ano de referência.
 * Usado em diversos endpoints que precisam filtrar por período.
 */
export class PeriodoReferenciaDto {
  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser no mínimo 1' })
  @Max(12, { message: 'Mês deve ser no máximo 12' })
  mesReferencia: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser no mínimo 2000' })
  @Max(2100, { message: 'Ano deve ser no máximo 2100' })
  anoReferencia: number;
}

/**
 * DTO para filtros opcionais de período.
 * Usado quando o filtro de data é opcional.
 */
export class PeriodoReferenciaOpcionalDto {
  @ApiProperty({
    description: 'Mês de referência (1-12) - opcional',
    example: 3,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser no mínimo 1' })
  @Max(12, { message: 'Mês deve ser no máximo 12' })
  mesReferencia?: number;

  @ApiProperty({
    description: 'Ano de referência - opcional',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano deve ser no mínimo 2000' })
  @Max(2100, { message: 'Ano deve ser no máximo 2100' })
  anoReferencia?: number;
}
