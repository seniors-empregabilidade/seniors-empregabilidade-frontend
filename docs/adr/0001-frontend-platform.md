# ADR 0001: Frontend platform

- Status: Accepted
- Date: 2026-08-13

## Context

The project has four short academic sprints and contributors with different experience levels. The frontend must be easy to run, explain, test, and deploy while remaining compatible with the agreed React and TypeScript stack.

## Decision

Use Node.js 24 LTS and pnpm 11.16.0. Build a client-rendered React SPA with Vite 8. Use TanStack Router's Vite plugin and file-based routing, TanStack Query for in-memory server state, Axios for HTTP, and React state for local state. Use React Hook Form with Zod when confirmed forms are implemented. Use shadcn/ui with Tailwind CSS 4 and Base UI, with neutral variables and no product design system yet.

## Consequences

The application can be deployed as static assets but requires an `index.html` fallback. Route configuration is generated and must not be edited manually. The team avoids SSR complexity and avoids a global state library until a concrete need appears. Cache persistence, offline behavior, optimistic updates, polling, and entity-specific abstractions are deferred.
