# Features

Feature modules for the Bloom health platform. Each module owns its UI
components, hooks, server functions, and types. Route files under
`src/routes/` stay thin and import from the corresponding module here.

## Planned modules
- `today/` — Today view (daily snapshot)
- `journey/` — Long-term progression
- `timeline/` — Chronological event feed
- `insights/` — AI-generated insights
- `explore/` — Discoverable content
- `health-records/` — Medical records
- `settings/` — Account & preferences

## Existing modules
- `auth/` — Authentication flows
- `dashboard/` — Current dashboard (will fold into `today/`)
- `shared/` — Cross-feature primitives

## Conventions
- Colocate module code; do not reach across modules — share via `shared/`.
- Server functions: `*.functions.ts` (client-safe imports).
- Server-only helpers: `*.server.ts`.
- Route files import module components; do not put page logic in routes.
