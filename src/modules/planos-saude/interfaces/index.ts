/**
 * Exportação centralizada de todas as interfaces do módulo de Planos de Saúde.
 *
 * IMPORTANTE: Estas interfaces apenas definem tipos TypeScript.
 * Toda a lógica de negócio está no banco de dados Oracle (procedures, views, triggers).
 */

export * from './colaborador-resumo.interface';
export * from './unimed-dados-cobranca.interface';
export * from './hapvida-plano.interface';
export * from './processo-mcw.interface';

// Interfaces específicas para integração API
export * from './unimed.interface';
export * from './hapvida.interface';
