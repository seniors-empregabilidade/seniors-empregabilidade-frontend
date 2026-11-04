# Candidate home (US-32-T02)

`/candidato` is the first screen a professional sees after signing in. It sits
inside the existing `RoleShell`, so the sidebar, the header with the
notifications link (US-26) and the WhatsApp support button (US-27) are the
shared ones; the page adds none of them.

The page is `src/features/candidates/candidate-home.tsx`. It greets the
professional by first name and shows three cards. Each card has its own
TanStack Query, so it shows its own skeleton, error and retry while the other
cards stay on screen.

| Card                  | Request                                            | Shown                                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seu perfil            | `GET /professionals/me` (same query as Meu perfil) | `completion_percentage`, the `missing_fields` labels and "Completar perfil" → `/candidato/perfil`. A complete profile shows "Perfil completo" and "Ver meu perfil", with no pending list.                                                                   |
| Candidaturas recentes | `GET /applications/me?limit=3`                     | Job, company, submission date and status of up to three applications, newest first, and "Ver todas" → `/candidato/candidaturas`. Without applications it points to the job search.                                                                          |
| Vagas abertas         | `GET /jobs?limit=3&offset=0`                       | The first three results of the US-10 search: company, location, work mode, salary ceiling when present, "Você atende X dos Y requisitos" and the missing skills. "Ver vaga" → `/candidato/vagas/$jobId` (US-11); "Ver todas as vagas" → `/candidato/vagas`. |

The page computes no percentage, match or ranking of its own: it renders what
those endpoints return, with the formatters the source screens use
(`applicationStatusLabel`, `formatSubmittedDate`, `formatMissingSkills`,
`formatWorkMode`, `formatSalaryRange`). The percentage line is hidden when a
backend without `completion_percentage` is deployed.

## Freshness

The query keys share the prefixes of the source screens (`candidates`,
`applications`, `jobs`) and use the default `staleTime` of zero, so returning
to the page refetches every card, and the invalidations those screens already
perform (profile edits, withdrawal) reach the cards too.

## Before the name loads

The heading reads "Área do candidato" until the profile arrives, and keeps it
when the profile card fails, so the page always has a level-1 heading.

The end-to-end check against the real backend belongs to US-32-T03.
