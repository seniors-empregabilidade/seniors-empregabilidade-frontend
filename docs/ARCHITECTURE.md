# Frontend architecture

## Runtime shape

The frontend is a client-rendered single-page application:

```text
Browser → static React application → FastAPI /api/v1 → PostgreSQL
```

Vite produces static assets. The deployment platform must serve `index.html` for unknown application paths so TanStack Router can resolve them in the browser. Server rendering and static pre-rendering are outside the current MVP.

## Responsibilities

- TanStack Router owns URL state, navigation, not-found behavior, and route error boundaries.
- TanStack Query owns remote server state in memory. Persistence, offline mode, polling, optimistic updates, and infinite queries are not configured.
- React owns component-local UI state.
- Axios owns HTTP transport through one configured client.
- Zod validates environment values and, when real forms exist, input schemas shared with React Hook Form.
- shadcn/ui components are copied into the repository and remain source-owned.

## HTTP errors

The API is expected to return RFC 9457 `application/problem+json` responses. `toApiError` maps those responses into a safe typed error with status, stable code, field errors, and request ID. Unknown failures use generic Portuguese UI messages and do not expose server details.

No authentication, retry, global notification, or telemetry interceptor exists yet. Add each only after its requirement and behavior are defined.

## Structure policy

Code is organized by feature under `src/features`, one folder per feature, named after the matching backend module. `src/routes` holds routing only; the screen it renders lives in its feature. Shared code sits in `src/components`, `src/hooks` and `src/lib`, and is promoted there when a second feature needs it rather than in anticipation. A feature starts as flat files and grows `api`, `components` and `hooks` segments only when it becomes large enough to need them.

Imports flow in one direction: shared code, then features, then routes. A feature must not import from another feature, and ESLint fails the build on violation.

See [ADR 0004](adr/0004-frontend-feature-structure.md) for the decision, the alternative considered, and the full rules.

## Quality and accessibility

Strict TypeScript, type-aware ESLint, Prettier, unit/component coverage, production build, and Cypress smoke checks run locally and in CI. WCAG 2.2 AA is the target; semantic and manual review remain required even when axe passes.
