import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RespostaSuccessDto } from '../dtos/resposta.dto';

/**
 * Interceptor global que transforma todas as respostas em formato padronizado.
 *
 * Antes: { dados: [...] }
 * Depois: { sucesso: true, mensagem: '...', dados: [...], timestamp: '...' }
 *
 * IMPORTANTE: Este interceptor NÃO deve ser aplicado em:
 * - Rotas de health check
 * - Swagger/OpenAPI
 * - Arquivos estáticos
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  RespostaSuccessDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RespostaSuccessDto<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // Não aplica interceptor em rotas específicas
    const skipPaths = ['/health', '/api/docs', '/api-json'];
    if (skipPaths.some((skipPath) => path.includes(skipPath))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Se já está no formato esperado, retorna como está
        if (data && typeof data === 'object' && 'sucesso' in data) {
          return data;
        }

        // Transforma resposta em formato padrão
        return new RespostaSuccessDto('Operação realizada com sucesso', data);
      }),
    );
  }
}
