import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RespostaErroDto } from '../dtos/resposta.dto';
import { LoggerService } from '../../shared/logger/logger.service';

/**
 * Filtro global de exceções.
 * Captura todas as exceções e formata em resposta padronizada.
 * 
 * Trata:
 * - HttpException (erros do NestJS)
 * - Erros do Oracle (via OracleService)
 * - Erros genéricos (erros não tratados)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensagem = 'Erro interno do servidor';
    let codigo = 'ERR_INTERNAL_SERVER_ERROR';
    let detalhes: any = null;

    // Trata HttpException (erros do NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        mensagem = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        mensagem = responseObj.message || responseObj.error || mensagem;
        codigo = responseObj.error || codigo;
        detalhes = responseObj.details || null;

        // Erros de validação (class-validator)
        if (Array.isArray(responseObj.message)) {
          mensagem = 'Erro de validação';
          detalhes = responseObj.message;
        }
      }
    }
    // Trata erros genéricos
    else if (exception instanceof Error) {
      mensagem = exception.message;
      detalhes = {
        stack: process.env.APP_ENV === 'development' ? exception.stack : undefined,
      };
    }

    // Loga erro
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${mensagem}`,
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter',
    );

    // Retorna resposta formatada
    const errorResponse = new RespostaErroDto(
      mensagem,
      codigo,
      detalhes,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
