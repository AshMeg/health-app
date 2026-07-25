# Goals

The Goal Centre: create, browse and track goals that support the user's health.

## Structure
- `components/` — goal cards, progress bars, create-goal flow, detail page
- `hooks/use-goals.ts` — placeholder goal store (localStorage), swap for server functions later
- `mock-data.ts` — seeded placeholder goals
- `types.ts` — goal types, metrics, status metadata and progress helpers

Routes: `src/routes/_authenticated/goals/index.tsx` and `.../goals/$goalId.tsx`.
