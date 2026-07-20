# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

## Organisation for Bloom

Route files stay thin — they wire URL, metadata, and layout. Page logic and
UI live in the matching feature module under `src/features/<module>/`.

- Public routes: `auth.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `index.tsx`
- Authenticated shell: `_authenticated/route.tsx` (auth gate + `AppShell`)
- Authenticated pages: `_authenticated/<page>.tsx` — currently placeholders
  for dashboard, weight, nutrition, sleep, training, recovery, measurements,
  journal, analytics, integrations, profile, settings.

Future Bloom modules (`today`, `journey`, `timeline`, `insights`, `explore`,
`health-records`) will land as new files under `_authenticated/` importing
from `src/features/<module>/`.
