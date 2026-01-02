import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class BuscarColaboradorDto {
  @ApiPropertyOptional({
    description: 'Sigla da empresa',
    example: 'GSV',
  })
  @IsOptional()
  @IsString()
  empresa?: string;

  @ApiPropertyOptional({
    description: 'Código do contrato',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  contrato?: string;

  @ApiPropertyOptional({
    description: 'CPF do colaborador',
    example: '12345678900',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Mês de referência (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiPropertyOptional({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2000,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  ano?: number;
}
