import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, Max } from 'class-validator';

/**
 * DTO para paginação de resultados.
 * Padrão utilizado em todos os endpoints que retornam listas.
 */
export class PaginacaoDto {
  @ApiProperty({
    description: 'Número da página (começa em 1)',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  pagina?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 50,
    minimum: 1,
    maximum: 500,
    required: false,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tamanho deve ser um número inteiro' })
  @Min(1, { message: 'Tamanho deve ser no mínimo 1' })
  @Max(500, { message: 'Tamanho deve ser no máximo 500' })
  tamanho?: number = 50;
}

/**
 * Interface genérica para resposta paginada.
 * Usado como wrapper para qualquer lista de dados.
 */
export interface RespostaPaginada<T> {
  /** Dados da página atual */
  dados: T[];
  
  /** Metadados de paginação */
  paginacao: {
    /** Página atual */
    paginaAtual: number;
    
    /** Quantidade de itens por página */
    tamanhoPagina: number;
    
    /** Total de itens (todas as páginas) */
    totalItens: number;
    
    /** Total de páginas */
    totalPaginas: number;
    
    /** Indica se existe página anterior */
    temPaginaAnterior: boolean;
    
    /** Indica se existe próxima página */
    temProximaPagina: boolean;
  };
}
