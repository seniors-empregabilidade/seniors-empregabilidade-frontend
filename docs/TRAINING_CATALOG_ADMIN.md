# Course administration (US-22-T03)

Task: CU-86e3ke4kj. The administrator registers and maintains the courses that
candidates find under "Capacitação", and relates each course to catalog skills.

## Route

The administrator sidebar links to `/administrador/capacitacao`. The parent
route checks the administrator role; the API enforces it independently
(`403 administrator_required`).

## API contract (US-22-T01)

All paths start with `/api/v1`.

| Endpoint                      | Request                                                                                       | Success                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `GET /admin/trainings`        | `search` (title or institution), `published` (optional), `skill_id`, `limit` (1–50), `offset` | `200`: `{ "items": [Training], "total": n }` |
| `POST /admin/trainings`       | `title`, `institution`, `mode`, `external_link`, `published`, `skill_ids`, `job_ids`          | `201`: `Training`                            |
| `PATCH /admin/trainings/{id}` | any of the same fields; `skill_ids` and `job_ids` replace the whole set                       | `200`: the updated `Training`                |
| `GET /skills`                 | `search`, `limit`; active catalog skills only                                                 | `200`: `[Skill]`                             |
| `GET /admin/jobs`             | `search` (job title), `limit`; jobs of every status                                           | `200`: job options                           |

`Training` is `{ id, title, institution, mode, external_link, published,
skills: [Skill], job_ids: [uuid] }`.

## Behavior

- **Create/edit**: one dialog. A new course starts without a mode and
  unpublished. The form sends `skill_ids` as the complete set chosen in the
  picker and `job_ids` as the complete set chosen in the job picker.
- **Inactivate**: there is no separate status. Inactivating a course sends
  `{ "published": false }` after a confirmation; reactivating sends
  `{ "published": true }` without one. The course, its skills and its jobs stay.
  The screen does not call `DELETE`.
- **Skills**: the picker searches `GET /skills` (debounced), shows the chosen
  skills as removable items and allows at most 50, like the backend.
- **Jobs**: the picker searches `GET /admin/jobs` by title (debounced, 20
  options), shows company and status because closed and draft jobs are listed
  too, and allows at most 50 jobs per course.
- **Errors**: `404 training_not_found`, `422 training_relation_not_found` (shown
  on the skills field), `422 validation_error` and `403` have their own
  messages; other failures keep the typed values.

## Validation

- `trainings-admin-api.test.ts`: filters, form schema, requests and bodies,
  error messages.
- `trainings-admin-page.test.tsx`: listing, filters, pagination, empty and
  failed lists, creation with validation, editing, failed saves,
  inactivation with confirmation, reactivation.
