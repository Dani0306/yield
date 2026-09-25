@AGENTS.md

# Project: Bet Tracker

A personal, single-user app for logging every bet placed under one betting strategy and measuring how profitable that strategy is. Every bet is recorded (stake, odds, market, result, etc.) and the app turns that log into stats: profit, ROI, yield, win rate, streaks, and trends over time.

The app is **stats-first**: most screens are tables, summary figures, and simple charts. Data entry should be fast; reading the numbers should be effortless.

## Stack

- **Next.js 16** (App Router, `app/` directory) with React 19 and TypeScript. This version differs from older Next.js — check `node_modules/next/dist/docs/` before using any Next.js API (see AGENTS.md).
- **Supabase** as the backend: Postgres database, auth, and row-level security. Use `@supabase/ssr` for server/client helpers.
- **Tailwind CSS v4** (configured via `@tailwindcss/postcss` and `app/globals.css`; no `tailwind.config.js`).

## Design: ultra-minimal, black and white

- Strictly monochrome: black, white, and grays. No brand colors, gradients, shadows, or decorative imagery.
- The one exception: profit and loss may use a muted green/red, sparingly, and only when the number alone isn't enough (a `+`/`−` sign should always be present, so color is never the only signal).
- Typography carries the design. Use one sans-serif family plus a monospace or tabular-figure font for numbers. Numbers in tables use `font-variant-numeric: tabular-nums` and are right-aligned.
- Lots of whitespace, thin 1px borders, no rounded "card" clutter. Prefer plain layout over containers.
- No animations beyond simple, subtle transitions. No icons unless they are essential.
- Support both light and dark mode by inverting black and white.
- Responsive: tables must stay usable on a phone (horizontal scroll inside the table container is fine; the page itself must not scroll sideways).

## Domain model

The core entity is a **bet**. Expected fields (adjust as the schema evolves):

| Field                            | Notes                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `id`                             | uuid                                                                       |
| `user_id`                        | references `auth.users`; used by RLS                                       |
| `placed_at`                      | timestamp of the bet                                                       |
| `event` / `market` / `selection` | what was bet on                                                            |
| `sport` / `league`               | optional, for filtering and breakdowns                                     |
| `bookmaker`                      | optional                                                                   |
| `stake`                          | `numeric`, never float                                                     |
| `odds`                           | decimal odds, `numeric`                                                    |
| `status`                         | `pending` · `won` · `lost` · `void` · `half_won` · `half_lost` · `cashout` |
| `payout`                         | `numeric`, set when settled (needed for cashouts and partial results)      |
| `notes` / `tags`                 | optional                                                                   |

Rules:

- Store money and odds as Postgres `numeric`. Never do money math with JS floats carelessly — round only for display.
- **Profit** is derived, not stored: `payout − stake` for settled bets, `0` for void, excluded while pending.
- Core stats: total staked, net profit, ROI (`profit / total staked`), win rate, average odds, number of bets, longest win/loss streak, profit over time (cumulative chart), and breakdowns by sport, market, bookmaker, and odds range.
- Prefer computing aggregates in Postgres (views or RPC functions) rather than pulling every row into the client.

## Folder structure

All application code lives in `src/`; config files stay at the root. The `@/*` import alias points to `src/*`.

```
src/
├── app/                      # Routing only: pages, layouts, loading/error files
│   ├── (marketing)/          # Public pages: landing page at /
│   ├── (auth)/login/         # Login and sign-up
│   └── (dashboard)/          # Signed-in app, with a shared layout
│       ├── dashboard/        # /dashboard: overview figures
│       ├── bets/             # /bets list, /bets/new, /bets/[id]
│       └── stats/            # /stats: breakdowns and charts
├── features/                 # Domain code, one folder per feature
│   ├── bets/
│   │   ├── actions.ts        # Server Actions ("use server"): create, edit, settle, delete
│   │   ├── queries.ts        # Server-only reads from Supabase (the data layer)
│   │   ├── schemas.ts        # Validation for form input
│   │   ├── types.ts          # Bet domain types
│   │   ├── components/       # Bet-specific UI: bet form, bets table
│   │   └── hooks/            # Bet-specific client hooks
│   ├── stats/
│   │   ├── queries.ts        # Aggregate reads (views/RPC)
│   │   ├── calculations.ts   # Pure stat functions: ROI, yield, streaks
│   │   └── components/       # Stat tiles, charts, breakdown tables
│   └── auth/                 # Sign-in/out actions and forms
├── components/               # Shared, domain-free UI
│   ├── ui/                   # Primitives: button, input, table, select
│   └── layout/               # Header, nav, footer
├── hooks/                    # Shared client hooks
├── lib/
│   ├── supabase/             # server.ts, client.ts, proxy.ts (session refresh)
│   └── utils/                # Formatting (money, odds, %), dates, class names
├── types/                    # Global types, including generated database.types.ts
├── config/                   # App constants: site metadata, nav links, enums
└── proxy.ts                  # Next.js proxy (formerly middleware): auth redirects
supabase/
└── migrations/               # SQL migrations, one file per change
```

Placement rules:
- `app/` holds routing only. Pages stay thin: they call `features/*/queries.ts` and render feature components.
- Code used by a single feature stays in that feature's folder. Move it to `components/`, `hooks/` or `lib/` only when a second feature needs it.
- Features never import from another feature's internals. Shared code goes in `lib/` or `components/`.
- Only `queries.ts` and `actions.ts` talk to Supabase; components never query directly.
- Add `import "server-only"` to `queries.ts` files so they can't end up in client bundles.
- File names use kebab-case (`bet-form.tsx`), and components use PascalCase exports.

## Supabase conventions

- Enable row-level security on every table; policies restrict rows to `auth.uid() = user_id`.
- Keep schema changes as SQL migrations in `supabase/migrations/`, never ad-hoc edits in the dashboard.
- Keep generated types in `src/types/database.types.ts` (`supabase gen types typescript`), and use them in all queries.
- Keys go in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Never commit secrets or use the service-role key in client code.

## Code conventions

- Default to Server Components. Fetch data on the server; use Client Components only for interactivity (forms, sorting, filters, charts).
- Use Server Actions for mutations (creating, editing, and settling bets).
- Keep stat calculations in pure, testable functions (`src/features/stats/calculations.ts`), separate from UI.
- Build reusable table primitives (sortable columns, right-aligned numeric cells) instead of one-off tables.
- Keep dependencies minimal. Add a charting library only when it's needed, and style it to match the monochrome design.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run lint`: ESLint
