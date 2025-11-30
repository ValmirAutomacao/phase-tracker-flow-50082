## Visão Geral do Projeto

Este é o **EngFlow**, um aplicativo SaaS para gerenciamento de projetos de engenharia, construído com uma arquitetura Jamstack moderna. O projeto está atualmente em processo de migração de um protótipo baseado em `localStorage` para uma aplicação full-stack usando Supabase como backend.

A aplicação é rica em funcionalidades, com módulos para controle financeiro, gestão de RH (funcionários, cargos), acompanhamento de projetos, cadastro de clientes e um painel de Business Intelligence (BI).

### Tecnologias Principais
- **Frontend:** React, Vite, TypeScript
- **UI:** shadcn-ui, Radix UI, Tailwind CSS
- **Roteamento:** React Router DOM
- **Gerenciamento de Estado:** TanStack Query (React Query) para estado do servidor, `useState` para estado local da UI.
- **Formulários:** React Hook Form com Zod para validação.
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time).
- **Testes:** Vitest, React Testing Library, Playwright.

O documento de arquitetura principal, que serve como a única fonte de verdade, pode ser encontrado em `docs/architecture.md`.

## Compilando e Executando

O projeto usa `npm` como gerenciador de pacotes. O backend é gerenciado pela Supabase CLI.

### Pré-requisitos
- Node.js (v18+)
- npm
- Supabase CLI (`npm install -g supabase`)

### Desenvolvimento Local

1.  **Instalar Dependências:**
    ```bash
    npm i
    ```

2.  **Configurar o Supabase:**
    Inicialize e inicie a instância local do Supabase. Isso irá ativar os contêineres Docker necessários para o banco de dados, autenticação, etc.
    ```bash
    supabase init
    supabase start
    ```

3.  **Configurar Variáveis de Ambiente:**
    Copie o arquivo de ambiente de exemplo and preencha os detalhes fornecidos pelo comando `supabase start`.
    ```bash
    cp .env.example .env
    ```
    Seu arquivo `.env` deve se parecer com algo assim:
    ```
    VITE_SUPABASE_URL=http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY=sua-anon-key-da-cli
    ```

4.  **Executar Migrações do Banco de Dados:**
    Aplique o esquema SQL de `supabase/migrations` ao seu banco de dados local.
    ```bash
    supabase db reset
    ```

5.  **Executar o Servidor de Desenvolvimento do Frontend:**
    Isso iniciará a aplicação React em `http://localhost:8080`.
    ```bash
    npm run dev
    ```

### Comandos Principais

- `npm run dev`: Inicia o servidor de desenvolvimento Vite.
- `npm run build`: Cria uma build de produção da aplicação frontend.
- `npm run lint`: Executa o lint no código-fonte usando ESLint.
- `npm run test`: Executa os testes unitários e de integração usando Vitest.
- `supabase start`: Inicia os serviços locais do Supabase.
- `supabase stop`: Para os serviços locais do Supabase.
- `supabase db reset`: Reseta o banco de dados local e executa todas as migrações.
- `supabase gen types typescript --local > src/types/database.ts`: Gera os tipos TypeScript a partir do esquema do seu banco de dados.

## Convenções de Desenvolvimento

### Arquitetura
- O projeto segue os padrões descritos em `docs/architecture.md`.
- Uma **camada de serviços** (`src/lib` ou `src/services`) é usada para abstrair toda a comunicação com o backend do Supabase.
- **Rotas protegidas** e um componente de **guarda de permissão** lidam com autenticação e autorização no frontend.
- A **Segurança em Nível de Linha (RLS)** está habilitada no Supabase para impor políticas de acesso a dados no nível do banco de dados.

### Estilo de Código
- O projeto usa **ESLint** para linting. A configuração está em `eslint.config.js`.
- A formatação de código é provavelmente tratada por uma ferramenta como o Prettier (implícito por convenção, mas não configurado explicitamente nos scripts do `package.json`).
- O alias `@/` está configurado para apontar para o diretório `src/`.

### Testes
- **Testes Unitários e de Integração (Frontend):** Escritos com Vitest e React Testing Library. Os arquivos de teste estão localizados próximos aos componentes que eles testam. A configuração global de teste está em `src/test/setup.ts`.
- **Testes E2E:** A presença de um diretório `.playwright-mcp` sugere que o Playwright é usado para testes de ponta a ponta.
- **Testes de Backend:** O documento de arquitetura especifica `pgTAP` para testes de banco de dados.

### Estrutura do Projeto
```
/engflow
├── docs/                 # Documentação do projeto (arquitetura, PRD)
├── src/                  # Código-fonte do frontend React
│   ├── components/       # Componentes de UI reutilizáveis (incluindo shadcn-ui)
│   ├── pages/            # Componentes de página de nível superior para rotas
│   ├── hooks/            # Hooks React personalizados
│   ├── lib/              # Utilitários principais e configuração do cliente Supabase
│   ├── services/         # Camada de acesso a dados para o Supabase
│   ├── types/            # Definições de tipo TypeScript
│   └── ...
├── supabase/             # Configuração do projeto Supabase
│   ├── migrations/       # Migrações de esquema de banco de dados (SQL)
│   ├── functions/        # Funções de borda sem servidor
│   └── config.toml       # Configuração do projeto Supabase
└── ...
```
