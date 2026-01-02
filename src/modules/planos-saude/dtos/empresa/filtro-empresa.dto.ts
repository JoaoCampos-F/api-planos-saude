import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para filtrar empresas
 */
export class FiltroEmpresaDto {
  @ApiProperty({
    description: 'Sigla da empresa (GSV, GAB, GPS, etc)',
    required: false,
    example: 'GSV',
  })
  @IsOptional()
  @IsString()
  sigla?: string;

  @ApiProperty({
    description: 'Status ativo (S/N)',
    required: false,
    example: 'S',
  })
  @IsOptional()
  @IsString()
  ativo?: string;
}

/**
 * DTO para filtrar contratos
 */
export class FiltroContratoDto {
  @ApiProperty({
    description: 'Sigla da empresa',
    required: false,
    example: 'GSV',
  })
  @IsOptional()
  @IsString()
  empresa?: string;

  @ApiProperty({
    description: 'Código do contrato',
    required: false,
    example: '12345',
  })
  @IsOptional()
  @IsString()
  contrato?: string;
}
