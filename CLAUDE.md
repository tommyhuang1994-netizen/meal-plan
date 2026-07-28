# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development workflow — use Superpowers

Development planning and execution is managed through the **Superpowers** plugin (`superpowers@superpowers-marketplace`), not a static `plan/` directory. Its skills auto-trigger by intent; invoke them by name when needed. Follow this flow for any non-trivial feature or change:

| Stage | Skill | Use when |
|-------|-------|----------|
| Explore the problem | `brainstorming` | Requirements are fuzzy or there are multiple approaches — agree on direction before coding |
| Plan the work | `writing-plans` | Capture the agreed approach as a concrete, reviewable plan |
| Build it | `executing-plans` + `test-driven-development` | Implement the plan step by step, writing tests first |
| Debug | `systematic-debugging` | A bug or failing test needs a methodical root-cause hunt |
| Confirm it works | `verification-before-completion` | Before claiming a task is done — verify against real behavior |
| Review & ship | `requesting-code-review` → `finishing-a-development-branch` | Get the diff reviewed, then merge/clean up the branch |

For larger or parallelizable work, see `using-git-worktrees`, `dispatching-parallel-agents`, and `subagent-driven-development`. Run `using-superpowers` to discover the full skill set.

> Note: this repo currently has no test runner configured (see Commands). When adding the first real logic, set up a test runner so `test-driven-development` and `verification-before-completion` can run actual tests rather than manual checks.

---

## Commands

```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build (runs `prisma generate` first)
npm run start    # Start production server

npm run db:local    # Start local Postgres (leave running in its own terminal)
npm run db:migrate  # Create + apply a migration from schema changes
npm run db:deploy   # Apply existing migrations (this is what production runs)
npm run db:seed     # Seed from lib/*.js — idempotent, safe to re-run
npm run db:studio   # Browse the data in Prisma Studio
npm run db:reset    # Drop, re-migrate, re-seed
```

Requires **Node 22** (see `.nvmrc`) — `nvm use`. Node 20 works for Next but not
for the local Postgres helper.

No test suite or linter is configured.

## Architecture

This is a **Next.js 16 App Router** project — a school meal plan ordering system for Zera International School. All pages use inline styles (no CSS framework); `app/globals.css` only sets box-sizing and font resets.

### Three user roles

| Role | Entry | Auth | Key pages |
|------|-------|------|-----------|
| Parent | `/parent` | None | `/parent/order` — place monthly meal orders |
| Admin | `/admin` | `admin123` via `sessionStorage` | `/admin/dashboard`, `/admin/menu`, `/admin/prices` |
| Vendor | `/vendor` | `vendor123` (no session persistence) | `/vendor/dashboard` — view orders by date + print |

### Database (Postgres + Prisma)

A schema exists and is seeded, but **no page or API route reads from it yet** —
the UI still renders entirely from the static `lib/*.js` modules below. Porting
them over is the outstanding work.

- `prisma/schema.prisma` — 12 models. All money is `Decimal(10,2)`, never Float.
- `prisma/seed.js` — seeds the DB *from* the static `lib/*.js` modules, so those
  stay the source of truth for June 2026 until an admin UI can create cycles.
- `lib/db.js` — the `prisma` client singleton. Import this, never construct a client.
- `lib/password.js` — scrypt hash/verify, no native dependency.
- `prisma.config.ts` — Prisma 7 keeps the connection URL here, not in the schema.

Prisma 7 specifics that differ from older docs: the client needs a **driver
adapter** (`PrismaPg`) rather than connecting on its own, and the generator is
`prisma-client-js` (the newer `prisma-client` emits TypeScript, which this
plain-JS project cannot import).

Connection URLs: `DATABASE_URL` is pooled and used by the app; `DIRECT_URL` is
unpooled and used by migrations, which cannot run through pgBouncer.

Key modelling decisions:

- `OrderDay` holds the price, not `OrderMeal` — mirroring `calcChild()`, where a
  `chef_both` day is one bundled price covering two meals and the combo discount
  belongs to the day.
- `OrderMeal` snapshots `itemNameSnapshot` / `unitParentPrice` / `unitVendorCost`
  so editing prices in `/admin/prices` never rewrites orders already placed.
- Dates are real `@db.Date` columns built with `Date.UTC` to avoid timezone drift.

### Data layer — static modules the UI still reads from

- `lib/menuData.js` — builds `MENU_BY_DATE` (keyed `"2026-06-DD"`), mapping June 2026 school days to breakfast/lunch/brunch items. Fridays get brunch only; Mon–Thu get breakfast + lunch.
- `lib/schoolCalendar.js` — exports `CLASS_GROUPS` (Cambridge, Homeschool, Plus), blocked date sets per group (public holidays + term breaks), and helper functions `getAvailableDays`, `isDateAvailable`, `getHolidayInfo`.
- `lib/pricingData.js` — `CHEFS_PRICING` and `MENU_PRICING` with `vendorCost` / `parentPrice` for all items.
- `lib/mockOrders.js` — `ORDERS` keyed by weekday (`Mon`–`Fri`), used by the vendor dashboard. Also exports `ALLERGY_LABELS` and `DEPARTMENTS`.

The API routes under `app/api/` (`auth`, `menu`, `orders`) are scaffolded but all return TODOs — they are not wired to any database yet.

### Ordering logic (parent flow)

`app/parent/order/page.js` is the most complex page. Key concepts:

- **Class groups** determine which dates are available (Cambridge vs Homeschool/Plus have different blocked dates in June).
- **Week plans**: `chefs_both` (breakfast + lunch + Friday brunch bundled), `chefs_bf`, `chefs_ln`, or `custom` (per-date picker).
- **Combo discount**: RM 1.00 off when both breakfast and lunch are chosen on the same day (custom plan only).
- **Friday brunch**: on Fridays the menu is brunch-only. `chefs_both` bundles it; `chefs_bf`/`chefs_ln` make it optional; custom handles it inline in the calendar.
- State is per-child (`KIDS = ['Ahmad Irfan', 'Nur Aisyah']`), pricing is computed in `calcChild()`.

### Internationalization (EN / ZH)

- `lib/i18n.js` is the whole i18n layer — no external library. It exports a `LanguageProvider` (wraps `children` in `app/layout.js` and also renders the global floating `EN / 中文` toggle), the `useT()` hook (`{ lang, setLang, t }`), and date helpers `fmtFullDate` / `weekdayFull` / `fmtMonthYear` (June-2026-aware).
- `t(key, vars)` looks up a flat dotted-key dictionary (`STRINGS.en` / `STRINGS.zh`), falls back to English then to the raw key, and interpolates `{var}` placeholders.
- Language is persisted to `localStorage('lang')`. The provider starts as `'en'` on the server **and** first client render (then applies the saved value in `useEffect`) to avoid a hydration mismatch.
- **Scope: UI labels only.** Dish names (`lib/menuData.js`), class-group names (Cambridge/Homeschool/Plus), holiday names, and the `TERM_BREAK_NOTICE` text in `lib/schoolCalendar.js` are intentionally left in English. The vendor **print route** (`app/vendor/print/[day]/route.js`) is also still English — it's server-rendered HTML opened in a new tab with no access to the client language context.
- To localize a new string: add the key to both `en` and `zh` in `lib/i18n.js`, then call `t('your.key')` in the (client) component.

### Vendor dashboard

`app/vendor/dashboard/page.js` reads from `lib/mockOrders.js`. Orders are keyed by weekday (`Mon`–`Fri`), not by specific date — all Mondays in June show the same mock data. The print route is `app/vendor/print/[day]/route.js`.

### Current state / known gaps

- All data is hardcoded for **June 2026** — dates, menus, and school calendar are not dynamic.
- Auth is client-side only (`sessionStorage` for admin; no session at all for vendor).
- API routes are stubs with TODO comments.
- `lib/mockOrders.js` weekday keys are reused across all occurrences of that weekday in the month.
