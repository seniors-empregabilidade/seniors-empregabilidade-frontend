# Company registration (US-14)

Open `/users/register` and select **Empresa**. The route composes the existing
candidate form and the company feature through `RegistrationPage`; neither
feature imports the other. This branch builds on candidate registration PR #19.
The candidate source is preserved and renamed with a `-` prefix so TanStack does
not generate a second route for its implementation file.

The company form uses React Hook Form with Zod. CNPJ and CEP lookups use TanStack
Query with input-specific keys, cancellation and no retries. The CNPJ query goes
through the backend and BrasilAPI. CEP uses ViaCEP, already selected by the
candidate form. Both use the shared Axios client; no AWS credentials enter the
browser. Late responses belong to their original query key.

The registration mutation sends the backend contract, without `confirm_password`.
It preserves input and maps `errors.cnpj`, `errors.corporate_email` and existing
`body.field` validation paths to fields. Unexpected errors use safe Portuguese
messages. Submitting disables the form until the request finishes. Passwords are
cleared after success; mutation state is reset after each attempt.

The backend response declares whether email confirmation is still required.
Successful registration displays **pendente de aprovação** and, when needed,
accepts or resends the Cognito email code through the backend. Confirmation does
not approve the company. If identity creation succeeded but local persistence did
not, the form offers email confirmation before retrying the same registration.
The backend must verify ownership before linking an existing identity.

## Local setup

From the frontend root:

```bash
pnpm install --frozen-lockfile
VITE_API_URL=http://localhost:8000/api/v1 pnpm dev
```

Start the backend from backend PR #10 using its `docs/COMPANY_REGISTRATION.md`.
Allow the frontend origin in backend CORS. Use authorized synthetic accounts;
never place the Cognito client secret in a `VITE_*` variable.

Run the existing quality gates from this directory:

```bash
pnpm validate:push
```

The Vitest tests cover the HTTP contract, validation, lookups, field errors,
confirmation/recovery, duplicate submission and shared form switch. Cypress covers
registration, a duplicate-CNPJ response, narrow viewport and automated WCAG 2.2 AA
checks. Cypress intercepts API responses: it does not send emails or access AWS.
Backend integration tests separately cover the actual PostgreSQL transactions.

## Inputs still owned by the team

- The shared candidate form remains owned by PR #19; this branch does not replace
  its professional-registration implementation.
- The `/login` destination belongs to the separate login screen PR #20. That PR
  must be integrated for the link to work in a build based only on this branch.
- The parent US requests LinkedIn without marking it mandatory. It is optional.
- The existing checkbox text references Terms of Use and Privacy Policy. Their
  published content/URL and agreed version were not found. The submitted version
  is `v1`; align it with the approved document before final product acceptance.
- The actual blocked CNAE prefixes must be configured in the backend. No product
  blacklist was invented.
- The rejection notification is persisted and exposed by the backend to its owner;
  a general notification center and administrator UI are not part of these frontend
  subtasks. Approval can be exercised through the authenticated backend `/docs`.

References: [ViaCEP response and validation](https://viacep.com.br/),
[TanStack Query v5 cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation),
[US-14-T03](https://app.clickup.com/t/86e309dyt),
[US-14-T04](https://app.clickup.com/t/86e308wrh).
