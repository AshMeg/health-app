# Timeline

Bloom's shared data layer. Every log, sync and goal moment in the app is a single
`BloomEvent` here — nothing keeps its own private log.

## Structure
- `types.ts` — `BloomEvent`, `EventCategory`, `MetricKey`, `DailySnapshot`
- `store.ts` — the one event store (module-level + localStorage), `logEvent`
- `snapshot.ts` — folds events into today's snapshot and recent days
- `goal-sync.ts` — maps an event onto any goal tracking that listens to it
- `relationships.ts` — which metrics explain which (sleep ↔ recovery, etc.)
- `quick-add.ts` — the loggable things and their fields
- `hooks/use-bloom-context.ts` — the interface screens use: events, snapshot, goals, `record()`
- `components/` — timeline page, feed and the log dialog

## Adding something loggable
1. Add the `EventCategory` in `types.ts` (with label + accent).
2. Add a `quickAddSpecs` entry describing its fields.
3. If a goal should react to it, extend `goal-sync.ts`.

Route: `src/routes/_authenticated/timeline.tsx`.
