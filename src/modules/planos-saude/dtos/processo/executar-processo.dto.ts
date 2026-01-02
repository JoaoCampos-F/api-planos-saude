import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsIn,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class ExecutarProcessoDto {
  @ApiProperty({
    description: 'Categoria do processo',
    example: 'UNI',
  })
  @IsString()
  categoria: string;

  @ApiProperty({
    description: 'Tipo de dado',
    example: 'U',
  })
  @IsString()
  tipoDado: string;

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
    description: 'Lista de códigos de processos a executar',
    example: ['70000001', '70000002'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  processos: string[];

  @ApiPropertyOptional({
    description: 'Apagar dados anteriores (S/N)',
    example: 'N',
    enum: ['S', 'N'],
    default: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['S', 'N'])
  apagar?: 'S' | 'N';

  @ApiPropertyOptional({
    description: 'Gerar prévia (S/N)',
    example: 'N',
    enum: ['S', 'N'],
    default: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['S', 'N'])
  previa?: 'S' | 'N';

  @ApiPropertyOptional({
    description: 'Código da bandeira (operadora)',
    example: 'UNIMED',
  })
  @IsOptional()
  @IsString()
  codBand?: string;

  @ApiPropertyOptional({
    description: 'Sigla da empresa (T = Todas)',
    example: 'GSV',
  })
  @IsOptional()
  @IsString()
  empresa?: string;

  @ApiPropertyOptional({
    description: 'CPF do colaborador (para processar apenas um)',
    example: '12345678900',
  })
  @IsOptional()
  @IsString()
  cpf?: string;
}
