# Contributing

## Working language

Source code, configuration, branches, commits, pull request titles and descriptions, reviews, and technical documentation must be in English. User-facing interface copy must be in Brazilian Portuguese.

## Branches and commits

Create short-lived branches from an up-to-date `main`. Use a descriptive lowercase name with one of these prefixes:

- `feat/` for product functionality
- `fix/` for corrections
- `chore/` for tooling or maintenance
- `docs/` for documentation-only work
- `test/` for test-only work
- `refactor/` for behavior-preserving changes

Commits and pull request titles must follow Conventional Commits, for example:

```text
feat: add candidate profile form
fix: preserve filters when returning to search
chore: update frontend quality tooling
```

Do not add `Co-authored-by` trailers. Commit authorship must remain solely with the human contributor whose Git identity is configured.

## Local quality gates

Install dependencies once with `pnpm install --frozen-lockfile`. Husky then enforces:

- `pre-commit`: lint and format staged files, then type-check the whole project
- `commit-msg`: validate Conventional Commits
- `pre-push`: run formatting, lint, type-checking, coverage, build, and Cypress

Never use `--no-verify` to bypass a failed gate. Fix the failure or document a genuine tooling blocker in the pull request.

Before requesting review, run:

```bash
pnpm validate:push
```

## Pull requests

Keep pull requests small enough to understand and validate. Complete the repository template, explain user-visible behavior, list the commands actually run, and disclose material AI assistance.

Every pull request—including one authored by an AGES III or AGES IV member—requires approval from at least one other person who belongs to AGES III or AGES IV. The author cannot approve their own pull request. After the latest reviewable push, another eligible reviewer must approve, and all review conversations must be resolved.

Use squash merge after all required checks and reviews pass. Do not push directly to `main`, force-push it, or delete it.

## Scope and dependencies

Do not add domain entities, feature modules, authentication, global state libraries, cache persistence, offline behavior, optimistic updates, or design tokens before the project confirms the corresponding requirement.

A new dependency must solve a specific problem that existing platform capabilities do not solve simply. Explain that problem in the pull request.

## Accessibility and privacy

WCAG 2.2 AA is a delivery requirement. Test keyboard behavior, focus order, labels, error identification, contrast, responsive zoom, and reduced motion in addition to automated checks.

Never commit secrets, personal data, résumés, certificates, production exports, or real user content. Use synthetic test data only.
