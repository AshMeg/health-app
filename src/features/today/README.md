# Today

Snapshot of the user's current day: latest metrics, quick logging, next actions.

## Structure
- `components/` — UI specific to this module
- `hooks/` — module-scoped hooks
- `server/` — server functions (\*.functions.ts) and server-only helpers (\*.server.ts)
- `types.ts` — module types

Route entry points live under `src/routes/` and import from this module.
