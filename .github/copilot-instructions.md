# GitHub Copilot Instructions - API Planos de Saúde

## Project Philosophy

**"Same logic, modern technology"** - This is a modernization of a legacy PHP system (npd-legacy) to NestJS + TypeScript, maintaining **exactly the same business logic**.

### Critical Rules

- ✅ Business logic lives in Oracle Database (procedures, views, triggers)
- ✅ Application is just a modern access layer - NO business logic in code
- ✅ NEVER modify existing stored procedures, views, or database schema
- ✅ Transparently call database procedures via `OracleService` - any developer should see we're just calling the DB

## Architecture Overview

### Tech Stack

- **NestJS 11** (enterprise Node.js framework)
- **TypeScript** with strict typing
- **Oracle Database** via `node-oracledb` 6.10 (NO ORM - direct driver)
- **pnpm** for package management
- **Swagger/OpenAPI** for auto-generated docs
- **class-validator** for DTO validation

### Project Structure

```
src/
├── common/          # Shared DTOs, filters, interceptors
├── config/          # Environment-based configs (app, database, integrations)
├── modules/         # Business modules (importacao, exportacao, planos-saude)
├── shared/          # Global services (database, logger, cache)
└── main.ts          # Bootstrap with Swagger, CORS, ValidationPipe
```

### Layered Architecture

```
Controller → Service → OracleService → Oracle Database
   ↓           ↓            ↓              ↓
Routes    Orchestration  Thin Queries  Business Logic
Swagger   Validation     Simple SQL    Procedures/Views
DTOs      Logging                      Triggers
```

## Code Patterns

### Database Access - The Core Pattern

**Always use `OracleService` for database operations:**

```typescript
// ✅ GOOD - Transparent database call
async getResumoColaborador(mes: number, ano: number) {
  return this.oracleService.query<ColaboradorResumo>(
    'SELECT * FROM gc.vw_uni_resumo_colaborador WHERE mes_ref = :mes AND ano_ref = :ano',
    { mes, ano }
  );
}

// ✅ GOOD - Calling stored procedure
async executarResumo(mes: number, ano: number) {
  await this.oracleService.callProcedure(
    'gc.PKG_UNI_SAUDE.p_uni_resumo',
    { p_mes: mes, p_ano: ano }
  );
}

// ❌ BAD - Business logic in code
async calcularValorLiquido(titular, dependentes) {
  return titular + (dependentes * 0.5); // NO! This belongs in database
}
```

### Response Format

All responses are automatically wrapped by `TransformResponseInterceptor`:

```typescript
// Controller returns simple data
return { dados: colaboradores };

// Client receives standardized format
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso",
  "dados": [...],
  "timestamp": "2026-01-02T10:30:00.000Z"
}
```

### Error Handling

`AllExceptionsFilter` catches all exceptions and formats them:

```typescript
{
  "sucesso": false,
  "mensagem": "Erro ao processar requisição",
  "codigo": "ERR_INVALID_INPUT",
  "detalhes": [...],
  "timestamp": "...",
  "caminho": "/api/v1/planos-saude/colaboradores"
}
```

### DTOs and Validation

Use `class-validator` decorators with Swagger annotations:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class FiltroMesAnoDto {
  @ApiProperty({ description: 'Mês de referência', example: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({ description: 'Ano de referência', example: 2024 })
  @IsInt()
  @Min(2000)
  ano: number;
}
```

### Module Organization

Follow NestJS module pattern:

```
modules/example/
├── example.module.ts       # Module definition
├── example.controller.ts   # HTTP routes
├── dtos/
│   ├── index.ts            # Barrel export
│   └── *.dto.ts            # Request/response DTOs
├── services/
│   └── example.service.ts  # Business orchestration
└── interfaces/
    └── *.interface.ts      # TypeScript types
```

## Development Workflow

### Running the Application

```bash
# Development with hot reload
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod

# Linting & formatting
pnpm run lint
pnpm run format
```

### Environment Configuration

All configs are in [src/config](src/config):

- `app.config.ts` - Port, logging, uploads
- `database.config.ts` - Oracle connection pools (schemas: gc, nbs)
- `integrations.config.ts` - External APIs (Unimed REST/SOAP)

Environment variables are loaded via `@nestjs/config` from `.env`:

```env
ORACLE_USER=your_user
ORACLE_PASSWORD=your_pass
ORACLE_CONNECT_STRING=localhost:1521/ORCL
ORACLE_SCHEMA_GC=gc
ORACLE_SCHEMA_NBS=nbs
```

### Testing

Tests are configured with Jest. Run:

```bash
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm test:cov       # Coverage report
```

### API Documentation

Swagger is auto-configured at bootstrap ([main.ts](src/main.ts)):

- **Docs**: http://localhost:3000/api/docs
- **JSON**: http://localhost:3000/api-json

All controllers should use Swagger decorators:

```typescript
@ApiTags('Importação')
@ApiOperation({ summary: 'Importar dados da Unimed' })
@ApiResponse({ status: 200, description: 'Dados importados com sucesso' })
```

## Key Services

### OracleService ([src/shared/database/oracle.service.ts](src/shared/database/oracle.service.ts))

**The heart of the application** - all database interactions go through here:

```typescript
// Query with results
await oracleService.query<T>(sql, params);

// Single result or null
await oracleService.queryOne<T>(sql, params);

// Execute INSERT/UPDATE/DELETE
await oracleService.execute(sql, params);

// Call stored procedure
await oracleService.callProcedure(name, params, outParams);

// Execute in transaction
await oracleService.executeTransaction(async (connection) => {
  // Multiple operations
});
```

### LoggerService ([src/shared/logger/logger.service.ts](src/shared/logger/logger.service.ts))

Centralized logging with consistent format:

```typescript
this.logger.log('Operation started', 'ContextName');
this.logger.error('Operation failed', stackTrace, 'ContextName');
this.logger.warn('Unusual behavior detected');
this.logger.debug('Detailed info for debugging');
```

## Integration Points

### Unimed Cuiabá

- **REST API** (preferred): `https://ws.unimedcuiaba.coop.br/api`
  - Bearer token authentication
  - Endpoints: `/Token/geratoken`, `/Demonstrativo/buscaporperiodo*`
- **SOAP API** (legacy fallback): WSDL-based service

### HapVida

- CSV file import via uploads to `uploads/` directory
- Parsing and validation handled in importacao module

### TOTVS

- Export processed data for payroll system
- Format defined in exportacao module

## ESLint Rules

Modern flat config ([eslint.config.mjs](eslint.config.mjs)):

- TypeScript + Prettier integration
- `@typescript-eslint/no-explicit-any`: off (Oracle results are untyped)
- `prettier/prettier`: enforced with `endOfLine: auto` for cross-platform

## TypeScript Configuration

[tsconfig.json](tsconfig.json) uses Node.js ESM features:

- `"module": "nodenext"` and `"moduleResolution": "nodenext"`
- `"noImplicitAny": false` (Oracle dynamic results)
- Decorators enabled for NestJS

## Common Pitfalls

1. **Don't add business logic in services** - it belongs in Oracle procedures
2. **Always type Oracle query results** - use interfaces from `modules/*/interfaces/`
3. **Never commit `.env`** - use `.env.example` as template
4. **Always use named parameters** in Oracle queries (`:paramName`)
5. **Check connection pool health** - OracleService manages pools automatically
6. **Skip interceptor for health/swagger routes** - see TransformResponseInterceptor

## Related Projects

- **npd-legacy/** - Original PHP codebase (reference only, DO NOT modify)
- [FASE-1-COMPLETA.md](FASE-1-COMPLETA.md) - Infrastructure completion status
- [docs/PLANO-IMPLEMENTACAO-MODULO-UNI.md](docs/PLANO-IMPLEMENTACAO-MODULO-UNI.md) - Full implementation plan

## Next Steps for AI Agents

When adding new features:

1. Check if stored procedure exists in Oracle first
2. Create DTO in `dtos/` with validation and Swagger decorators
3. Add method in Service that calls OracleService
4. Create Controller endpoint with proper HTTP method
5. Update Swagger tags and documentation
6. Test via Swagger UI at `/api/docs`

**Remember**: This is a thin API layer over Oracle. Keep it simple, transparent, and maintainable.
