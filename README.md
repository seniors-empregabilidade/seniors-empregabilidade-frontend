# Seniors – Empregabilidade Frontend

Interface web do projeto Seniors – Empregabilidade, desenvolvida pela equipe da AGES. O frontend roda no navegador; o Vite fornece o servidor local usado durante o desenvolvimento.

## O que já está implementado

O repositório contém a base técnica em React 19 e TypeScript 6: navegação, cliente HTTP, tratamento de erros, estilos iniciais e testes automatizados. É uma aplicação de página única: a navegação acontece no navegador sem recarregar a página inteira.

Ainda não há funcionalidades de negócio, autenticação, entidades do produto nem um sistema visual definitivo. A acessibilidade é um requisito: novas telas devem funcionar com teclado, foco visível, contraste adequado e nomes compreensíveis por tecnologias assistivas.

## Pré-requisitos

- [Git](https://git-scm.com/downloads), para baixar e versionar o projeto;
- [Node.js 24 LTS](https://nodejs.org/en/download), que executa as ferramentas JavaScript;
- pnpm 11.16.0, que instala as dependências. Node.js e pnpm são ferramentas diferentes;
- Google Chrome ou Chromium, apenas para os testes de navegador.

O [Corepack](https://nodejs.org/api/corepack.html) permite que o repositório use a versão esperada do pnpm. Consulte também a [documentação oficial de instalação do pnpm](https://pnpm.io/installation) se `corepack` não estiver disponível.

## Escolha do terminal

Os comandos `git`, `corepack` e `pnpm` são iguais no Windows PowerShell, Windows com WSL, Linux e macOS. Blocos marcados como **Bash** funcionam no Linux, macOS e WSL. Use blocos **PowerShell** no PowerShell do Windows.

WSL é um ambiente Linux dentro do Windows. Escolha um ambiente e mantenha o repositório e os comandos nele: caminhos como `C:\Users\...` pertencem ao PowerShell, enquanto `/home/...` pertence ao WSL. Não misture instalações de Node.js ou pastas entre os dois terminais.

## Primeira configuração

Execute uma vez:

```bash
git clone https://github.com/seniors-empregabilidade/seniors-empregabilidade-frontend.git
cd seniors-empregabilidade-frontend
corepack enable
pnpm install --frozen-lockfile
```

`corepack enable` prepara o gerenciador indicado pelo projeto. `pnpm install --frozen-lockfile` instala exatamente as versões registradas no lockfile e também configura os hooks locais do Git.

## Inicialização diária

Na raiz do repositório, execute:

```bash
pnpm dev
```

O backend só precisa estar em execução para as funcionalidades que chamam a API. A página inicial e o trabalho puramente visual podem ser usados sem ele.

## Como verificar se funcionou

Abra [http://localhost:5173](http://localhost:5173). Você deve ver a página inicial “Seniors – Empregabilidade” e a indicação de que a fundação técnica está pronta. O terminal deve permanecer aberto enquanto o servidor estiver ativo.

## Como parar

Volte ao terminal onde `pnpm dev` está em execução e pressione `Ctrl+C`. Isso encerra apenas o servidor de desenvolvimento; não remove arquivos nem dependências.

## Variáveis de ambiente (opcional)

A URL local da API já possui o padrão `http://localhost:8000/api/v1`, então não é necessário criar um arquivo de ambiente no início. Para apontar para outra API, copie o exemplo uma vez e edite `VITE_API_URL`:

**Bash (Linux, macOS ou WSL):**

```bash
cp .env.example .env.local
```

**PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

Reinicie `pnpm dev` após alterar o arquivo. Variáveis iniciadas por `VITE_` ficam visíveis no navegador; nunca coloque senhas ou outros segredos nelas.

## Principais comandos de qualidade

| Comando              | O que verifica                                                    |
| -------------------- | ----------------------------------------------------------------- |
| `pnpm format:check`  | Formatação dos arquivos                                           |
| `pnpm lint`          | Problemas e padrões no código                                     |
| `pnpm typecheck`     | Coerência dos tipos TypeScript                                    |
| `pnpm test:coverage` | Testes e cobertura mínima de 80%                                  |
| `pnpm build`         | Geração da versão de produção                                     |
| `pnpm e2e:ci`        | Teste no navegador e verificações automatizadas de acessibilidade |
| `pnpm validate`      | Todas as verificações, exceto Cypress                             |
| `pnpm validate:push` | Todas as verificações locais, incluindo Cypress                   |

“Lint” é uma análise automática que encontra erros e padrões indesejados. A verificação de tipos detecta usos incompatíveis antes de o código rodar.

Os hooks do Git são verificações automáticas: antes do commit, validam os arquivos e os tipos; antes do push, executam a suíte completa. O pre-push pode demorar porque também compila e abre testes automatizados no navegador. Eles existem para encontrar problemas antes da revisão e da CI. Se não tiverem sido instalados, execute novamente `pnpm install --frozen-lockfile`; não use `--no-verify`.

## Problemas comuns

- **`node`, `corepack` ou `pnpm`: command not found:** instale o Node.js 24 pelo link oficial, abra um terminal novo e execute `corepack enable`. Se necessário, siga a instalação oficial do pnpm.
- **Porta 5173 em uso:** pare outro servidor com `Ctrl+C` ou identifique o processo que ocupa a porta antes de iniciar novamente.
- **O frontend não alcança o backend:** confirme que a API está ativa em `http://localhost:8000`, confira `VITE_API_URL` em `.env.local` (se existir) e reinicie o Vite. Erros de API não impedem necessariamente a página inicial de abrir.
- **Dependências não sincronizadas ou módulo ausente:** execute `pnpm install --frozen-lockfile` na raiz. Se o lockfile tiver mudado legitimamente na branch, use o lockfile versionado, sem editar versões manualmente.
- **Hooks não executam:** rode `pnpm install --frozen-lockfile` novamente e confirme que os comandos são executados dentro do repositório Git.
- **Comando de cópia ou caminho falha no Windows:** confirme se o terminal é PowerShell ou WSL. Use `Copy-Item` e caminhos do Windows no PowerShell; use `cp` e caminhos Linux no WSL.

## Estrutura técnica resumida

- `src/`: aplicação React, rotas, configuração e cliente HTTP;
- `tests/`: testes unitários e de componentes;
- `cypress/`: testes executados no navegador;
- `config/`: configuração das ferramentas de qualidade;
- `docs/`: arquitetura, decisões e políticas do projeto.

Os detalhes sobre TanStack Router, estado remoto, tratamento de erros e organização futura estão em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e nas [decisões arquiteturais](docs/adr). Evite criar módulos de negócio antes de os requisitos serem definidos.

## Arquitetura e contribuição

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma contribuição. Consulte também [AGENTS.md](AGENTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), as [decisões arquiteturais](docs/adr) e a [política de uso de IA](docs/AI_USAGE.md).
