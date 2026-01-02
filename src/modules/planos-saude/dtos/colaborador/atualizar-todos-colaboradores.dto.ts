import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Min, Max } from 'class-validator';

export class AtualizarTodosColaboradoresDto {
  @ApiProperty({
    description: 'Sigla da empresa',
    example: 'GSV',
  })
  @IsString()
  empresa: string;

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

  @ApiProperty({
    description: 'Status de exportação (S = Sim, N = Não)',
    example: 'N',
    enum: ['S', 'N'],
  })
  @IsString()
  @IsIn(['S', 'N'])
  exporta: 'S' | 'N';
}
