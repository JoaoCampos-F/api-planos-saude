import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max } from 'class-validator';

export class HistoricoProcessoDto {
  @ApiProperty({
    description: 'Categoria do processo',
    example: 'UNI',
  })
  @IsString()
  categoria: string;

  @ApiProperty({
    description: 'Código do processo',
    example: '70000001',
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
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
}
