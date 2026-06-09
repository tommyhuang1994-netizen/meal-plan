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
npm run build    # Production build
npm run start    # Start production server
```

No test suite or linter is configured.

## Architecture

This is a **Next.js 16 App Router** project — a school meal plan ordering system for Zera International School. All pages use inline styles (no CSS framework); `app/globals.css` only sets box-sizing and font resets.

### Three user roles

| Role | Entry | Auth | Key pages |
|------|-------|------|-----------|
| Parent | `/parent` | None | `/parent/order` — place monthly meal orders |
| Admin | `/admin` | `admin123` via `sessionStorage` | `/admin/dashboard`, `/admin/menu`, `/admin/prices` |
| Vendor | `/vendor` | `vendor123` (no session persistence) | `/vendor/dashboard` — view orders by date + print |

### Data layer — all mock/static, no database

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

### Vendor dashboard

`app/vendor/dashboard/page.js` reads from `lib/mockOrders.js`. Orders are keyed by weekday (`Mon`–`Fri`), not by specific date — all Mondays in June show the same mock data. The print route is `app/vendor/print/[day]/route.js`.

### Current state / known gaps

- All data is hardcoded for **June 2026** — dates, menus, and school calendar are not dynamic.
- Auth is client-side only (`sessionStorage` for admin; no session at all for vendor).
- API routes are stubs with TODO comments.
- `lib/mockOrders.js` weekday keys are reused across all occurrences of that weekday in the month.
