import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

/**
 * DTO para importação de arquivo HapVida
 * O arquivo é enviado via multipart/form-data
 */
export class ImportarHapVidaDto {
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

  // O arquivo será recebido através do @UploadedFile() decorator do NestJS
  // Não precisa ser validado aqui
}
