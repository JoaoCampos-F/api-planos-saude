# 📋 Revisão da Aplicação - API Planos de Saúde

**Data**: 02/01/2026  
**Status Geral**: ✅ 6 de 8 fases completas (75%)

---

## 🎯 Visão Geral

API moderna em **NestJS + TypeScript** para gerenciar planos de saúde (Unimed e HapVida), substituindo o módulo legado em PHP.

### Filosofia: "Same logic, modern technology"
- ✅ Lógica de negócio permanece no Oracle (procedures, views, triggers)
- ✅ Aplicação é apenas camada de acesso transparente
- ✅ ZERO modificações em procedures existentes
- ✅ Código simples: desenvolvedores veem que chamamos apenas o banco

---

## 📦 Stack Tecnológico

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **NestJS** | 11.x | Framework backend |
| **TypeScript** | 5.7.x | Linguagem |
| **Oracle Database** | - | Banco de dados |
| **node-oracledb** | 6.10.0 | Driver direto (sem ORM) |
| **pnpm** | 10.27.0 | Gerenciador de pacotes |
| **Swagger** | - | Documentação automática |
| **PDFMake** | 0.3.0 | Geração de PDFs |

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Controllers   │  ← HTTP Routes + Swagger
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │  ← Orquestração + Validação
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │  ← Queries Oracle (transparentes)
└────────┬────────┘
         │
┌────────▼────────┐
│ OracleService   │  ← Driver node-oracledb
└────────┬────────┘
         │
┌────────▼────────┐
│  Oracle 19c+    │  ← Procedures/Views/Triggers
└─────────────────┘
```

### Padrões Aplicados
- ✅ **Repository Pattern** - Isolamento de queries
- ✅ **Service Layer** - Lógica de orquestração
- ✅ **DTO Validation** - class-validator + class-transformer
- ✅ **Global Exception Filter** - Tratamento padronizado de erros
- ✅ **Response Interceptor** - Formato de resposta consistente

---

## 📂 Estrutura de Módulos

```
src/
├── common/              # DTOs, filters, interceptors compartilhados
│   ├── dtos/
│   ├── filters/
│   └── interceptors/
├── config/              # Configurações (app, database, integrations)
├── modules/
│   └── planos-saude/    # ⭐ Módulo principal
│       ├── controllers/ # 5 controllers
│       ├── services/    # 9 services
│       ├── repositories/# 6 repositories
│       ├── dtos/        # DTOs por módulo
│       └── interfaces/  # TypeScript interfaces
└── shared/              # Serviços globais
    ├── database/        # OracleService
    ├── logger/          # LoggerService
    └── cache/           # CacheService
```

---

## 🚀 Funcionalidades Implementadas

### ✅ Fase 1: Infraestrutura Base (100%)

**Componentes:**
- ✅ OracleService com pools de conexão (gc + nbs)
- ✅ LoggerService centralizado
- ✅ CacheService em memória
- ✅ AllExceptionsFilter (tratamento global de erros)
- ✅ TransformResponseInterceptor (padronização de respostas)
- ✅ Configuração Swagger com versionamento (v1)
- ✅ Validação global de DTOs

**Endpoints de Sistema:**
- `GET /` - Health check
- `GET /api/docs` - Documentação Swagger

---

### ✅ Fase 2: Importação (100%)

**Controllers:** `ImportacaoController`  
**Prefixo:** `/api/v1/planos-saude/importacao`

#### Unimed Cuiabá (REST API)

**Endpoints:**
- `POST /unimed/cnpj` - Busca por CNPJ
- `POST /unimed/contrato` - Busca por Contrato

**Funcionalidades:**
- ✅ Integração com API REST Unimed
- ✅ Autenticação Bearer token (cache 24h)
- ✅ Parsing de resposta JSON
- ✅ Validação de dados
- ✅ Inserção em lote com transação

**Tabelas Oracle:**
- `gc.uni_dados_importados` (dados brutos)

#### HapVida (CSV Upload)

**Endpoints:**
- `POST /hapvida/csv` - Upload arquivo CSV

**Funcionalidades:**
- ✅ Upload multipart/form-data
- ✅ Parsing CSV com validação de colunas
- ✅ Conversão de valores monetários (BRL)
- ✅ Conversão de datas (DD/MM/YYYY)
- ✅ Inserção em lote com transação
- ✅ Relatório de erros por linha

**Tabelas Oracle:**
- `gc.hapvida_dados_importados` (dados brutos)

---

### ✅ Fase 3: Colaboradores (100%)

**Controllers:** `ColaboradorController`  
**Prefixo:** `/api/v1/planos-saude/colaboradores`

**Endpoints:**
```
GET    /                    # Listar colaboradores (com filtros)
PATCH  /exportacao          # Atualizar flag exportação individual
PATCH  /exportacao/lote     # Atualizar flag exportação em lote
```

**Filtros Disponíveis:**
- `mes` - Mês de referência (1-12)
- `ano` - Ano de referência
- `cpf` - CPF do colaborador
- `nome` - Nome do colaborador (LIKE)
- `empresa` - Sigla da empresa (UNI, HAP)
- `centro_custo` - Centro de custo

**Funcionalidades:**
- ✅ Consulta view `gc.vw_uni_resumo_colaborador`
- ✅ Paginação automática
- ✅ Múltiplos filtros combinados
- ✅ Atualização individual de flag exportação
- ✅ Atualização em lote com filtros
- ✅ Cálculo de valores por empresa

**Views/Tabelas Oracle:**
- `gc.vw_uni_resumo_colaborador` (view principal)
- `gc.uni_resumo_colaborador` (tabela destino)

---

### ✅ Fase 4: Processos (100%)

**Controllers:** `ProcessoController`  
**Prefixo:** `/api/v1/planos-saude/processos`

**Endpoints:**
```
GET   /               # Listar processos disponíveis
POST  /executar       # Executar processo
GET   /historico      # Histórico de execuções
```

**Processos Disponíveis:**

| Código | Nome | Procedure Oracle |
|--------|------|------------------|
| `MCW_UNI_RESUMO` | Resumo Unimed | `gc.PKG_UNI_SAUDE.p_uni_resumo` |
| `MCW_HAP_RESUMO` | Resumo HapVida | `gc.PKG_HAP_SAUDE.p_hap_resumo` |
| `MCW_EXPORTACAO` | Exportação TOTVS | `gc.PKG_UNI_SAUDE.p_exportacao` |

**Funcionalidades:**
- ✅ Validação de período (mes_ref, ano_ref)
- ✅ Validação de empresa (UNI, HAP)
- ✅ Execução assíncrona de procedures
- ✅ Controle de concorrência (mesma procedure + período)
- ✅ Log de execução em tabela
- ✅ Histórico paginado

**Procedures Oracle:**
- `gc.PKG_UNI_SAUDE.p_uni_resumo` (agregação Unimed)
- `gc.PKG_HAP_SAUDE.p_hap_resumo` (agregação HapVida)
- `gc.PKG_UNI_SAUDE.p_exportacao` (exportação TOTVS)

**Tabelas Oracle:**
- `gc.processo_execucao` (log de execuções)

---

### ✅ Fase 5: Relatórios (100%)

**Controllers:** `RelatorioController`  
**Prefixo:** `/api/v1/planos-saude/relatorios`

**Endpoints (PDF):**
```
GET  /colaborador     # Relatório por colaborador
GET  /empresa         # Relatório por empresa
GET  /pagamento       # Relatório de pagamento
GET  /centro-custo    # Relatório por centro de custo
```

**Funcionalidades:**
- ✅ Geração de PDF com **PDFMake** (substituiu Jasper Reports)
- ✅ Fontes Roboto embarcadas
- ✅ Cabeçalho com logo e informações
- ✅ Tabelas formatadas com totalizadores
- ✅ Formatação de valores monetários (BRL)
- ✅ Formatação de CPF
- ✅ Response header: `Content-Type: application/pdf`
- ✅ Filename: `relatorio-{tipo}-{timestamp}.pdf`

**Views Oracle:**
- `gc.vw_uni_resumo_colaborador` (dados colaboradores)
- `gc.vw_uni_resumo_empresa` (dados por empresa)
- `gc.vw_uni_resumo_pagamento` (dados pagamento)
- `gc.vw_uni_resumo_centro_custo` (dados centro custo)

---

### ✅ Fase 6: Utilitários e Integrações (100%)

**Controllers:** `EmpresaController`  
**Prefixo:** `/api/v1/planos-saude/utilidades`

**Endpoints:**
```
GET  /empresas                  # Listar empresas
GET  /empresas/:sigla           # Detalhes empresa
GET  /contratos                 # Listar contratos
GET  /empresas/:sigla/contratos # Contratos por empresa
```

**Funcionalidades:**
- ✅ Cadastro de empresas (UNI, HAP, etc)
- ✅ Gestão de contratos
- ✅ Validação de empresa ativa
- ✅ Códigos internos (coligada, filial, bandeira)
- ✅ Estatísticas de uso

**Tabelas Oracle:**
- `gc.empresa` (cadastro empresas)
- `gc.uni_resumo_colaborador` (relação colaborador-empresa)

**Integração Retroativa:**
- ✅ EmpresaService integrado em ColaboradorService
- ✅ Métodos `atualizarExportacaoTodos()` e `atualizarValorEmpresa()` habilitados

---

## 📊 Estatísticas do Código

| Métrica | Valor |
|---------|-------|
| **Fases Completas** | 6/8 (75%) |
| **Controllers** | 5 |
| **Services** | 9 |
| **Repositories** | 6 |
| **Endpoints REST** | 17 |
| **DTOs** | ~25 |
| **Interfaces** | ~20 |
| **Linhas de Código** | ~4.500 |

---

## 🔌 Endpoints Consolidados

### Importação (3 endpoints)
```
POST /api/v1/planos-saude/importacao/unimed/cnpj
POST /api/v1/planos-saude/importacao/unimed/contrato
POST /api/v1/planos-saude/importacao/hapvida/csv
```

### Colaboradores (3 endpoints)
```
GET   /api/v1/planos-saude/colaboradores
PATCH /api/v1/planos-saude/colaboradores/exportacao
PATCH /api/v1/planos-saude/colaboradores/exportacao/lote
```

### Processos (3 endpoints)
```
GET  /api/v1/planos-saude/processos
POST /api/v1/planos-saude/processos/executar
GET  /api/v1/planos-saude/processos/historico
```

### Relatórios (4 endpoints)
```
GET /api/v1/planos-saude/relatorios/colaborador
GET /api/v1/planos-saude/relatorios/empresa
GET /api/v1/planos-saude/relatorios/pagamento
GET /api/v1/planos-saude/relatorios/centro-custo
```

### Utilitários (4 endpoints)
```
GET /api/v1/planos-saude/utilidades/empresas
GET /api/v1/planos-saude/utilidades/empresas/:sigla
GET /api/v1/planos-saude/utilidades/contratos
GET /api/v1/planos-saude/utilidades/empresas/:sigla/contratos
```

---

## 🔐 Formato de Resposta Padronizado

Todas as respostas seguem o formato (via `TransformResponseInterceptor`):

### Sucesso
```json
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso",
  "dados": { ... },
  "timestamp": "2026-01-02T13:45:00.000Z"
}
```

### Erro
```json
{
  "sucesso": false,
  "mensagem": "Erro ao processar requisição",
  "codigo": "ERR_INVALID_INPUT",
  "detalhes": [ ... ],
  "timestamp": "2026-01-02T13:45:00.000Z",
  "caminho": "/api/v1/planos-saude/colaboradores"
}
```

---

## 🗄️ Integração com Oracle

### Schemas Utilizados
- **gc** - Schema principal (procedures, views, tabelas)
- **nbs** - Schema secundário (dados complementares)

### Pools de Conexão
- `pool_gc` - 10 conexões (min: 2, max: 10)
- `pool_nbs` - 5 conexões (min: 1, max: 5)

### Padrões de Query
```typescript
// Query simples
const result = await oracleService.query<Interface>(sql, params);

// Query única (retorna 1 ou null)
const item = await oracleService.queryOne<Interface>(sql, params);

// Execução (INSERT/UPDATE/DELETE)
await oracleService.execute(sql, params);

// Procedure
await oracleService.callProcedure(name, inParams, outParams);

// Transação
await oracleService.executeTransaction(async (conn) => {
  // múltiplas operações
});
```

---

## 📝 Variáveis de Ambiente

```env
# Oracle Database
ORACLE_USER=seu_usuario
ORACLE_PASSWORD=sua_senha
ORACLE_CONNECT_STRING=localhost:1521/ORCL
ORACLE_SCHEMA_GC=gc
ORACLE_SCHEMA_NBS=nbs

# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Unimed API
UNIMED_API_BASE_URL=https://ws.unimedcuiaba.coop.br/api
UNIMED_API_TOKEN_URL=/Token/geratoken
UNIMED_API_CNPJ_URL=/Demonstrativo/buscaporperiodo*
UNIMED_API_CONTRATO_URL=/Demonstrativo/buscaporperiodo*
```

---

## 🚀 Como Executar

### Desenvolvimento
```bash
pnpm install
pnpm run start:dev
```

### Build
```bash
pnpm run build
pnpm run start:prod
```

### Acessar
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000

---

## ✅ Próximas Etapas

### Fase 7: Testes e Homologação (Pendente)
- [ ] Testes unitários (repositories, services)
- [ ] Testes E2E (endpoints principais)
- [ ] Coverage >80%
- [ ] Testes de carga
- [ ] Validação com usuários

### Fase 8: Deploy e Transição (Pendente)
- [ ] Configuração Docker
- [ ] Scripts de deploy
- [ ] Documentação de migração
- [ ] Treinamento equipe
- [ ] Rollback plan

---

## 📚 Documentação Adicional

- **Filosofia do Projeto**: `.github/copilot-instructions.md`
- **Fase 1**: `FASE-1-COMPLETA.md`
- **Fase 2**: `FASE-2-COMPLETA.md`
- **Fase 3**: `FASE-3-COMPLETA.md`
- **Fase 4**: `FASE-4-COMPLETA.md`
- **Fase 5**: `FASE-5-COMPLETA.md`
- **Fase 6**: `FASE-6-COMPLETA.md`
- **Plano Original**: `docs/PLANO-IMPLEMENTACAO-MODULO-UNI.md`

---

## 🎯 Conclusão

A API está **75% completa** com todas as funcionalidades principais implementadas:
- ✅ Importação de dados (Unimed REST + HapVida CSV)
- ✅ Gestão de colaboradores
- ✅ Execução de processos (MCW)
- ✅ Relatórios em PDF
- ✅ Utilitários (empresas e contratos)

**Pronto para**: Testes (Fase 7) e Deploy (Fase 8).
