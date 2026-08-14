# ADR 0002: Local and continuous quality gates

- Status: Accepted
- Date: 2026-08-13

## Context

Short sprints and mixed experience increase the cost of discovering formatting, type, test, or browser failures only during review. Contributors use different editors and AI-assisted workflows.

## Decision

Use ESLint with type-aware recommended rules, Prettier, strict TypeScript, Vitest and React Testing Library with 80% global coverage thresholds, and Cypress with axe for browser smoke tests. Husky and lint-staged enforce staged checks and full type-checking before commits, commitlint enforces Conventional Commits, and pre-push runs the complete suite. GitHub Actions repeats the authoritative checks.

## Consequences

Feedback is available before code leaves a workstation, while CI protects against local configuration differences. Pushes take longer because Cypress runs, but the suite remains deliberately small. Hooks may not be bypassed; genuine infrastructure failures must be reported rather than hidden.
