import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { UnimedImportacaoService } from '../services/importacao/unimed-importacao.service';
import { HapVidaImportacaoService } from '../services/importacao/hapvida-importacao.service';
import {
  ImportarUnimedPorCnpjDto,
  ImportarUnimedPorContratoDto,
  ImportarHapVidaDto,
  ImportacaoResponseDto,
} from '../dtos';

/**
 * Controller para importação de dados de planos de saúde
 *
 * FILOSOFIA: Endpoints HTTP que chamam services de importação.
 * Mantém a mesma lógica dos controllers PHP do legacy.
 */
@Controller('planos-saude/importacao')
@ApiTags('Importação de Dados')
export class ImportacaoController {
  constructor(
    private readonly unimedImportacaoService: UnimedImportacaoService,
    private readonly hapVidaImportacaoService: HapVidaImportacaoService,
  ) {}

  /**
   * Importar dados da Unimed por CNPJ
   */
  @Post('unimed/cnpj')
  @ApiOperation({
    summary: 'Importar dados da Unimed por CNPJ',
    description:
      'Busca dados na API Unimed Cuiabá e importa para o banco de dados. Replica a lógica do UnimedController.php do legacy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Importação realizada com sucesso',
    type: ImportacaoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno no servidor',
  })
  async importarUnimedPorCnpj(
    @Body() dto: ImportarUnimedPorCnpjDto,
  ): Promise<ImportacaoResponseDto> {
    return await this.unimedImportacaoService.importarPorCnpj(
      dto.cnpj,
      dto.mesRef,
      dto.anoRef,
      dto.codEmpresa,
      dto.codColigada,
      dto.codFilial,
      dto.codBand,
    );
  }

  /**
   * Importar dados da Unimed por Contrato
   */
  @Post('unimed/contrato')
  @ApiOperation({
    summary: 'Importar dados da Unimed por Contrato',
    description:
      'Busca dados na API Unimed Cuiabá e importa para o banco de dados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Importação realizada com sucesso',
    type: ImportacaoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno no servidor',
  })
  async importarUnimedPorContrato(
    @Body() dto: ImportarUnimedPorContratoDto,
  ): Promise<ImportacaoResponseDto> {
    return await this.unimedImportacaoService.importarPorContrato(
      dto.contrato,
      dto.mesRef,
      dto.anoRef,
      dto.codEmpresa,
      dto.codColigada,
      dto.codFilial,
      dto.codBand,
    );
  }

  /**
   * Importar dados da HapVida via arquivo CSV
   */
  @Post('hapvida/csv')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          // Gerar nome único para o arquivo
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `hapvida-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Aceitar apenas arquivos CSV
        if (
          file.mimetype === 'text/csv' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.toLowerCase().endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Apenas arquivos CSV são permitidos (.csv)',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiOperation({
    summary: 'Importar dados da HapVida via CSV',
    description:
      'Upload de arquivo CSV com dados da HapVida. Replica a lógica do HapVidaController.php do legacy.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo CSV com dados da HapVida',
        },
        mesRef: {
          type: 'number',
          description: 'Mês de referência (1-12)',
          example: 12,
        },
        anoRef: {
          type: 'number',
          description: 'Ano de referência',
          example: 2024,
        },
      },
      required: ['arquivo', 'mesRef', 'anoRef'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Importação realizada com sucesso',
    type: ImportacaoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno no servidor',
  })
  async importarHapVidaCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportarHapVidaDto,
  ): Promise<ImportacaoResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }

    return await this.hapVidaImportacaoService.importarArquivoCsv(
      file.path,
      dto.mesRef,
      dto.anoRef,
    );
  }
}
