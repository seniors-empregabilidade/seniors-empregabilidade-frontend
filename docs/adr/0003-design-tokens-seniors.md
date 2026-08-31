# ADR 0003: Seniors brand design tokens over the shadcn token contract

- Status: Accepted; superseded in part by `docs/design-system.md`
- Date: 2026-08-19

## Context

Product design now exists: UI mockups for the hiring platform were produced in Claude Design from the Figma source, establishing the Seniors brand palette (navy `#0b2545`, blue `#1d5fd8`) and semantic status colors. Until now the repository kept the neutral shadcn variables because no visual design was approved. Components are installed from the shadcn registry (base-nova style, Base UI) and read their colors exclusively from the CSS custom properties declared in `src/styles.css`.

## Decision

Map the Seniors palette onto the shadcn token contract in `src/styles.css`, keeping every token name unchanged and replacing only the values, expressed in `oklch`. Add the tokens the neutral baseline did not declare — `popover`, `success`, `warning`, and the `sidebar` group — to `:root` and to the `@theme inline` mappings. Vendored components remain unmodified except where a variant consumes a new token (Badge `success` and `warning`). Contrast-sensitive pairs are chosen to satisfy WCAG 2.2 AA (primary on white 5.7:1, muted foreground on white 4.9:1). No `.dark` block is introduced; dark mode remains out of scope.

## Consequences

Every current and future shadcn component picks up the brand automatically, because theming stays confined to token values rather than component code, and registry updates remain drop-in. New semantic colors (`success`, `warning`) must be consumed through tokens, never hex literals.

AGENTS.md is now outdated and must be updated: it still states "No visual design system, brand palette, dark mode, or custom component abstraction is approved yet. Keep neutral shadcn variables until product design exists." A brand palette is now approved and applied; the statement should be revised to reflect this ADR while keeping dark mode and custom component abstractions unapproved.

## Superseded in part

Date: 2026-08-30

Version 2 of the design system specification (`docs/design-system.md`) supersedes the
token values recorded here. The decision itself stands: the Seniors palette is still
mapped onto the shadcn token contract by value, token names are unchanged, vendored
components stay unmodified, and no `.dark` block is introduced. What changes is the set
of values and the token list.

- `--input` is separated from `--border`. The value recorded here resolves to 1.28:1
  against white, below the 3:1 that criterion 1.4.11 requires for field and secondary
  button borders. It becomes `#8496B3` at 3.0:1.
- `--primary` moves from `#1D5FD8` (5.71:1) to `#1D4ED8` (6.7:1).
- `--muted-foreground` moves from 4.9:1 to 7.2:1.
- `--warning` stops being a single color and becomes a foreground, background, and
  border trio, because one color cannot produce readable text on its own surface.
- `--sidebar` inverts from a light surface to `--foreground`.
- New tokens: `--foreground-2`, `--primary-hover`, `--rule`, `--disabled`,
  `--disabled-foreground`, the `--warning-*` group, and the `--on-dark-*` group. Each
  needs a matching `@theme inline` entry to become a Tailwind utility.

The AGENTS.md correction requested in the Consequences section above is applied in the
same pull request as this note.
