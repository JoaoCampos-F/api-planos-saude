import { Module } from '@nestjs/common';
import { ImportacaoController } from './importacao.controller';

@Module({
  imports: [],
  controllers: [ImportacaoController],
  providers: [],
})
export class ImportacaoModule {}
