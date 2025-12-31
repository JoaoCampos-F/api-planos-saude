import { Module, Global } from '@nestjs/common';
import { OracleService } from './oracle.service';

/**
 * Módulo global de acesso ao banco de dados Oracle.
 *
 * Sendo um módulo global, o OracleService estará disponível
 * em toda a aplicação sem necessidade de importação explícita.
 */
@Global()
@Module({
  providers: [OracleService],
  exports: [OracleService],
})
export class DatabaseModule {}
