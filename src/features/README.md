# Features

One folder per feature, in kebab-case, named after the matching backend module.
`app/company_registration` in the backend pairs with `company-registration` here.

A feature starts as flat files:

```text
features/company-registration/
  company-registration-form.tsx
  company-registration-form.test.tsx
  use-company-registration.ts
  schema.ts
```

It grows `api/`, `components/` and `hooks/` segments only when it exceeds roughly
seven files. Creating those folders to hold one file each is not the convention.

A feature must not import from another feature: ESLint fails the build. When a
second feature needs the same code, promote it to `src/components`, `src/hooks`
or `src/lib` first.

See [ADR 0004](../../docs/adr/0004-frontend-feature-structure.md).
