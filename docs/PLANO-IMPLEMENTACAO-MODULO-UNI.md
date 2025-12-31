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

Migrar o módulo UNI do NPD-Legacy (PHP) para NestJS, **mantendo 100% da lógica funcional existente** e aplicando melhorias de arquitetura, seguindo os princípios SOLID, Clean Code e as boas práticas da comunidade NestJS.

### Objetivos Específicos

- ✅ Manter 100% das funcionalidades atuais **com a mesma lógica**
- ✅ Preservar **TODAS** stored procedures e views do Oracle
- ✅ **Não alterar** regras de negócio do banco de dados
- ✅ Traduzir PHP → TypeScript/NestJS (mesma sequência de operações)
- ✅ Implementar arquitetura moderna e testável
- ✅ Melhorar: UX, validações de entrada, logs, tratamento de erros
- ✅ Preparar base para futura migração do front-end para Vue.js
- ✅ Adicionar documentação (Swagger) e testes automatizados
- ✅ Facilitar manutenção futura com código limpo

### Restrições

- ❌ **NÃO** alterar stored procedures existentes
- ❌ **NÃO** modificar views do banco
- ❌ **NÃO** reescrever lógica que está no Oracle
- ❌ **NÃO** mudar estrutura de tabelas
- ✅ **SIM** traduzir código PHP para TypeScript mantendo mesma lógica
- ✅ **SIM** adicionar melhorias em camadas acima do banco (validação, logs, UX)

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
│   │   ├── interfaces/             # TypeScript Interfaces (tipos puros)
│   │   │   ├── unimed.interface.ts
│   │   │   ├── hapvida.interface.ts
│   │   │   ├── colaborador-resumo.interface.ts
│   │   │   └── processo-mcw.interface.ts
│   │   │
│   │   ├── repositories/           # Camada de persistência (wrappers de queries)
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

### 2. Filosofia de Implementação: "Mesma Lógica, Tecnologia Moderna"

#### Princípio Fundamental

**🎯 Objetivo: Fazer EXATAMENTE o que o legacy faz, mas com tecnologia moderna**

**NÃO vamos:**
- ❌ Alterar stored procedures
- ❌ Alterar views
- ❌ Mudar regras de negócio
- ❌ Modificar validações existentes
- ❌ Reescrever lógica do banco

**Vamos apenas:**
- ✅ Traduzir PHP → TypeScript/NestJS
- ✅ Manter mesma sequência de chamadas
- ✅ Preservar mesma lógica de validação
- ✅ Usar REST API quando disponível (em vez de SOAP)
- ✅ Adicionar melhorias em: logs, tratamento de erros, UX
- ✅ Documentar com Swagger
- ✅ Adicionar testes automatizados

**O banco de dados faz o trabalho pesado, a API apenas:**
1. ✅ Valida entrada (mesmas validações do legacy)
2. ✅ Chama procedures/views do banco (mesmas chamadas)
3. ✅ Formata resposta (JSON em vez de HTML)
4. ✅ Trata erros (com logs estruturados)

**Código auto-explicativo:**
```typescript
// ❌ EVITAR - Lógica de negócio no app
async importarUnimed(dados: ImportarUnimedDto) {
  // 200 linhas de código processando, validando, calculando...
}

// ✅ PREFERIR - Transparente e direto
async importarUnimed(dados: ImportarUnimedDto): Promise<ImportacaoResponse> {
  // Chama a API externa
  const dadosUnimed = await this.unimedApiClient.buscarPorCNPJ(dados);
  
  // Insere no banco (que já faz todas as validações e processamentos)
  await this.oracleDb.execute(
    'INSERT INTO gc.uni_dados_cobranca (...) VALUES (...)'
  );
  
  // Executa a procedure que faz o resumo
  // (toda a lógica está aqui dentro, testada e funcionando há anos)
  await this.oracleDb.callProcedure(
    'gc.PKG_UNI_SAUDE.p_uni_resumo',
    { mes: dados.mes, ano: dados.ano }
  );
  
  return { success: true, registros: dadosUnimed.length };
}
```

**Benefícios:**
- 🔍 **Manutenção fácil**: "Ah, só chama a procedure X"
- 🐛 **Debug simples**: Problema está no banco ou na API externa
- 🚀 **Performance**: Lógica otimizada no Oracle
- 📝 **Menos código**: Menos bugs, menos testes
- ♻️ **Reuso**: Procedures já testadas e validadas
- ✅ **Confiança**: Lógica já funciona há anos em produção

#### Comparação: Legacy vs Novo (Lógica Idêntica)

**Exemplo 1: Importação Unimed por CNPJ**

```php
// ❌ LEGACY (PHP) - UnimedController.php
case 'saveUnimedCnpj':
  $Unimed = new Unimed();
  $UnimedDAO = new UnimedDAO($Unimed);
  $pMes = addslashes($_POST['mes']);
  $pAno = addslashes($_POST['ano']);
  $periodo = str_pad($pMes, 2, "0", STR_PAD_LEFT) . $pAno;
  $Unimed->setPeriodo($periodo);
  $Unimed->setMesRef($pMes);
  $Unimed->setAnoRef($pAno);
  $result = $UnimedDAO->getDadosUniCnpj();
  // ... resto do código
  break;
```

```typescript
// ✅ NOVO (NestJS) - unimed-importacao.service.ts
// MESMA LÓGICA, código mais limpo e tipado
async importarPorCNPJ(dto: ImportarUnimedDto): Promise<ImportacaoResponse> {
  // 1. Formata período (mesma lógica)
  const periodo = `${dto.mes.toString().padStart(2, '0')}${dto.ano}`;
  
  // 2. Busca empresas para processar (mesma query)
  const empresas = await this.repository.buscarEmpresasProcessarUnimed();
  
  // 3. Para cada empresa, chama API e insere (mesma lógica)
  for (const empresa of empresas) {
    const dados = await this.unimedApi.buscarPorCNPJ({
      cnpj: empresa.cnpj,
      periodo
    });
    
    // 4. Insere no banco (mesmas colunas, mesma tabela)
    await this.repository.inserirDadosCobranca(dados, dto.mes, dto.ano);
  }
  
  return { success: true, registros: total };
}
```

**Exemplo 2: Buscar Colaboradores**

```php
// ❌ LEGACY (PHP)
case 'Buscar':
  $query = "select * from gc.vw_uni_resumo_colaborador a ";
  $query .= " where 1=1 ";
  $query .= !empty($empresa) ? " and a.cod_empresa = ".$EmpresaDAO->_isCodEmpresa() : "";
  $query .= !empty($mes) ? " and a.mes_ref = '{$mes}'" : "";
  $query .= !empty($ano) ? " and a.ano_ref = '{$ano}'" : "";
  $result = $DB->oQuery($query);
  // ... processa resultado
  break;
```

```typescript
// ✅ NOVO (NestJS) - colaborador.repository.ts
// MESMA QUERY, parametrização mais segura
async buscarColaboradores(filtros: BuscarColaboradorDto) {
  const query = `
    SELECT * FROM gc.vw_uni_resumo_colaborador a
    WHERE 1=1
      AND (:empresa IS NULL OR a.cod_empresa = :empresa)
      AND a.mes_ref = :mes
      AND a.ano_ref = :ano
    ORDER BY a.cod_band, a.apelido, a.colaborador
  `;
  
  return this.db.query<ColaboradorResumo>(query, {
    empresa: filtros.empresa || null,
    mes: filtros.mes,
    ano: filtros.ano
  });
}
```

**Exemplo 3: Executar Procedure de Resumo**

```php
// ❌ LEGACY (PHP)
case 'save':
  $query = 'begin gc.PKG_UNI_SAUDE.p_uni_resumo('
         . $Unimed->getMesRef() . ','
         . $Unimed->getAnoRef() . '); end;';
  $result = $DB->oQuery($query);
  break;
```

```typescript
// ✅ NOVO (NestJS) - processo-executor.service.ts
// MESMA PROCEDURE, mesmos parâmetros
async executarResumo(mes: number, ano: number): Promise<void> {
  await this.db.callProcedure('gc.PKG_UNI_SAUDE.p_uni_resumo', {
    mes,
    ano
  });
}
```

**O que muda:**
- ✅ Sintaxe moderna (TypeScript)
- ✅ Type-safety
- ✅ Parametrização segura (SQL injection)
- ✅ Async/await
- ✅ Melhor tratamento de erros

**O que NÃO muda:**
- ✅ Mesma procedure
- ✅ Mesmos parâmetros
- ✅ Mesma lógica
- ✅ Mesmo resultado

---

### 3. Onde Adicionar Melhorias (Sem Alterar Lógica Core)

#### Melhorias Permitidas

**1. Validações de Entrada (Antes de chamar o banco)**
```typescript
// ✅ Adicionar validações com class-validator
export class ImportarUnimedDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @ApiProperty({ example: 12, description: 'Mês de referência' })
  mes: number;

  @IsInt()
  @Min(2020)
  @Max(2030)
  @ApiProperty({ example: 2024, description: 'Ano de referência' })
  ano: number;
}
// Lógica do banco permanece intacta
```

**2. Logging Estruturado**
```typescript
// ✅ Adicionar logs detalhados
this.logger.log(`Iniciando importação Unimed - Período: ${mes}/${ano}`);
try {
  await this.executarImportacao(mes, ano);
  this.logger.log(`Importação concluída - ${total} registros`);
} catch (error) {
  this.logger.error(`Erro na importação: ${error.message}`, error.stack);
  throw error;
}
// Lógica do banco permanece intacta
```

**3. Tratamento de Erros**
```typescript
// ✅ Erros mais descritivos
try {
  await this.db.callProcedure('gc.PKG_UNI_SAUDE.p_uni_resumo', params);
} catch (error) {
  if (error.message.includes('ORA-01403')) {
    throw new NotFoundException('Dados não encontrados para o período informado');
  }
  if (error.message.includes('ORA-00001')) {
    throw new ConflictException('Dados já importados para este período');
  }
  throw new InternalServerErrorException('Erro ao processar dados');
}
// Procedure continua a mesma
```

**4. Cache (Para Consultas Frequentes)**
```typescript
// ✅ Cache de listas estáticas
@Cacheable({ ttl: 3600 })
async listarEmpresas(): Promise<Empresa[]> {
  return this.repository.buscarEmpresas();
}
// Query do banco permanece a mesma
```

**5. Paginação (Para Listagens Grandes)**
```typescript
// ✅ Adicionar paginação
async buscarColaboradores(
  filtros: BuscarColaboradorDto,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<ColaboradorResumo>> {
  // Query permanece a mesma, apenas adiciona OFFSET/LIMIT
  const query = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT * FROM gc.vw_uni_resumo_colaborador
        WHERE ...
      ) a WHERE ROWNUM <= :endRow
    ) WHERE rnum > :startRow
  `;
  // View continua a mesma
}
```

**6. Documentação Swagger**
```typescript
// ✅ Documentar endpoints
@ApiOperation({ 
  summary: 'Importar dados da Unimed por CNPJ',
  description: 'Chama a API Unimed e executa a mesma lógica do legacy'
})
@ApiResponse({ status: 200, description: 'Importação realizada' })
@ApiResponse({ status: 400, description: 'Dados inválidos' })
// Lógica permanece a mesma
```

**7. Retry Logic (Para APIs Externas)**
```typescript
// ✅ Retry em caso de falha temporária
@Retry({ maxAttempts: 3, backoff: 1000 })
async buscarDadosUnimed(cnpj: string): Promise<any> {
  return this.httpClient.get(`${this.apiUrl}/buscaporperiodocnpj`, { cnpj });
}
// API externa continua a mesma
```

**8. Validação de Permissões (Mais Granular)**
```typescript
// ✅ Guards mais robustos
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('UNI:IMPORTAR')
@Post('importacao/unimed')
async importar() {
  // Lógica de importação permanece a mesma
}
```

#### Melhorias NÃO Permitidas

**❌ NÃO fazer:**
- Reescrever cálculos que estão nas procedures
- Modificar lógica de validação do banco
- Alterar regras de negócio
- Mudar estrutura de dados
- Reimplementar aggregations que estão nas views

**Regra de Ouro:**
> "Se o legacy faz assim, fazemos assim. Apenas com código mais limpo e melhor UX."

---

### 4. Princípios de Design Aplicados

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

**Camadas Simplificadas:**

1. **Controller Layer** - Recebe requisições HTTP, valida com DTOs
2. **Service Layer** - Orquestra chamadas (API externa → Banco → Response)
3. **Repository Layer** - Wrapper fino sobre node-oracledb (sem lógica)
4. **Interface Layer** - TypeScript interfaces para tipos (sem código runtime)

```typescript
// Estrutura típica de um repository
@Injectable()
export class ColaboradorRepository {
  constructor(private readonly db: OracleService) {}

  // Método simples: apenas chama view do banco
  async buscar(filtros: BuscarColaboradorDto): Promise<ColaboradorResumo[]> {
    const query = `
      SELECT * FROM gc.vw_uni_resumo_colaborador
      WHERE cod_empresa = :empresa
        AND mes_ref = :mes
        AND ano_ref = :ano
    `;
    
    return this.db.query<ColaboradorResumo>(query, filtros);
  }

  // Atualização: apenas UPDATE direto
  async atualizarExportacao(cpf: string, exporta: 'S' | 'N'): Promise<void> {
    await this.db.execute(
      'UPDATE gc.uni_resumo_colaborador SET exporta = :exporta WHERE codigo_cpf = :cpf',
      { exporta, cpf }
    );
  }
}
```

**Padrões Aplicados:**

- **Repository Pattern** (simplificado) - Apenas abstração de queries
- **Dependency Injection** - Injeção de serviços NestJS
- **DTO Pattern** - Validação de entrada/saída
- **Interface Segregation** - Tipos TypeScript bem definidos
- **Facade Pattern** - Service orquestra chamadas, não implementa lógica

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

**Oracle Database + node-oracledb (Driver Nativo)**

- ✅ **Por quê?**
  - Banco existente - **ZERO alterações necessárias**
  - Driver oficial Oracle para Node.js
  - Suporte nativo a stored procedures, packages e views
  - Performance máxima - sem overhead de ORM
  - Conexão pool para escalabilidade
  - **Transparência total**: código é apenas wrapper de chamadas ao banco

**TypeScript Interfaces (Definição de Tipos)**

- ✅ **Por quê?**
  - Type-safety completo sem overhead de runtime
  - Documentação viva dos modelos de dados
  - IntelliSense no VS Code
  - Validação em tempo de desenvolvimento
  - Zero impacto na execução - apenas tipos

**Por que NÃO usar ORM?**

- ❌ TypeORM/Prisma adicionam complexidade desnecessária
- ❌ Toda lógica já está no banco (procedures testadas e funcionais)
- ❌ ORMs tentam "gerenciar" o banco (não queremos isso)
- ✅ **Princípio**: Banco faz o trabalho, app apenas chama e formata

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

## � Exemplo Prático Completo

Para ilustrar a abordagem "zero lógica no app", veja um exemplo completo:

### 1. Interface TypeScript (Tipos Claros)

```typescript
// src/modules/planos-saude/interfaces/colaborador-resumo.interface.ts

/**
 * Representa o resumo de um colaborador com plano de saúde.
 * Mapeamento direto da view: gc.vw_uni_resumo_colaborador
 */
export interface ColaboradorResumo {
  // Identificação
  codigoCpf: string;        // codigo_cpf no banco
  colaborador: string;
  apelido: string;
  
  // Empresa
  codEmpresa: number;       // cod_empresa
  codColigada: number;      // codcoligada
  codFilial: number;        // codfilial
  codBand: string;          // cod_band
  
  // Período
  mesRef: number;           // mes_ref
  anoRef: number;           // ano_ref
  
  // Valores
  mTitular: string;         // m_titular (formatado como string R$)
  mDependente: string;      // m_dependente
  valorConsumo: string;     // valor_consumo
  percEmpresa: string;      // perc_empresa
  valorTotal: string;       // valor_total
  valorLiquido: string;     // valor_liquido
  
  // Status
  ativo: 'S' | 'N';
  exporta: 'S' | 'N';
}
```

### 2. Repository (Wrapper de Queries)

```typescript
// src/modules/planos-saude/repositories/colaborador.repository.ts

import { Injectable } from '@nestjs/common';
import { OracleService } from '@/shared/database/oracle.service';
import { ColaboradorResumo } from '../interfaces/colaborador-resumo.interface';
import { BuscarColaboradorDto } from '../dtos/colaborador/buscar-colaborador.dto';

@Injectable()
export class ColaboradorRepository {
  constructor(private readonly db: OracleService) {}

  /**
   * Busca colaboradores na view do banco.
   * IMPORTANTE: Toda a lógica de cálculo e agregação está na view.
   * Este método apenas executa a query e retorna os dados.
   */
  async buscarColaboradores(
    filtros: BuscarColaboradorDto
  ): Promise<ColaboradorResumo[]> {
    // Query simples - view já traz tudo calculado
    const query = `
      SELECT 
        a.codigo_cpf as "codigoCpf",
        a.colaborador,
        a.apelido,
        a.cod_empresa as "codEmpresa",
        a.codcoligada as "codColigada",
        a.codfilial as "codFilial",
        a.cod_band as "codBand",
        a.mes_ref as "mesRef",
        a.ano_ref as "anoRef",
        a.m_titular as "mTitular",
        a.m_dependente as "mDependente",
        a.valor_consumo as "valorConsumo",
        a.perc_empresa as "percEmpresa",
        a.valor_total as "valorTotal",
        a.valor_liquido as "valorLiquido",
        a.ativo,
        a.exporta
      FROM gc.vw_uni_resumo_colaborador a
      WHERE 1=1
        AND (:empresa IS NULL OR a.cod_empresa = :empresa)
        AND a.mes_ref = :mes
        AND a.ano_ref = :ano
        AND (:cpf IS NULL OR LTRIM(a.codigo_cpf, '0000') = LTRIM(:cpf, '0000'))
      ORDER BY a.cod_band, a.apelido, a.colaborador
    `;

    return this.db.query<ColaboradorResumo>(query, {
      empresa: filtros.empresa || null,
      mes: filtros.mes,
      ano: filtros.ano,
      cpf: filtros.cpf || null
    });
  }

  /**
   * Atualiza status de exportação de um colaborador.
   * IMPORTANTE: Apenas um UPDATE simples, sem lógica.
   */
  async atualizarExportacao(
    cpf: string,
    mes: number,
    ano: number,
    exporta: 'S' | 'N'
  ): Promise<void> {
    await this.db.execute(
      `UPDATE gc.uni_resumo_colaborador 
       SET exporta = :exporta
       WHERE codigo_cpf = :cpf 
         AND mes_ref = :mes 
         AND ano_ref = :ano`,
      { exporta, cpf, mes, ano }
    );
  }
}
```

### 3. Service (Orquestração Simples)

```typescript
// src/modules/planos-saude/services/colaborador/colaborador.service.ts

import { Injectable } from '@nestjs/common';
import { ColaboradorRepository } from '../../repositories/colaborador.repository';
import { BuscarColaboradorDto } from '../../dtos/colaborador/buscar-colaborador.dto';
import { ColaboradorResumo } from '../../interfaces/colaborador-resumo.interface';

@Injectable()
export class ColaboradorService {
  constructor(
    private readonly colaboradorRepo: ColaboradorRepository
  ) {}

  /**
   * Busca colaboradores com filtros.
   * Este método apenas:
   * 1. Chama o repository (que chama a view do banco)
   * 2. Retorna os dados
   * 
   * Toda a lógica de cálculo está na view gc.vw_uni_resumo_colaborador
   */
  async buscarColaboradores(
    filtros: BuscarColaboradorDto
  ): Promise<ColaboradorResumo[]> {
    return this.colaboradorRepo.buscarColaboradores(filtros);
  }

  /**
   * Atualiza status de exportação.
   * Apenas chama o repository que faz UPDATE.
   */
  async atualizarExportacao(
    cpf: string,
    mes: number,
    ano: number,
    exporta: 'S' | 'N'
  ): Promise<{ mensagem: string }> {
    await this.colaboradorRepo.atualizarExportacao(cpf, mes, ano, exporta);
    
    const acao = exporta === 'S' ? 'readicionado' : 'não será enviado';
    return {
      mensagem: `O valor da Unimed referente ao mês ${mes} foi ${acao} ao Colaborador`
    };
  }
}
```

### 4. Controller (Rotas HTTP)

```typescript
// src/modules/planos-saude/controllers/colaborador.controller.ts

import { Controller, Get, Patch, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ColaboradorService } from '../services/colaborador/colaborador.service';
import { BuscarColaboradorDto } from '../dtos/colaborador/buscar-colaborador.dto';
import { AtualizarExportacaoDto } from '../dtos/colaborador/atualizar-exportacao.dto';

@ApiTags('Planos de Saúde - Colaboradores')
@Controller('planos-saude/colaboradores')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar colaboradores com filtros' })
  async buscar(@Query() filtros: BuscarColaboradorDto) {
    const dados = await this.colaboradorService.buscarColaboradores(filtros);
    return {
      success: true,
      data: dados,
      total: dados.length
    };
  }

  @Patch(':cpf/exportacao')
  @ApiOperation({ summary: 'Atualizar status de exportação' })
  async atualizarExportacao(
    @Param('cpf') cpf: string,
    @Body() dto: AtualizarExportacaoDto
  ) {
    const resultado = await this.colaboradorService.atualizarExportacao(
      cpf,
      dto.mes,
      dto.ano,
      dto.exporta
    );
    return {
      success: true,
      message: resultado.mensagem
    };
  }
}
```

### 5. Service de Banco (Camada de Abstração Mínima)

```typescript
// src/shared/database/oracle.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as oracledb from 'oracledb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private pool: oracledb.Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = await oracledb.createPool({
      user: this.configService.get('ORACLE_USER'),
      password: this.configService.get('ORACLE_PASSWORD'),
      connectString: this.configService.get('ORACLE_CONNECT_STRING'),
      poolMin: 2,
      poolMax: 10
    });
  }

  async onModuleDestroy() {
    await this.pool.close();
  }

  /**
   * Executa uma query SELECT e retorna os resultados tipados.
   */
  async query<T>(
    sql: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const connection = await this.pool.getConnection();
    try {
      const result = await connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      return result.rows as T[];
    } finally {
      await connection.close();
    }
  }

  /**
   * Executa um comando (INSERT, UPDATE, DELETE).
   */
  async execute(
    sql: string,
    params: Record<string, any> = {}
  ): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(sql, params, { autoCommit: true });
    } finally {
      await connection.close();
    }
  }

  /**
   * Chama uma stored procedure.
   */
  async callProcedure(
    procedureName: string,
    params: Record<string, any> = {}
  ): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `BEGIN ${procedureName}(${Object.keys(params).map(k => `:${k}`).join(', ')}); END;`,
        params,
        { autoCommit: true }
      );
    } finally {
      await connection.close();
    }
  }
}
```

### Resultado: Código Transparente

Quando alguém abre o arquivo, vê:

✅ **Repository**: "Ah, só faz SELECT na view"
✅ **Service**: "Ah, só chama o repository e retorna"
✅ **Controller**: "Ah, só valida e chama o service"
✅ **Interfaces**: "Ah, define os tipos do que vem do banco"

**Zero surpresas. Zero lógica escondida. Tudo transparente.**

---

## �📝 Endpoints da API

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
  "oracledb": "^6.6.0",           // Driver nativo Oracle - SEM ORM
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

**Observação**: Propositalmente NÃO incluímos TypeORM, Prisma ou qualquer ORM. Usamos apenas o driver nativo `oracledb` com TypeScript interfaces para tipos.

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

### Princípio: "Tradução Fiel, Não Reimplementação"

**Abordagem:**
1. Para cada endpoint legacy, criar equivalente 1:1 no NestJS
2. Manter mesma sequência de chamadas ao banco
3. Preservar mesmas validações
4. Usar mesmas procedures e views
5. Adicionar apenas: logs, documentação, testes

### Matriz de Equivalência: Legacy → Novo

| # | Funcionalidade Legacy | Endpoint PHP | Procedure/View Usado | Novo Endpoint NestJS | Alteração na Lógica? |
|---|----------------------|--------------|----------------------|---------------------|----------------------|
| 1 | Importar Unimed CNPJ | `?acao=saveUnimedCnpj` | Inserts em `gc.uni_dados_cobranca` | `POST /planos-saude/importacao/unimed/cnpj` | ❌ Não - mesma lógica |
| 2 | Importar Unimed Contrato | `?acao=saveUnimedContrato` | Inserts em `gc.uni_dados_cobranca` | `POST /planos-saude/importacao/unimed/contrato` | ❌ Não - mesma lógica |
| 3 | Importar HapVida CSV | `?acao=leCSV` | Inserts em `nbs.hapvida_plano` | `POST /planos-saude/importacao/hapvida` | ❌ Não - mesma lógica |
| 4 | Processar Resumo | `?acao=save` | `gc.PKG_UNI_SAUDE.p_uni_resumo` | `POST /planos-saude/importacao/processar-resumo` | ❌ Não - mesma procedure |
| 5 | Buscar Colaboradores | `?acao=Buscar` | `gc.vw_uni_resumo_colaborador` | `GET /planos-saude/colaboradores` | ❌ Não - mesma view |
| 6 | Atualizar Exportação (1) | `?acao=update` | UPDATE em `gc.uni_resumo_colaborador` | `PATCH /planos-saude/colaboradores/:cpf/exportacao` | ❌ Não - mesmo UPDATE |
| 7 | Atualizar Exportação (Todos) | `?acao=updateTodosColaborador` | UPDATE em `gc.uni_resumo_colaborador` | `PATCH /planos-saude/colaboradores/empresa/:id/exportacao` | ❌ Não - mesmo UPDATE |
| 8 | Atualizar Valor Empresa | `?acao=updateValor` | UPDATE em `nbs.mcw_colaborador` | `PATCH /planos-saude/colaboradores/valor-empresa` | ❌ Não - mesmo UPDATE |
| 9 | Buscar Processos | `?acao=Buscarprocesso` | `gc.mcw_processo` | `GET /planos-saude/processos` | ❌ Não - mesma query |
| 10 | Executar Processos | `?acao=Execute` | `gc.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL` | `POST /planos-saude/processos/executar` | ❌ Não - mesma procedure |
| 11 | Histórico Processo | `?acao=HistoricoProcesso` | `gc.vw_mcw_processo_log` | `GET /planos-saude/processos/:codigo/historico` | ❌ Não - mesma view |
| 12 | Exportar TOTVS | `?acao=ExUnimed` | `gc.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL` | `POST /planos-saude/processos/executar` | ❌ Não - mesma procedure |
| 13 | Gerar DIRF | `?acao=unimedDIRF` | Procedure custom | `POST /planos-saude/dirf` | ❌ Não - mesma procedure |
| 14 | Relatório Colaborador | `?acao=RelatorioColaborador` | Jasper Report | `GET /planos-saude/relatorios/colaborador` | ⚠️ Jasper → PDF novo |
| 15 | Relatório Empresa | `?acao=RelatorioEmpresaColaborador` | Jasper Report | `GET /planos-saude/relatorios/empresa-colaboradores` | ⚠️ Jasper → PDF novo |
| 16 | Relatório Pagamento | `?acao=RelatorioPagamento` | Jasper Report | `GET /planos-saude/relatorios/pagamento` | ⚠️ Jasper → PDF novo |
| 17 | Relatório Não Lançamento | `?acao=RelatorioNaoPagamento` | Jasper Report | `GET /planos-saude/relatorios/nao-lancamento` | ⚠️ Jasper → PDF novo |
| 18 | Resumo Departamento | `?acao=resumoDept` | Jasper Report | `GET /planos-saude/relatorios/departamento` | ⚠️ Jasper → PDF novo |
| 19 | Resumo Centro Custo | `?acao=resumoCentroCust` | Jasper Report | `GET /planos-saude/relatorios/centro-custo` | ⚠️ Jasper → PDF novo |

**Legenda:**
- ❌ **Não** - Lógica 100% preservada, apenas traduzida para TypeScript
- ⚠️ **Jasper → PDF novo** - Queries permanecem as mesmas, apenas engine de PDF muda

### Compromisso de Compatibilidade

**Garantias:**
1. ✅ Todos os endpoints legacy terão equivalente 1:1
2. ✅ Mesmas procedures Oracle serão chamadas
3. ✅ Mesmas views serão consultadas
4. ✅ Mesmas validações serão aplicadas
5. ✅ Mesmos resultados serão obtidos

**Única exceção: Relatórios**
- Queries Oracle: **permanecem iguais**
- Engine de geração: Jasper Reports → pdfmake/puppeteer
- Layout: **mantido o mais próximo possível**
- Dados: **exatamente os mesmos**

---

## 🔄 Estratégia de Migração (Técnica)

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

### Verificação de Preservação de Lógica

- [ ] **Procedures Oracle**: Nenhuma foi alterada ou recriada
- [ ] **Views Oracle**: Nenhuma foi modificada
- [ ] **Tabelas**: Estrutura permanece 100% intacta
- [ ] **Queries**: Mesmas queries, apenas parametrização melhorada
- [ ] **Sequência de Operações**: Mantida exatamente como no legacy
- [ ] **Validações**: Mesmas regras aplicadas
- [ ] **Cálculos**: Todos continuam no banco (procedures/views)

### Verificação de Equivalência Funcional

- [ ] **Importação Unimed**: Mesmos dados, mesma tabela, mesma lógica
- [ ] **Importação HapVida**: Mesmo parser CSV, mesma tabela
- [ ] **Busca Colaboradores**: Mesma view, mesmos filtros
- [ ] **Atualizar Exportação**: Mesmo UPDATE
- [ ] **Executar Processos**: Mesmas procedures, mesmos parâmetros
- [ ] **Relatórios**: Mesmas queries (engine PDF diferente)

### Verificação de Melhorias Aplicadas

- [ ] **Validações de Entrada**: DTOs com class-validator
- [ ] **Logging**: Winston com logs estruturados
- [ ] **Tratamento de Erros**: HTTP status codes adequados
- [ ] **Documentação**: Swagger completo
- [ ] **Testes**: Unitários e integração implementados
- [ ] **Type-Safety**: TypeScript em todos os arquivos

### Aprovações

- [ ] Arquitetura revisada e aprovada
- [ ] Stack tecnológica aprovada
- [ ] Cronograma validado
- [ ] Estimativa de esforço aceita
- [ ] Riscos identificados e mitigações aprovadas
- [ ] Equipe alocada
- [ ] Budget aprovado
- [ ] Stakeholders alinhados
- [ ] **DBA confirmou**: Nenhuma alteração no banco será feita
- [ ] **Product Owner confirmou**: Mesma lógica, apenas modernizada

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
