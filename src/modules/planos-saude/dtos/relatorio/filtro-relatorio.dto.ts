import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * DTO para filtros comuns de relatórios
 * Baseado nos parâmetros do legacy UnimedController.php
 */
export class FiltroRelatorioDto {
  @ApiProperty({
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    example: 'GSV',
  })
  @IsString()
  empresa: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2000,
  })
  @IsInt()
  @Min(2000)
  ano: number;

  @ApiProperty({
    description: 'Código do contrato (opcional)',
    required: false,
    example: '12345',
  })
  @IsOptional()
  @IsString()
  contrato?: string;
}
