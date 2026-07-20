# Dashboard

Current overview page composition. Will evolve into Today.

## Structure
- `components/` — UI specific to this module
- `hooks/` — module-scoped hooks
- `server/` — server functions (\*.functions.ts) and server-only helpers (\*.server.ts)
- `types.ts` — module types

Route entry points live under `src/routes/` and import from this module.
