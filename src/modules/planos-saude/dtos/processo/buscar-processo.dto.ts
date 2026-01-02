import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class BuscarProcessoDto {
  @ApiProperty({
    description: 'Categoria do processo (sempre UNI para planos de saúde)',
    example: 'UNI',
  })
  @IsString()
  categoria: string;

  @ApiProperty({
    description: 'Tipo de dado (U = Unimed)',
    example: 'U',
  })
  @IsString()
  tipoDado: string;

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
