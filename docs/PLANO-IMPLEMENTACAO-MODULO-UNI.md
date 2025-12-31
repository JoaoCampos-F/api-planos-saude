# Plano de Implementação - Módulo UNI (Planos de Saúde)

## 📋 Sumário Executivo

Este documento apresenta o plano completo de implementação para migração do módulo UNI (Planos de Saúde) do sistema legacy NPD (PHP) para uma arquitetura moderna utilizando NestJS no backend, mantendo total compatibilidade com o banco de dados Oracle existente.

**Status**: Aguardando aprovação  
**Data**: 31/12/2025  
**Versão**: 1.0  
**Autor**: Equipe de Desenvolvimento

---

## 🎯 Objetivos

### Objetivo Principal

Migrar o módulo UNI do NPD-Legacy (PHP) para NestJS, mantendo todas as funcionalidades existentes e aplicando melhorias de arquitetura, seguindo os princípios SOLID, Clean Code e as boas práticas da comunidade NestJS.

### Objetivos Específicos

- ✅ Manter 100% das funcionalidades atuais
- ✅ Preservar a estrutura do banco de dados Oracle
- ✅ Implementar arquitetura escalável e testável
- ✅ Aplicar padrões de código limpo e manutenível
- ✅ Preparar base para futura migração do front-end para Vue.js
- ✅ Melhorar performance e segurança
- ✅ Facilitar manutenção futura

---

## 📊 Análise do Módulo UNI - Legacy

### 1. Visão Geral

O módulo UNI gerencia os planos de saúde das empresas do grupo, incluindo:

- Integração com operadoras de saúde (Unimed e HapVida)
- Importação de faturas e demonstrativos
- Gestão de colaboradores e dependentes
- Processamento de cobranças
- Geração de relatórios gerenciais
- Exportação para sistemas de pagamento (TOTVS)

### 2. Estrutura Atual - Legacy

```
npd-legacy/com/modules/uni/
├── controller/
│   ├── UnimedController.php       # 665 linhas - Controller principal Unimed
│   └── HapVidaController.php      # 81 linhas - Controller HapVida
├── model/
│   ├── Unimed.php                 # 330 linhas - Entidade Unimed
│   ├── UnimedDAO.php              # 1004 linhas - Persistência Unimed
│   ├── HapVida.php                # 200 linhas - Entidade HapVida
│   └── HapVidaDAO.php             # 100 linhas - Persistência HapVida
└── view/
    ├── Unimed.php                 # 193 linhas - Interface Unimed
    ├── HapVida.php                # Interface HapVida
    └── Dados.php                  # Interface auxiliar

npd-legacy/com/modules/webservice/unimed/
└── FuncoesUnimed.php              # WebService SOAP Unimed

npd-legacy/js/com/uni/
├── Unimed.js                      # 756 linhas - Lógica frontend Unimed
└── HapVida.js                     # Lógica frontend HapVida
```

### 3. Funcionalidades Identificadas

#### 3.1 Importação de Dados

**UNIMED:**

- ✅ Importação via WebService REST (API Unimed Cuiabá)
  - Endpoint: `https://ws.unimedcuiaba.coop.br/api`
  - Autenticação: Bearer Token
  - Métodos:
    - `/Token/geratoken` - Geração de token de acesso
    - `/Demonstrativo/buscaporperiodocnpj` - Busca por CNPJ
    - `/Demonstrativo/buscaporperiodocontrato` - Busca por Contrato
- ✅ Importação via WebService SOAP (Legacy - Descontinuado)
  - WSDL: `http://200.167.191.244/wsbhzwebsempre/clientes/servicerelatoriosunimed.asmx?wsdl`
  - Métodos: `RelatorioDetalhadoCobranca`, `RelatorioDetalhadoCoParticipacao`

**HAPVIDA:**

- ✅ Importação via arquivo CSV
  - Upload de arquivo
  - Parsing e validação de dados
  - Armazenamento na tabela `HAPVIDA_PLANO`

**Tabelas Afetadas:**

- `gc.uni_dados_cobranca` - Dados principais de cobrança
- `nbs.uni_rd_cobr` - Relatório detalhado de cobrança (SOAP Legacy)
- `nbs.uni_rd_cobr_detalhe` - Detalhes de co-participação (SOAP Legacy)
- `nbs.hapvida_plano` - Dados HapVida

#### 3.2 Gestão de Colaboradores

- ✅ Listagem de colaboradores com filtros:
  - Por empresa
  - Por contrato
  - Por colaborador (CPF)
  - Por mês/ano de referência
- ✅ Visualização de dados do colaborador:
  - Informações pessoais
  - Plano contratado
  - Valores (titular, dependentes, consumo)
  - Status de exportação
- ✅ Atualização de status de exportação:
  - Individual (por colaborador)
  - Em lote (todos da empresa)
- ✅ Atualização de valores de empresa

**Tabelas:**

- `gc.vw_uni_resumo_colaborador` - View principal de colaboradores
- `gc.uni_resumo_colaborador` - Tabela de resumo
- `nbs.mcw_colaborador` - Dados dos colaboradores

#### 3.3 Processamento e Exportação

- ✅ Execução de processos automatizados:
  - Resumo de dados (`gc.PKG_UNI_SAUDE.p_uni_resumo`)
  - Exportação TOTVS (`gc.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL`)
  - Geração de DIRF
- ✅ Controle de processos:
  - Categoria (UNI)
  - Tipo de dado (U - Unimed)
  - Validação de prazos
  - Controle de permissões
  - Log de execução
- ✅ Histórico de processamento:
  - Data/hora de execução
  - Usuário responsável
  - Status (início, fim, duração)

**Tabelas:**

- `gc.mcw_processo` - Cadastro de processos
- `gc.mcw_processo_log` - Log de execução
- `gc.mcw_periodo_fechamento` - Períodos de fechamento
- `gc.vw_mcw_processo_log` - View de logs

#### 3.4 Relatórios (Jasper Reports)

- ✅ Relatório de Colaborador (`RelatorioColaborador.jasper`)
- ✅ Resumo por Colaboradores (`relatorioCobranca_por_empresa.jasper`)
- ✅ Resumo de Pagamento (`relatorioPagamentos.jasper`)
- ✅ Resumo de Não Lançamento (`relatorioNaolancamento.jasper`)
- ✅ Resumo por Departamento (`resumoCentro.jasper`)
- ✅ Resumo por Centro de Custo (`relatorioCentroCusto.jasper`)

**Parâmetros comuns:**

- `in_codEmpresa`, `in_codColigada`, `in_codFilial`
- `in_mesRef`, `in_anoRef`
- `in_codBand` (bandeira/operadora)
- `in_cpf` (colaborador)
- `in_codContrato` (contrato)

#### 3.5 Integrações Externas

**Unimed Cuiabá (REST API):**

- Autenticação via token (válido por 24h)
- Cache de token no banco (`gc.api_gc_servicos`)
- Busca de demonstrativos por CNPJ e Contrato
- Dados retornados em JSON

**Operadoras configuradas:**

- Unimed Cuiabá (principal)
- HapVida (CSV import)

### 4. Modelos de Dados Identificados

#### Entidade Unimed (Principal)

```typescript
{
  // Dados do Contrato
  contrato: string;
  cnpj: string;
  contratante: string;
  nomePlano: string;
  abrangencia: string;
  codFatura: string;
  valorFatura: number;
  periodo: string; // formato: MM-YYYY

  // Dados do Titular
  codTitular: string;
  titular: string;
  cpfTitular: string;
  matricula: string;
  acomodacao: string;

  // Dados do Beneficiário
  codBeneficiario: string;
  beneficiario: string;
  cpf: string;
  idade: number;
  nascimento: Date;
  inclusao: Date;
  dependencia: string; // T-Titular, D-Dependente

  // Valores
  valorCobrado: number;
  descricao: string;

  // Controle
  mesRef: number;
  anoRef: number;
  codEmpresa: number;
  codColigada: number;
  codFilial: number;
  codBand: string;
  exporta: 'S' | 'N';
  dataImport: Date;
}
```

#### Entidade HapVida

```typescript
{
  empresa: string;
  unidade: string;
  nomeEmpresa: string;
  credencial: string;
  matricula: string;
  cpf: string;
  beneficiario: string;
  dataNascimento: Date;
  dataInclusao: Date;
  idade: number;
  plano: string;
  ac: string; // acomodação
  mensalidade: number;
  adicional: number;
  desconto: number;
  valorCobrado: number;
  hapAno: number;
  hapMes: number;
}
```

#### Processo MCW

```typescript
{
  codigo: string;
  categoria: string; // 'UNI'
  procedure: string; // nome da stored procedure
  descricao: string;
  ordem: number;
  dias: number; // prazo após fechamento
  usuario: string;
  tipoEmpresa: string;
  tipoDado: string; // 'U' para Unimed
  ativo: 'S' | 'N';
}
```

---

## 🏗️ Arquitetura Proposta - NestJS

### 1. Estrutura de Módulos

Seguindo o padrão estabelecido no projeto `api-planos-saude`, a estrutura será:

```
src/
├── modules/
│   ├── planos-saude/              # Módulo principal
│   │   ├── planos-saude.module.ts
│   │   ├── planos-saude.controller.ts
│   │   ├── planos-saude.service.ts
│   │   │
│   │   ├── dtos/                   # Data Transfer Objects
│   │   │   ├── importacao/
│   │   │   │   ├── importar-unimed.dto.ts
│   │   │   │   ├── importar-hapvida.dto.ts
│   │   │   │   └── importar-response.dto.ts
│   │   │   ├── colaborador/
│   │   │   │   ├── buscar-colaborador.dto.ts
│   │   │   │   ├── atualizar-colaborador.dto.ts
│   │   │   │   ├── colaborador-resumo.dto.ts
│   │   │   │   └── atualizar-todos-colaboradores.dto.ts
│   │   │   ├── processo/
│   │   │   │   ├── executar-processo.dto.ts
│   │   │   │   ├── processo-mcw.dto.ts
│   │   │   │   └── historico-processo.dto.ts
│   │   │   └── relatorio/
│   │   │       ├── parametros-relatorio.dto.ts
│   │   │       └── gerar-relatorio.dto.ts
│   │   │
│   │   ├── entities/               # Entidades do domínio
│   │   │   ├── unimed.entity.ts
│   │   │   ├── hapvida.entity.ts
│   │   │   ├── colaborador-resumo.entity.ts
│   │   │   └── processo-mcw.entity.ts
│   │   │
│   │   ├── repositories/           # Camada de persistência
│   │   │   ├── unimed.repository.ts
│   │   │   ├── hapvida.repository.ts
│   │   │   ├── colaborador.repository.ts
│   │   │   └── processo.repository.ts
│   │   │
│   │   ├── services/               # Lógica de negócio
│   │   │   ├── importacao/
│   │   │   │   ├── unimed-importacao.service.ts
│   │   │   │   ├── hapvida-importacao.service.ts
│   │   │   │   └── importacao-base.service.ts
│   │   │   ├── colaborador/
│   │   │   │   └── colaborador.service.ts
│   │   │   ├── processo/
│   │   │   │   ├── processo-executor.service.ts
│   │   │   │   └── processo-validador.service.ts
│   │   │   ├── relatorio/
│   │   │   │   └── relatorio-generator.service.ts
│   │   │   └── integracao/
│   │   │       ├── unimed-api.service.ts
│   │   │       └── unimed-soap.service.ts (legacy)
│   │   │
│   │   ├── controllers/            # Controladores específicos
│   │   │   ├── importacao.controller.ts
│   │   │   ├── colaborador.controller.ts
│   │   │   ├── processo.controller.ts
│   │   │   └── relatorio.controller.ts
│   │   │
│   │   └── utils/                  # Utilitários
│   │       ├── formatters.util.ts
│   │       ├── validators.util.ts
│   │       └── date.util.ts
│   │
│   ├── shared/                     # Módulo compartilhado
│   │   ├── database/
│   │   │   ├── oracle.module.ts
│   │   │   └── oracle.service.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── permissions.guard.ts
│   │   ├── logging/
│   │   │   ├── logging.module.ts
│   │   │   └── logging.service.ts
│   │   └── cache/
│   │       ├── cache.module.ts
│   │       └── cache.service.ts
│   │
│   └── common/                     # Recursos comuns
│       ├── decorators/
│       │   ├── user.decorator.ts
│       │   └── permissions.decorator.ts
│       ├── filters/
│       │   ├── http-exception.filter.ts
│       │   └── oracle-exception.filter.ts
│       ├── interceptors/
│       │   ├── logging.interceptor.ts
│       │   └── transform.interceptor.ts
│       ├── pipes/
│       │   └── validation.pipe.ts
│       └── interfaces/
│           └── response.interface.ts
│
├── config/                         # Configurações
│   ├── app.config.ts
│   ├── database.config.ts
│   └── integrations.config.ts
│
├── app.module.ts
└── main.ts
```

### 2. Princípios de Design Aplicados

#### SOLID

**Single Responsibility Principle (SRP)**

- Cada service tem uma única responsabilidade
- Controllers apenas roteiam requisições
- Repositories lidam exclusivamente com persistência
- DTOs validam e transferem dados

**Open/Closed Principle (OCP)**

- Abstrações para importação (`ImportacaoBaseService`)
- Interface comum para operadoras de saúde
- Extensível para novas operadoras sem modificar código existente

**Liskov Substitution Principle (LSP)**

- Implementações específicas (Unimed, HapVida) substituíveis
- Interfaces bem definidas para contratos

**Interface Segregation Principle (ISP)**

- Interfaces específicas por funcionalidade
- Evita dependências desnecessárias

**Dependency Inversion Principle (DIP)**

- Injeção de dependências via NestJS
- Dependência de abstrações, não implementações concretas

#### Clean Code

- ✅ Nomes descritivos e em português (conforme padrão do time)
- ✅ Funções pequenas e focadas
- ✅ Evitar duplicação (DRY)
- ✅ Comentários apenas quando necessário
- ✅ Tratamento de erros consistente
- ✅ Testes unitários e de integração

### 3. Padrões Arquiteturais

**Camadas:**

1. **Controller Layer** - Recebe requisições HTTP
2. **Service Layer** - Lógica de negócio
3. **Repository Layer** - Acesso a dados
4. **Entity Layer** - Modelos de domínio

**Padrões:**

- Repository Pattern
- Dependency Injection
- DTO Pattern
- Factory Pattern (para criação de relatórios)
- Strategy Pattern (para diferentes operadoras)

---

## 🛠️ Stack Tecnológica e Justificativas

### Backend (NestJS)

#### 1. Framework Principal

**NestJS v11** (atual no projeto)

- ✅ **Por quê?**
  - Framework enterprise com arquitetura modular
  - TypeScript nativo (type-safety)
  - Injeção de dependências integrada
  - Ampla adoção na comunidade
  - Documentação robusta
  - CLI poderosa para scaffolding
  - Suporte a microservices (futuro)

#### 2. Banco de Dados

**Oracle Database + oracledb (node-oracledb)**

- ✅ **Por quê?**
  - Banco existente - sem necessidade de migração
  - Driver oficial Oracle para Node.js
  - Suporte a features avançadas (procedures, packages, views)
  - Performance otimizada
  - Conexão pool para escalabilidade

**Alternativa considerada**: TypeORM

- ❌ Limitações com stored procedures Oracle
- ❌ Overhead desnecessário para queries complexas
- ✅ Preferível usar oracledb diretamente

#### 3. Validação e Transformação

**class-validator + class-transformer**

- ✅ **Por quê?**
  - Validação declarativa via decorators
  - Integração nativa com NestJS
  - Type-safe
  - Mensagens de erro customizáveis
  - Transformação automática de tipos

#### 4. Documentação de API

**Swagger (OpenAPI) via @nestjs/swagger**

- ✅ **Por quê?**
  - Documentação automática
  - Interface interativa para testes
  - Contratos de API claros
  - Facilita integração com frontend

#### 5. Autenticação e Autorização

**JWT + Passport.js**

- ✅ **Por quê?**
  - Stateless authentication
  - Integração com sistema legacy
  - Suporte a guards NestJS
  - Controle de permissões granular

#### 6. Cliente HTTP

**Axios**

- ✅ **Por quê?**
  - API Unimed Cuiabá (REST)
  - Interceptors para token refresh
  - Retry logic
  - Timeout configurável

**soap (node-soap)**

- ✅ **Por quê?**
  - Suporte a WebService SOAP legacy
  - Manter compatibilidade enquanto não migrado

#### 7. Processamento de Arquivos

**Multer**

- ✅ **Por quê?**
  - Upload de CSV HapVida
  - Integração nativa NestJS
  - Validação de tipo/tamanho

**csv-parser**

- ✅ **Por quê?**
  - Parsing eficiente de CSV
  - Stream-based (memory efficient)

#### 8. Geração de Relatórios

**pdfmake ou puppeteer**

- ✅ **Por quê?**
  - Geração de PDF server-side
  - Substituir Jasper Reports (PHP)
  - Templates customizáveis

**Alternativa**: Manter Jasper via chamada externa

- ✅ Se integração complexa

#### 9. Cache

**@nestjs/cache-manager + cache-manager**

- ✅ **Por quê?**
  - Cache de tokens de API
  - Cache de queries pesadas
  - Melhor performance

**Redis (futuro)**

- ✅ Cache distribuído para múltiplas instâncias

#### 10. Logging e Monitoramento

**Winston**

- ✅ **Por quê?**
  - Logs estruturados
  - Múltiplos transportes (file, console)
  - Níveis de log configuráveis

**@nestjs/bull + Bull**

- ✅ **Por quê?**
  - Processamento assíncrono de importações
  - Filas para processos pesados
  - Retry automático

#### 11. Testes

**Jest**

- ✅ **Por quê?**
  - Padrão do NestJS
  - Testes unitários e integração
  - Coverage reports
  - Mocking facilitado

**Supertest**

- ✅ **Por quê?**
  - Testes E2E de APIs

#### 12. Utilitários

**date-fns**

- ✅ **Por quê?**
  - Manipulação de datas
  - Tree-shakeable
  - TypeScript support

**lodash**

- ✅ **Por quê?**
  - Utilitários de manipulação de dados
  - Performance otimizada

---

## 📝 Endpoints da API

### Grupo: Importação

#### POST /planos-saude/importacao/unimed/cnpj

Importa dados da Unimed por CNPJ

```typescript
Request Body:
{
  mes: number          // 1-12
  ano: number          // 2024
}

Response:
{
  success: boolean
  message: string
  data: {
    registrosImportados: number
    periodo: string
  }
}
```

#### POST /planos-saude/importacao/unimed/contrato

Importa dados da Unimed por Contrato

```typescript
Request Body:
{
  mes: number
  ano: number
}
```

#### POST /planos-saude/importacao/hapvida

Importa arquivo CSV HapVida

```typescript
Request: multipart / form - data;
{
  file: File(CSV);
  mes: number;
  ano: number;
}
```

#### POST /planos-saude/importacao/processar-resumo

Executa procedure de resumo

```typescript
Request Body:
{
  mes: number
  ano: number
}
```

---

### Grupo: Colaboradores

#### GET /planos-saude/colaboradores

Lista colaboradores com filtros

```typescript
Query Params:
{
  empresa?: string
  contrato?: string
  cpf?: string
  mes: number
  ano: number
  page?: number
  limit?: number
}

Response:
{
  success: boolean
  data: {
    colaboradores: ColaboradorResumo[]
    total: number
    page: number
    limit: number
  }
}
```

#### PATCH /planos-saude/colaboradores/:cpf/exportacao

Atualiza status de exportação de um colaborador

```typescript
Request Body:
{
  exporta: 'S' | 'N'
  mes: number
  ano: number
}
```

#### PATCH /planos-saude/colaboradores/empresa/:codEmpresa/exportacao

Atualiza status de todos colaboradores da empresa

```typescript
Request Body:
{
  exporta: 'S' | 'N'
  mes: number
  ano: number
  codColigada: number
  codFilial: number
}
```

#### PATCH /planos-saude/colaboradores/valor-empresa

Atualiza valor pago pela empresa

```typescript
Request Body:
{
  codEmpresa: number
  codColigada: number
  codFilial: number
  valor: number
}
```

---

### Grupo: Processos

#### GET /planos-saude/processos

Lista processos disponíveis

```typescript
Query Params:
{
  categoria: string   // 'UNI'
  tipo: string        // 'U'
  mes: number
  ano: number
}

Response:
{
  success: boolean
  data: ProcessoMCW[]
}
```

#### POST /planos-saude/processos/executar

Executa processos selecionados

```typescript
Request Body:
{
  processos: string[]     // códigos dos processos
  mes: number
  ano: number
  categoria: string
  tipo: string
  empresa?: number        // 'T' para todas
  bandeira?: string       // 'T' para todas
  cpf?: string           // colaborador específico
  apagar?: boolean       // deletar dados antigos
  previa?: boolean       // gerar prévia
}
```

#### GET /planos-saude/processos/:codigo/historico

Histórico de execuções de um processo

```typescript
Query Params:
{
  mes: number
  ano: number
  categoria: string
}

Response:
{
  success: boolean
  data: HistoricoProcesso[]
}
```

---

### Grupo: Relatórios

#### GET /planos-saude/relatorios/colaborador

Relatório individual de colaborador

```typescript
Query Params:
{
  empresa: string
  cpf: string
  contrato: string
  mes: number
  ano: number
}

Response: PDF Binary
```

#### GET /planos-saude/relatorios/empresa-colaboradores

Resumo por colaboradores da empresa

```typescript
Query Params:
{
  empresa: string
  contrato?: string
  mes: number
  ano: number
}

Response: PDF Binary
```

#### GET /planos-saude/relatorios/pagamento

Resumo de pagamentos

```typescript
Query Params:
{
  empresa: string
  contrato?: string
  mes: number
  ano: number
}

Response: PDF Binary
```

#### GET /planos-saude/relatorios/nao-lancamento

Resumo de não lançamentos

```typescript
Query Params:
{
  empresa: string
  contrato?: string
  mes: number
  ano: number
}

Response: PDF Binary
```

#### GET /planos-saude/relatorios/centro-custo

Resumo por centro de custo

```typescript
Query Params:
{
  empresa: string
  contrato?: string
  mes: number
  ano: number
}

Response: PDF Binary
```

---

### Grupo: Utilitários

#### GET /planos-saude/empresas

Lista empresas com plano de saúde

#### GET /planos-saude/contratos

Lista contratos ativos

#### POST /planos-saude/dirf

Gera DIRF

```typescript
Request Body:
{
  empresa: string
  mes: number
  ano: number
}
```

---

## 📦 Dependências do Projeto

### dependencies

```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/platform-express": "^11.0.1",
  "@nestjs/swagger": "^8.0.0",
  "@nestjs/axios": "^3.0.2",
  "@nestjs/cache-manager": "^2.2.2",
  "@nestjs/bull": "^10.1.1",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1",
  "oracledb": "^6.6.0",
  "axios": "^1.7.7",
  "soap": "^1.1.3",
  "multer": "^1.4.5-lts.1",
  "csv-parser": "^3.0.0",
  "pdfmake": "^0.2.12",
  "cache-manager": "^5.7.6",
  "winston": "^3.15.0",
  "bull": "^4.16.3",
  "date-fns": "^4.1.0",
  "lodash": "^4.17.21",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
}
```

### devDependencies

```json
{
  "@nestjs/cli": "^11.0.0",
  "@nestjs/schematics": "^11.0.0",
  "@nestjs/testing": "^11.0.1",
  "@types/express": "^5.0.0",
  "@types/jest": "^30.0.0",
  "@types/node": "^22.10.7",
  "@types/multer": "^1.4.12",
  "@types/lodash": "^4.17.13",
  "@types/supertest": "^6.0.2",
  "jest": "^30.0.0",
  "supertest": "^7.0.0",
  "ts-jest": "^29.2.5",
  "ts-node": "^10.9.2",
  "typescript": "^5.7.2"
}
```

---

## 🗓️ Cronograma de Implementação

### Fase 1: Preparação e Setup (1 semana)

**Semana 1**

- [ ] Aprovação do plano de implementação
- [ ] Setup do ambiente de desenvolvimento
- [ ] Instalação de dependências
- [ ] Configuração de conexão Oracle
- [ ] Configuração de variáveis de ambiente
- [ ] Setup de testes

**Entregáveis:**

- Ambiente configurado
- Conexão com banco validada
- Estrutura base de módulos criada

---

### Fase 2: Módulo de Importação (2 semanas)

**Semana 2-3**

- [ ] Implementar serviço de integração Unimed REST API
  - [ ] Autenticação e gestão de token
  - [ ] Cache de token
  - [ ] Endpoints de busca por CNPJ
  - [ ] Endpoints de busca por Contrato
- [ ] Implementar serviço de importação HapVida
  - [ ] Upload de arquivo
  - [ ] Parser CSV
  - [ ] Validação de dados
- [ ] Implementar repositories de persistência
  - [ ] UnimedRepository
  - [ ] HapVidaRepository
- [ ] Implementar controllers de importação
- [ ] DTOs de importação
- [ ] Testes unitários e integração

**Entregáveis:**

- API de importação funcional
- Testes passando (>80% coverage)
- Documentação Swagger

---

### Fase 3: Módulo de Colaboradores (2 semanas)

**Semana 4-5**

- [ ] Implementar ColaboradorService
  - [ ] Listagem com filtros
  - [ ] Paginação
  - [ ] Busca por CPF
- [ ] Implementar ColaboradorRepository
  - [ ] Queries Oracle otimizadas
  - [ ] Views existentes
- [ ] Implementar atualizações
  - [ ] Status de exportação individual
  - [ ] Status de exportação em lote
  - [ ] Valor da empresa
- [ ] Controllers de colaboradores
- [ ] DTOs e validações
- [ ] Testes

**Entregáveis:**

- API de colaboradores funcional
- Performance otimizada
- Testes passando

---

### Fase 4: Módulo de Processos (2 semanas)

**Semana 6-7**

- [ ] Implementar ProcessoExecutorService
  - [ ] Execução de stored procedures
  - [ ] Validação de prazos
  - [ ] Controle de permissões
- [ ] Implementar ProcessoValidadorService
  - [ ] Validação de datas
  - [ ] Validação de período de fechamento
- [ ] Implementar ProcessoRepository
  - [ ] Busca de processos MCW
  - [ ] Log de execução
  - [ ] Histórico
- [ ] Controllers de processos
- [ ] Sistema de filas (Bull) para processos longos
- [ ] Testes

**Entregáveis:**

- API de processos funcional
- Processamento assíncrono implementado
- Logs detalhados

---

### Fase 5: Módulo de Relatórios (2 semanas)

**Semana 8-9**

- [ ] Avaliar migração de Jasper Reports
- [ ] Implementar RelatorioGeneratorService
  - [ ] Template de colaborador
  - [ ] Template de empresa
  - [ ] Template de pagamentos
  - [ ] Template de centro de custo
- [ ] Queries otimizadas para relatórios
- [ ] Controllers de relatórios
- [ ] Testes de geração

**Entregáveis:**

- Relatórios funcionais em PDF
- Performance aceitável
- Templates configuráveis

---

### Fase 6: Utilitários e Integrações (1 semana)

**Semana 10**

- [ ] Implementar endpoints auxiliares
  - [ ] Lista de empresas
  - [ ] Lista de contratos
- [ ] Implementar geração de DIRF
- [ ] Implementar sistema de logging
- [ ] Implementar cache Redis (opcional)
- [ ] Documentação completa

**Entregáveis:**

- Todas funcionalidades auxiliares
- Sistema de logs robusto
- Documentação atualizada

---

### Fase 7: Testes e Homologação (2 semanas)

**Semana 11-12**

- [ ] Testes de integração completos
- [ ] Testes E2E
- [ ] Testes de carga
- [ ] Testes de regressão com dados reais
- [ ] Validação com usuários
- [ ] Ajustes e correções
- [ ] Performance tuning

**Entregáveis:**

- Bateria completa de testes
- Relatório de testes
- Sistema validado

---

### Fase 8: Deploy e Transição (1 semana)

**Semana 13**

- [ ] Deploy em ambiente de produção
- [ ] Migração gradual (feature flags)
- [ ] Monitoramento ativo
- [ ] Documentação de operação
- [ ] Treinamento do time
- [ ] Suporte intensivo

**Entregáveis:**

- Sistema em produção
- Monitoramento configurado
- Time treinado

---

## 🔄 Estratégia de Migração

### Abordagem: Strangler Fig Pattern

**Etapas:**

1. **Convivência Inicial**
   - Legacy e novo sistema rodando em paralelo
   - Roteamento seletivo via feature flags
   - Validação cruzada de resultados

2. **Migração Gradual por Funcionalidade**
   - Importações primeiro (menos crítico)
   - Consultas depois
   - Processamentos e relatórios por último

3. **Descontinuação do Legacy**
   - Após 100% de confiança no novo sistema
   - Manter legacy em read-only por período
   - Desativação definitiva

### Feature Flags

```typescript
enum Feature {
  IMPORTACAO_UNIMED_NEW = 'importacao_unimed_new',
  IMPORTACAO_HAPVIDA_NEW = 'importacao_hapvida_new',
  COLABORADORES_NEW = 'colaboradores_new',
  PROCESSOS_NEW = 'processos_new',
  RELATORIOS_NEW = 'relatorios_new',
}
```

---

## 🧪 Estratégia de Testes

### Pirâmide de Testes

```
       /\
      /E2E\         10% - Testes End-to-End
     /------\
    /Integr \       20% - Testes de Integração
   /----------\
  /  Unitários \    70% - Testes Unitários
 /--------------\
```

### Cobertura Mínima

- **Unitários**: 80%
- **Integração**: 60%
- **E2E**: Fluxos críticos

### Tipos de Teste

1. **Unitários**
   - Services
   - Repositories
   - Utilitários
   - Validações

2. **Integração**
   - Controllers + Services
   - Repository + Oracle
   - API externa (mocked)

3. **E2E**
   - Fluxo completo de importação
   - Fluxo de processamento
   - Geração de relatórios

---

## 📊 Métricas de Sucesso

### Performance

- ✅ Importação: < 5 min para 10k registros
- ✅ Listagem: < 2s para 1000 registros
- ✅ Atualização: < 500ms
- ✅ Relatório: < 10s

### Qualidade

- ✅ 0 erros críticos
- ✅ Cobertura de testes > 80%
- ✅ 0 vulnerabilidades high/critical

### Funcionalidade

- ✅ 100% das funcionalidades migradas
- ✅ 0 regressões
- ✅ Usuários satisfeitos (pesquisa > 8/10)

---

## 🔒 Segurança

### Autenticação e Autorização

- JWT tokens
- Refresh tokens
- Controle de permissões por perfil
- Logs de auditoria

### Dados Sensíveis

- Variáveis de ambiente para credenciais
- Criptografia de tokens de API
- Sanitização de inputs
- Validação rigorosa

### API Externa

- Rate limiting
- Timeout configurável
- Retry com backoff exponencial
- Circuit breaker

---

## 📚 Documentação

### Técnica

- [ ] README do projeto
- [ ] Swagger/OpenAPI completo
- [ ] Diagramas de arquitetura
- [ ] ERD das tabelas envolvidas
- [ ] Guia de contribuição

### Operacional

- [ ] Manual de deploy
- [ ] Guia de troubleshooting
- [ ] Procedimentos de backup
- [ ] Monitoramento e alertas

### Usuário

- [ ] Guia de migração
- [ ] Comparativo legacy vs novo
- [ ] FAQ

---

## 🎯 Riscos e Mitigações

### Alto

| Risco                                   | Impacto | Probabilidade | Mitigação                                        |
| --------------------------------------- | ------- | ------------- | ------------------------------------------------ |
| Incompatibilidade com procedures Oracle | Alto    | Média         | Testes extensivos, manter procedures inalteradas |
| Performance inferior ao legacy          | Alto    | Baixa         | Profiling, otimização de queries, cache          |
| Problemas na API externa Unimed         | Alto    | Média         | Fallback para SOAP, retry logic, alertas         |

### Médio

| Risco                                  | Impacto | Probabilidade | Mitigação                              |
| -------------------------------------- | ------- | ------------- | -------------------------------------- |
| Divergência de dados durante transição | Médio   | Média         | Validação cruzada, logs detalhados     |
| Resistência dos usuários               | Médio   | Baixa         | Treinamento, suporte intensivo         |
| Prazo estourado                        | Médio   | Média         | Buffer de 20%, priorização de features |

### Baixo

| Risco                   | Impacto | Probabilidade | Mitigação                        |
| ----------------------- | ------- | ------------- | -------------------------------- |
| Bugs em edge cases      | Baixo   | Alta          | Testes extensivos, feature flags |
| Documentação incompleta | Baixo   | Média         | Revisões periódicas              |

---

## 💰 Estimativa de Esforço

### Desenvolvimento

| Fase                  | Horas    | Dias úteis  |
| --------------------- | -------- | ----------- |
| 1. Preparação         | 40h      | 5           |
| 2. Importação         | 80h      | 10          |
| 3. Colaboradores      | 80h      | 10          |
| 4. Processos          | 80h      | 10          |
| 5. Relatórios         | 80h      | 10          |
| 6. Utilitários        | 40h      | 5           |
| 7. Testes/Homologação | 80h      | 10          |
| 8. Deploy             | 40h      | 5           |
| **Total**             | **520h** | **65 dias** |

### Equipe Sugerida

- 1 Tech Lead (full-time)
- 2 Desenvolvedores Backend (full-time)
- 1 QA (part-time últimas fases)
- 1 DBA (consultoria)

### Timeline

- **Início**: Após aprovação
- **Duração**: ~3 meses (considerando 1 desenvolvedor full-time)
- **Término previsto**: Q2 2026

---

## 📞 Próximos Passos

### Imediato

1. ✅ **Revisão e aprovação deste plano**
2. ⏭️ Alocação de recursos
3. ⏭️ Setup de ambiente
4. ⏭️ Início da Fase 1

### Após Aprovação

1. Kickoff meeting com o time
2. Setup de ferramentas (Jira, Git, CI/CD)
3. Definição de sprints (2 semanas)
4. Início do desenvolvimento

---

## 📝 Notas Finais

### Observações Importantes

1. **Banco de Dados**
   - Estrutura permanece inalterada
   - Stored procedures mantidas
   - Views existentes reutilizadas

2. **Compatibilidade**
   - API REST moderna
   - Frontend legacy funcionará durante transição
   - Novo frontend Vue.js em fase posterior

3. **Manutenibilidade**
   - Código limpo e documentado
   - Testes automatizados
   - Arquitetura escalável

### Premissas

- ✅ Acesso ao banco Oracle de desenvolvimento
- ✅ Credenciais de API Unimed disponíveis
- ✅ Ambiente de testes disponível
- ✅ Equipe com conhecimento NestJS e Oracle
- ✅ Aprovação para modificar procedures se necessário

### Exclusões do Escopo

Esta fase **NÃO** inclui:

- ❌ Migração do frontend (Vue.js - fase posterior)
- ❌ Mudanças no banco de dados
- ❌ Integração com outras operadoras além de Unimed/HapVida
- ❌ App mobile

---

## 📎 Anexos

### A. Mapeamento de Endpoints Legacy → Novo

| Legacy                       | Método | Novo Endpoint                                       |
| ---------------------------- | ------ | --------------------------------------------------- |
| `?acao=saveUnimedCnpj`       | POST   | `POST /planos-saude/importacao/unimed/cnpj`         |
| `?acao=saveUnimedContrato`   | POST   | `POST /planos-saude/importacao/unimed/contrato`     |
| `?acao=leCSV`                | POST   | `POST /planos-saude/importacao/hapvida`             |
| `?acao=Buscar`               | GET    | `GET /planos-saude/colaboradores`                   |
| `?acao=update`               | POST   | `PATCH /planos-saude/colaboradores/:cpf/exportacao` |
| `?acao=Execute`              | POST   | `POST /planos-saude/processos/executar`             |
| `?acao=RelatorioColaborador` | GET    | `GET /planos-saude/relatorios/colaborador`          |

### B. Tabelas do Banco de Dados

**Principais:**

- `gc.uni_dados_cobranca` - Dados de cobrança Unimed
- `gc.uni_resumo_colaborador` - Resumo por colaborador
- `gc.vw_uni_resumo_colaborador` - View de resumo
- `gc.uni_dados_contrato` - Contratos ativos
- `nbs.hapvida_plano` - Dados HapVida
- `gc.mcw_processo` - Cadastro de processos
- `gc.mcw_processo_log` - Log de execução
- `gc.api_gc_servicos` - Tokens de API

**Procedures:**

- `gc.PKG_UNI_SAUDE.p_uni_resumo` - Gera resumo
- `gc.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL` - Exportação

### C. Variáveis de Ambiente

```env
# Database
ORACLE_HOST=
ORACLE_PORT=1521
ORACLE_SERVICE=
ORACLE_USER=
ORACLE_PASSWORD=
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10

# Unimed API
UNIMED_API_URL=https://ws.unimedcuiaba.coop.br/api
UNIMED_API_USER=cometa
UNIMED_API_PASSWORD=C0m3t42019

# App
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1d

# Upload
MAX_FILE_SIZE=10485760  # 10MB
```

---

## ✅ Checklist de Aprovação

- [ ] Arquitetura revisada e aprovada
- [ ] Stack tecnológica aprovada
- [ ] Cronograma validado
- [ ] Estimativa de esforço aceita
- [ ] Riscos identificados e mitigações aprovadas
- [ ] Equipe alocada
- [ ] Budget aprovado
- [ ] Stakeholders alinhados

---

**Documento preparado por**: Equipe de Desenvolvimento  
**Data**: 31 de Dezembro de 2025  
**Versão**: 1.0  
**Status**: 🟡 Aguardando Aprovação

---

## 📧 Contatos

Para dúvidas ou esclarecimentos sobre este plano:

- **Tech Lead**: [nome]@[empresa].com
- **Product Owner**: [nome]@[empresa].com
- **Gerente de Projetos**: [nome]@[empresa].com

---

**Nota**: Este documento é vivo e será atualizado conforme necessário durante o desenvolvimento. Todas as mudanças significativas serão documentadas e comunicadas aos stakeholders.
