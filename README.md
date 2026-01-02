# API Planos de Saúde

API moderna para gerenciamento de planos de saúde (Unimed e HapVida), desenvolvida em NestJS + TypeScript + Oracle Database.

## 🎯 Status do Projeto

| Fase                             | Status        | Progresso |
| -------------------------------- | ------------- | --------- |
| Fase 1 - Infraestrutura Base     | ✅ Concluída  | 100%      |
| Fase 2 - Módulo de Importação    | ✅ Concluída  | 100%      |
| Fase 3 - Módulo de Colaboradores | 📋 Próxima    | 0%        |
| Fase 4 - Módulo de Processos     | 📋 Aguardando | 0%        |
| Fase 5 - Módulo de Relatórios    | 📋 Aguardando | 0%        |

**Última atualização**: 02/01/2026

## 📋 Sobre o Projeto

Esta API é uma modernização do módulo "uni" do sistema legado (npd-legacy) em PHP. O projeto mantém **exatamente a mesma lógica de negócio**, alterando apenas a tecnologia utilizada.

### Filosofia do Projeto

> **"Mesma lógica, tecnologia moderna"**

- ✅ Todas as regras de negócio permanecem no banco de dados Oracle (procedures, views, triggers)
- ✅ A aplicação é apenas uma camada de acesso moderna e bem documentada
- ✅ Zero mudanças nas procedures existentes - apenas chamadas via node-oracledb
- ✅ Código transparente: qualquer desenvolvedor pode ver que apenas chama o banco

### Funcionalidades Implementadas

#### ✅ Módulo de Importação (Fase 2)

1. **Importação Unimed**
   - ✅ Integração com API REST da Unimed Cuiabá
   - ✅ Busca por CNPJ
   - ✅ Busca por Contrato
   - ✅ Cache de token de autenticação
   - ✅ Inserção em lote com transação

2. **Importação HapVida**
   - ✅ Upload de arquivo CSV
   - ✅ Parsing e validação de dados
   - ✅ Conversão de valores monetários e datas
   - ✅ Inserção em lote com transação
   - ✅ Relatório de erros por linha

#### 📋 Próximas Funcionalidades (Fase 3)

3. **Gestão de Colaboradores**
   - Listagem com filtros (mês, ano, status, operadora)
   - Atualização de valores e status de exportação
   - Operações em lote

#### 📋 Funcionalidades Futuras

4. **Processos Automatizados**
   - Execução de resumo de colaboradores
   - Fechamento de comissões MCW
   - Exportação para TOTVS

5. **Relatórios Gerenciais**
   - 6 tipos de relatórios Jasper
   - Exportação em PDF/Excel
   - Histórico de importações

## 🛠 Tecnologias Utilizadas

- **NestJS 11** - Framework enterprise para Node.js
- **TypeScript** - Tipagem estática e IntelliSense
- **Oracle Database** - Database principal (schemas: gc, nbs)
- **node-oracledb 6.10** - Driver nativo Oracle (SEM ORM)
- **Swagger/OpenAPI** - Documentação automática da API
- **class-validator** - Validação de DTOs
- **Axios** - Cliente HTTP para APIs externas
- **date-fns** - Manipulação de datas

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ ou 20+
- pnpm (gerenciador de pacotes)
- Oracle Database (acesso aos schemas gc e nbs)
- Oracle Instant Client instalado no sistema

### Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd api-planos-saude

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# 4. Compile o projeto
pnpm run build

# 5. Execute em modo desenvolvimento
pnpm run start:dev

# 6. Ou execute em modo produção
pnpm run start:prod
```

### Acessando a Aplicação

Após iniciar, acesse:

- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 📁 Estrutura do Projeto

```
api-planos-saude/
├── src/
│   ├── common/                    # DTOs, filters e interceptors compartilhados
│   │   ├── dtos/                  # DTOs reutilizáveis
│   │   ├── filters/               # Filtros de exceção
│   │   └── interceptors/          # Interceptors globais
│   ├── config/                    # Configurações da aplicação
│   │   ├── app.config.ts          # Configurações gerais
│   │   ├── database.config.ts     # Configuração Oracle
│   │   └── integrations.config.ts # Configuração APIs externas
│   ├── modules/                   # Módulos de negócio
│   │   ├── planos-saude/          # Módulo principal
│   │   │   └── interfaces/        # Interfaces TypeScript (tipos)
│   │   ├── importacao/            # Módulo de importação (em desenvolvimento)
│   │   └── exportacao/            # Módulo de exportação (em desenvolvimento)
│   ├── shared/                    # Módulos compartilhados globais
│   │   ├── database/              # OracleService (core)
│   │   ├── logger/                # LoggerService
│   │   └── cache/                 # CacheService
│   ├── app.module.ts              # Módulo raiz
│   └── main.ts                    # Bootstrap da aplicação
├── uploads/                       # Diretório de uploads (CSV HapVida)
├── temp/                          # Diretório temporário
├── reports/                       # Relatórios Jasper
├── .env                           # Variáveis de ambiente (NÃO COMMITADO)
├── .env.example                   # Template de configuração
└── README.md                      # Este arquivo
```

## 🏗 Arquitetura

### Camadas da Aplicação

```
Controller → Service → Repository → Oracle Database
    ↓          ↓           ↓              ↓
  Rotas    Orquestra   Queries      Procedures
  Swagger  Validações   Simples      Views
  DTOs     Logs         Thin Layer   Triggers
```

### Princípios Fundamentais

1. **Separação de Responsabilidades**
   - Controllers: Rotas e validação de entrada
   - Services: Orquestração de lógica
   - Repositories: Acesso ao banco (queries simples)
   - Database: Toda a lógica de negócio (procedures/views)

2. **Código Transparente**

   ```typescript
   // ✅ BOM - Código transparente
   async getResumoColaborador(mes: number, ano: number) {
     return this.oracleService.query(
       'SELECT * FROM gc.vw_uni_resumo_colaborador WHERE mes_ref = :mes AND ano_ref = :ano',
       { mes, ano }
     );
   }

   // ❌ EVITAR - Lógica no código
   async calcularValorLiquido(titular, dependentes) {
     return titular + dependentes * 0.5; // NÃO! Isso deve estar no banco
   }
   ```

3. **Zero Mudanças no Banco**
   - Procedures existentes são chamadas via `oracleService.callProcedure()`
   - Views existentes são consultadas via `oracleService.query()`
   - Triggers e constraints continuam funcionando normalmente

## 🔌 Integrações

### Unimed Cuiabá

- **REST API**: https://ws.unimedcuiaba.coop.br/api
- **SOAP (Fallback)**: https://ws.unimedcuiaba.coop.br/soap
- Autenticação: Basic Auth (configurado no .env)

### HapVida

- Importação via arquivo CSV
- Upload manual ou programático
- Parsing e validação automática

## 📊 Banco de Dados

### Schemas Utilizados

- **gc**: Schema principal (dados de cobrança, colaboradores, processos)
- **nbs**: Schema secundário (planos HapVida)

### Principais Tables/Views

- `gc.uni_dados_cobranca` - Dados brutos Unimed
- `gc.vw_uni_resumo_colaborador` - View consolidada
- `nbs.hapvida_plano` - Dados HapVida
- `gc.mcw_processo` - Controle de processos

### Stored Procedures

- `gc.PKG_UNI_SAUDE.p_uni_resumo` - Gera resumo de colaboradores
- `gc.PGK_GLOBAL.P_MCW_FECHA_COMISSAO_GLOBAL` - Fecha comissões

## 🧪 Testes

```bash
# Testes unitários
pnpm run test

# Testes e2e
pnpm run test:e2e

# Cobertura de testes
pnpm run test:cov
```

## 📝 Convenções de Código

### Nomenclatura

- **Interfaces**: PascalCase (ex: `ColaboradorResumo`)
- **DTOs**: PascalCase com sufixo Dto (ex: `ImportarUnimedDto`)
- **Services**: PascalCase com sufixo Service (ex: `ImportacaoService`)
- **Métodos**: camelCase (ex: `importarDadosUnimed()`)
- **Variáveis**: camelCase (ex: `mesReferencia`)

### Comentários

```typescript
// ✅ BOM - Documentação clara da intenção
/**
 * Importa dados da Unimed para o mês/ano especificado.
 *
 * IMPORTANTE: Esta função apenas chama a API e insere no banco.
 * Todo o processamento de cálculos é feito pela view gc.vw_uni_resumo_colaborador.
 */
```

## 🚧 Status do Projeto

### ✅ Fase 1 - Preparação e Setup (CONCLUÍDA)

- ✅ Dependências instaladas
- ✅ Configuração de ambiente
- ✅ OracleService implementado
- ✅ Módulos globais (Logger, Cache)
- ✅ Interfaces TypeScript
- ✅ DTOs base
- ✅ Swagger configurado
- ✅ Interceptors e Filters

### 🔄 Fase 2 - Importação (EM ANDAMENTO)

- ⏳ UnimedApiService
- ⏳ HapVidaImportacaoService
- ⏳ Repositories
- ⏳ Controllers

### ⏳ Fase 3 - Colaboradores (PENDENTE)

- ⏳ CRUD de colaboradores
- ⏳ Filtros e paginação
- ⏳ Operações em lote

### ⏳ Fase 4 - Processos (PENDENTE)

- ⏳ Execução de procedures
- ⏳ Controle de processos MCW

### ⏳ Fase 5 - Relatórios (PENDENTE)

- ⏳ Integração com Jasper
- ⏳ 6 tipos de relatórios

## 📚 Documentação Adicional

- [NestJS Documentation](https://docs.nestjs.com)
- [Oracle node-oracledb](https://oracle.github.io/node-oracledb/)
- [Swagger/OpenAPI](https://swagger.io/)

## 👥 Equipe de Desenvolvimento

Projeto desenvolvido internamente para modernização do sistema legado.

## 📄 Licença

Proprietary - Todos os direitos reservados.
$ mau deploy

```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
```
