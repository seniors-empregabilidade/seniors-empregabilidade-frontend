# Repository instructions

## Purpose and current scope

This repository is the React frontend for Seniors – Empregabilidade. It currently provides technical configuration only. Do not invent domain entities, screens, API resources, roles, or workflows that have not been confirmed by project scope.

The architecture priority is: team knowledge, simplicity and maintainability, mature ecosystem, deployment ease, then sophistication. This is a four-sprint academic project with mixed experience levels.

## Required stack

- React 19, TypeScript 6, and Vite 8
- Client-rendered SPA; no SSR, SSG, React Server Components, or React Compiler
- TanStack Router file-based routing and TanStack Query
- shadcn/ui with Tailwind CSS 4 and Base UI
- React Hook Form and Zod for forms when real forms exist
- Axios through the shared `apiClient`
- Vitest/React Testing Library and Cypress
- pnpm 11.16.0 on Node.js 24 LTS

Do not replace or duplicate these choices without an approved architectural decision.

## Language

- Write code, identifiers, comments, configuration, tests, branches, commits, pull requests, reviews, and technical documentation in English.
- Write user-facing interface text in Brazilian Portuguese.
- Use `.tsx` only when a file contains JSX; otherwise use `.ts`.

## Commands

Run from the repository root:

- `pnpm dev`: development server
- `pnpm format`: apply Prettier
- `pnpm lint`: ESLint with no warnings
- `pnpm typecheck`: strict TypeScript validation
- `pnpm test:coverage`: tests and the 80% coverage gate
- `pnpm build`: production build and route generation
- `pnpm e2e:ci`: Cypress smoke and axe checks against the built app
- `pnpm validate:push`: every required local gate

Never bypass Husky hooks or reduce quality thresholds to make a change pass.

## Implementation rules

- Keep route declarations in `src/routes`; never edit `src/routeTree.gen.ts`.
- Keep server state in TanStack Query. Do not copy it into a global store.
- Use React state for local UI state. Do not add Redux, Zustand, or another state manager without a confirmed need.
- Use `apiClient` for HTTP and map failures to `ApiError`. Support cancellation through Axios `signal`; do not add retry, toast, or authentication interceptors speculatively.
- Validate browser configuration through `src/config/env.ts`. Frontend environment variables are public; never place secrets in them.
- Add shadcn components as source under `src/components/ui`. Avoid wrapper components until repeated product needs justify them.
- Do not create fake entity hooks, query keys, forms, schemas, routes, fixtures, or folders to demonstrate architecture.
- Add a dependency only when the pull request can state the concrete problem it solves.

## User experience and accessibility

WCAG 2.2 AA is the target. Prefer semantic HTML and native behavior. Preserve keyboard access, visible focus, logical headings, accessible names, adequate contrast, zoom/reflow, 44-by-44-pixel practical targets, and reduced-motion preferences. Automated axe checks supplement—but do not replace—manual review.

No visual design system, brand palette, dark mode, or custom component abstraction is approved yet. Keep neutral shadcn variables until product design exists.

## Tests

- Test behavior and accessibility rather than implementation details.
- Avoid snapshots by default.
- Keep global line, branch, function, and statement coverage at or above 80%.
- Add Cypress only for critical browser flows; the current suite is a technical smoke test.
- Use synthetic, anonymous data. Never copy personal data, résumés, or certificates into tests or prompts.

## Git and review safety

- Follow Conventional Commits in English.
- Never add a `Co-authored-by` trailer. Preserve the human contributor's configured Git authorship.
- Do not commit, push, open, approve, or merge a pull request unless the user explicitly requests that action.
- Never force-push `main`, push directly to it, or use `--no-verify`.
- Preserve human edits and unrelated working-tree changes.
- Every pull request requires approval after the latest reviewable push from another person in AGES III or AGES IV.

## AI use

Follow `docs/AI_USAGE.md`. Humans own every submitted change, must understand it, and must run the stated validation. Never send secrets or personal data to an AI tool. Disclose material assistance in the pull request template; prompts do not need to be published. AI cannot review or approve its own output.
