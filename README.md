# Seniors – Empregabilidade Frontend

Frontend web do projeto Seniors – Empregabilidade, desenvolvido pela equipe da AGES. A interface do produto é escrita em português brasileiro; o código-fonte, os identificadores e os arquivos de configuração permanecem em inglês.

Este repositório contém somente a base técnica inicial. Entidades, funcionalidades de negócio, autenticação e identidade visual serão adicionadas depois que seus requisitos forem confirmados.

## Tecnologias

- React 19 e TypeScript 6
- Vite 8, renderizado no cliente como uma aplicação de página única (SPA)
- TanStack Router com rotas baseadas em arquivos
- TanStack Query com cache padrão somente em memória
- shadcn/ui, Tailwind CSS 4 e Base UI
- Axios, React Hook Form e Zod
- Vitest, React Testing Library e Cypress
- ESLint, Prettier, Husky, lint-staged e commitlint

## Pré-requisitos

- Node.js 24 LTS
- pnpm 11.16.0 por meio do Corepack
- Google Chrome ou Chromium para os testes de ponta a ponta
- Backend disponível na URL configurada em `VITE_API_URL`

## Execução local

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

A aplicação estará disponível em `http://localhost:5173`. A URL padrão da API é `http://localhost:8000/api/v1`; o arquivo `.env.local` pode sobrescrevê-la e não deve ser versionado.

No PowerShell, copie o arquivo de ambiente com:

```powershell
Copy-Item .env.example .env.local
```

## Comandos

| Comando              | Finalidade                                     |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | Inicia o servidor de desenvolvimento do Vite   |
| `pnpm build`         | Gera as rotas, compila e verifica os tipos     |
| `pnpm typecheck`     | Executa o TypeScript sem gerar arquivos        |
| `pnpm lint`          | Executa o ESLint sem permitir avisos           |
| `pnpm format:check`  | Verifica a formatação com Prettier             |
| `pnpm test`          | Executa os testes unitários e de componentes   |
| `pnpm test:coverage` | Executa os testes com cobertura mínima de 80%  |
| `pnpm e2e:open`      | Abre o Cypress para desenvolvimento local      |
| `pnpm e2e:ci`        | Serve o build e executa o Cypress no Chrome    |
| `pnpm validate`      | Executa todas as verificações, exceto Cypress  |
| `pnpm validate:push` | Executa todos os controles locais de qualidade |

Os hooks do Git formatam e validam os arquivos preparados, além de executar a verificação completa de tipos antes do commit. O hook `commit-msg` valida Conventional Commits e o `pre-push` executa todas as verificações, incluindo Cypress. Não ignore esses hooks.

## Estrutura técnica

O repositório evita pastas de domínio especulativas. A estrutura atual contém somente a fundação técnica:

```text
.
├── .github/              # CI, Dependabot, CODEOWNERS e orientação para PRs
├── .husky/               # Hooks locais de pre-commit, commit-msg e pre-push
├── config/               # ESLint, Prettier, commitlint e lint-staged
├── cypress/              # Testes E2E e de acessibilidade no navegador
├── docs/                 # Arquitetura, ADRs e políticas de engenharia
├── src/                  # Somente código entregue na aplicação
│   ├── components/ui/    # Componentes do shadcn/ui mantidos no repositório
│   ├── config/           # Configuração pública validada em runtime
│   ├── lib/              # Cliente HTTP, erros, Query Client e utilitários
│   ├── routes/           # Declarações de rota do TanStack Router
│   ├── main.tsx          # Ponto de entrada da aplicação no navegador
│   ├── router.tsx        # Instância e registro de tipos do Router
│   └── styles.css        # Entrada do Tailwind e variáveis visuais neutras
├── tests/
│   ├── components/       # Testes de componentes e páginas React
│   ├── unit/             # Testes unitários da configuração e das bibliotecas
│   └── setup.ts          # Preparação compartilhada do Vitest
├── components.json       # Configuração do CLI do shadcn/ui
├── cypress.config.ts     # Configuração do Cypress; define a raiz do projeto
├── vite.config.ts        # Configuração do Vite, Router, Tailwind e Vitest
└── tsconfig*.json        # Fronteiras de TypeScript para app, testes e ferramentas
```

A raiz mantém apenas pontos de entrada convencionais ou arquivos que precisam ser descobertos diretamente pelas ferramentas. Configurações gerais ficam em `config/`.

O arquivo `index.html` é o documento-base servido pelo Vite. Ele contém o elemento onde o React monta a aplicação; as telas e os componentes continuam sendo implementados em `.tsx`.

`src/routeTree.gen.ts` é gerado pelo plugin do TanStack Router e nunca deve ser editado manualmente. `src/` contém apenas código da aplicação; testes unitários e de componentes ficam em `tests/`, enquanto testes de navegador ficam em `cypress/`.

Quando o escopo do produto estiver confirmado, organize o código novo a partir de funcionalidades ou capacidades reais do domínio. Não crie pastas vazias como `features`, `hooks`, `schemas`, `services`, `store` ou entidades apenas para demonstrar uma arquitetura futura. Registre uma decisão estrutural em ADR somente quando ela afetar várias funcionalidades ou estabelecer uma fronteira duradoura.

## Variáveis de ambiente

Somente variáveis iniciadas por `VITE_` são expostas ao navegador. Nunca coloque segredos nas variáveis do frontend.

| Variável       | Obrigatória | Padrão                         | Finalidade      |
| -------------- | ----------- | ------------------------------ | --------------- |
| `VITE_API_URL` | Não         | `http://localhost:8000/api/v1` | URL base da API |

O ambiente de produção deve redirecionar rotas desconhecidas da SPA para `index.html`.

## Acessibilidade

O objetivo do projeto é atender à WCAG 2.2 AA. Use HTML semântico, navegação completa por teclado, foco visível, contraste suficiente, nomes acessíveis e suporte à redução de movimento. O Cypress executa verificações com axe, mas testes automatizados não substituem a revisão manual por teclado e leitor de tela.

## Contribuição

Antes de contribuir, leia [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md) e [docs/AI_USAGE.md](docs/AI_USAGE.md). O contexto arquitetural está em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), e as decisões aceitas ficam em [docs/adr](docs/adr).
