# ADR 0004: Feature-based frontend structure

- Status: Accepted
- Date: 2026-09-09

## Context

`docs/ARCHITECTURE.md` deferred domain structure until product workflows were confirmed. Those workflows are now confirmed, and four open pull requests each invented a different placement for the same kind of code: the screen inside the route file, the screen at `src/` root with helpers under `src/lib/`, the screen inside a `src/routes/` subdirectory, and a dedicated feature folder. None is wrong, because no convention exists. The cost is already visible: contributors report not knowing where code belongs, and that uncertainty reached delivery.

The team also splits work by user story across two repositories. A contributor moving between `app/company_registration` in the backend and its counterpart in the frontend currently has no naming to follow.

Two public standards were considered.

**bulletproof-react** is a reference repository (35.8k stars, 3.2k forks, MIT, created 2021, last push 2026-05-14). It organizes code as feature folders under `src/features`, with optional `api`, `components`, `hooks`, `types` and `utils` segments inside each, and recommends enforcing unidirectional imports through ESLint.

**Feature-Sliced Design** is a versioned specification with active maintenance and a smaller following (2.4k stars on its documentation repository). It defines layers, slices and segments with strict one-directional dependencies between layers. Published comparisons place it ahead for large, domain-heavy products and describe it as heavy-handed and slow in smaller applications.

## Decision

Adopt the bulletproof-react structure, reduced to what this project needs.

```text
src/
  routes/            file-based routing only; a route file wires a URL to a component
  features/          one folder per feature, named after the backend module
  components/ui/     shadcn components, source-owned
  components/        components used by two or more features
  hooks/             hooks used by two or more features
  assets/            images and fonts
  lib/               transport and infrastructure
  config/            environment
  types/             shared types
  testing/           test utilities and mocks
```

Seven rules apply.

1. `src/routes/` holds routing only. A route file calls `createFileRoute` and renders a component defined elsewhere. A non-route file placed in that directory must carry the `-` prefix that TanStack Router reserves for exclusion from route generation.
2. Each feature is one folder under `src/features`, in kebab-case, named after its backend module. `app/company_registration` pairs with `features/company-registration`.
3. A feature starts flat. The `api`, `components`, `hooks` and `utils` segments are created when the folder exceeds roughly seven files, following the upstream guidance that only necessary folders should exist.
4. Code is shared when a second feature needs it, not in anticipation. It is written inside the feature that needs it first and promoted to `components/`, `hooks/` or `lib/` when a second consumer appears.
5. `lib/` holds infrastructure and `features/` holds domain. The HTTP client and the query client are infrastructure; a login schema is domain.
6. Tests sit beside the code they cover, with the same name and a `.test.tsx` suffix.
7. Imports flow in one direction: shared code, then features, then routes. A feature must not import from another feature. ESLint enforces this and the build fails on violation.

Feature-Sliced Design is recorded as the considered alternative. It is the stronger choice for a large domain-heavy product and remains available if this codebase outgrows the structure above.

## Consequences

A contributor receiving a user story has one answer for where the code goes, and the same name identifies the feature in both repositories. Rule 7 turns the convention into a build failure rather than a review comment, which is what keeps it from decaying into whatever happened to be written first.

Existing pull requests were opened before this decision and do not follow it. They are not blocked by this ADR; alignment is handled per pull request or by a later migration, as the team decides.

The upstream reference receives few commits, six in the six months before this decision. That is expected for a reference repository rather than a dependency: nothing is installed from it, so the cadence carries no security or compatibility risk.
