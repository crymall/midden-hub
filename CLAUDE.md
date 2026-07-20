# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Midden Hub is a frontend-only monorepo (npm workspaces) containing three React 19 SPAs with shared code:

- **`apps/Midden`** — portal/hub app (midden.reedgaines.com), links to sub-apps and provides admin user management.
- **`apps/Canteen`** — recipe storage/sharing app (canteen.reedgaines.com).
- **`apps/Netbook`** — personal notes app backed by netbook-service.
- **`shared/`** — code used by all apps, imported via Vite aliases `@shared/core` (hooks, services, gateways, pages, constants) and `@shared/ui` (components, styles, fonts, assets).

The backends are **separate repositories**: [iam-service](https://github.com/crymall/iam-service) (auth/identity), [canteen-service](https://github.com/crymall/canteen-service), and netbook-service (C#/ASP.NET Core notes API, local sibling repo `../midden-services/netbook-service`). Nothing in this repo defines API endpoints — the clients call them through path-prefixed routes (`/iam/*`, `/canteen/*`, `/netbook/*`).

See `docs/architecture.md` for the full stack description (k8s hosting, Grafana observability, CI/CD).

## Commands

```bash
npm run dev                  # run all apps (Midden on 5173, Canteen on 5174 strict, Netbook on 5175 strict)
npm run dev -w apps/Canteen  # run one app
npm test                     # vitest in watch mode (whole workspace)
npx vitest run               # single test run
npx vitest run path/to/File.test.jsx   # single test file (or: npx vitest run RecipeCard)
npm run test:coverage        # coverage (v8)
npm run lint                 # eslint whole repo
npm run lint:fix
npm run build -w apps/Midden # production build of one app
```

Production builds run the Grafana Faro source-map uploader and expect `VITE_FARO_API_KEY`; Midden also uses `VITE_CANTEEN_URL` (see `shared/core/utils/constants.js`).

## Architecture notes

### API routing / dev proxy
All apps' Vite dev servers proxy `/iam/*` → `localhost:3000` and `/canteen/*` → `localhost:3001`, **stripping the prefix** (regex `^/iam(/|$)` with a `rewrite`, in each app's `vite.config.js`); Netbook additionally proxies `/netbook/*` → `localhost:5099` (netbook-service's dev port). In production, the nginx ingress does the same path-based routing. The axios clients in `shared/core/services/{iamApi,canteenApi,netbookApi}.js` are created with `baseURL: "/iam"` / `"/canteen"` / `"/netbook"` and `withCredentials: true` — auth is cookie-based, no tokens stored client-side. The service modules export one plain async function per endpoint (no interceptors, no error normalization); pages call them through TanStack Query.

### Route structure
Both `App.jsx` files follow the same shape: `<BrowserRouter>` → app-level `<Suspense fallback={<Loading />}>` → `<FaroRoutes>`, with `/login` as the only route outside the `Dashboard` layout route at `/`. Inside the layout, public routes come first, then a pathless `<Route element={<RequireNotGuest />}>` wraps the authenticated group, then `path="*"` → `NotFound`.

- **Midden**: public `/` (Explorer), `/about`, `/professional-showcase`, `/experiments`; guarded: `/settings`.
- **Canteen**: public `/` (CanteenHome), `/recipes`, `/recipes/:id`, `/user/:id`; guarded: `/recipes/new`, `/recipes/:id/edit`, `/my-lists`, `/my-lists/:id`, `/messages`, `/messages/:id`, `/user/:id/network`.
- **Netbook**: a single public route `/` (Notes). It self-gates via `useAuth` — guests and logged-out visitors get `NetbookSplash`; signed-in users get the whole notebook on that one page: an inline "+ New note" form, a paginated list (numbered Prev/Next, page size 10) whose expandable cards read a note in place and edit it in place (the shared `NoteForm`), and a delete-confirm modal. There is no `RequireNotGuest` guard and no `/notes/*` sub-routes — the old new/detail/edit pages were removed. Note writes are offline-tolerant (see `docs/offline-notes.md` for the full design): a state-based queue under the `["pendingNotes"]` query key (`apps/Netbook/src/offline/`) coalesces offline creates/edits/deletes per note and flushes them oldest-first when connectivity returns; `useNotes` merges the queue into the displayed list, and Netbook's `main.jsx` persists the notes + pending queries to localStorage via `PersistQueryClientProvider` (deliberately not `["currentUser"]`). Flushed updates/deletes send an optional opaque `updatedAt` precondition — netbook-service 409s when the stored row is strictly newer, and the flush engine turns a conflicted update into a "(conflicted copy)" note rather than resolving silently. Offline creates are intentionally at-least-once: duplicates are visible and user-repairable, so there are no client-generated ids.

All pages are `lazy()` imports. Both `main.jsx` files register a `vite:preloadError` listener that reloads the page — this is the fix for stale lazy chunks after a redeploy; keep it when touching main.jsx.

### Auth & permissions
`shared/core/hooks/useAuth.js` is the single auth entry point: a TanStack Query query keyed `["currentUser"]` (staleTime Infinity, retry false) that calls `iamApi.verify()` and enriches the user with `canteenId` from `canteenApi.fetchMe()` (failure there is non-fatal — user still resolves, `canteenId: null`). Login is two-step: `login` (password) returns a `tempToken`, then `verifyLogin` (2FA code) seeds the `["currentUser"]` cache and redirects to `location.state.from` (set by the guard) or `/`. `logout` clears the whole query cache. Gating:
- `shared/core/gateways/RequireNotGuest.jsx` — route-level guard; treats the special username `guest` as unauthenticated and redirects to `/login`, preserving the origin in `location.state.from`.
- `shared/core/gateways/Can.jsx` — component-level permission check (`<Can perform={PERMISSIONS.writeData}>`), checks `user.permissions`; optional `not` prop renders a fallback.
- Roles/permissions constants and per-app nav config (`navMeta`) live in `shared/core/utils/constants.js`. `navMeta.<app>.navLinks` is a **function of the user** (Canteen builds a profile link from `user.canteenId`), and links can carry `requiredPermission` for the Header to filter on.

### App shell & theming
`@shared/core/pages/Dashboard` is the layout route for both apps, parameterized by `navMeta`: it renders the shared `Header`, an `<Outlet />` inside its own second-level `<Suspense>`, and — key detail — sets `document.body.dataset.theme` to the lowercased app title. Theming is Tailwind v4 (CSS-first, no tailwind config file): `shared/ui/styles/index.css` defines default color/font tokens in `@theme` and overrides them under `[data-theme="canteen"]` etc., so the same shared components restyle per app. That file also declares `@source` globs for both apps' `src` — a new app or moved directory must be added there or its classes won't be generated. Custom fonts (including the `Midden Icons` icon font used for glyphs like the `symbol` fields in constants.js) load from `shared/ui/assets/fonts`, and each app's Vite `publicDir` points at `shared/ui/assets`.

Each app's `main.jsx` initializes Grafana Faro (with React Router v7 instrumentation — routes render via `FaroRoutes`) and the QueryClient. Netbook's Faro is initialized `paused: true` with a placeholder collector URL, and its `vite.config.js` omits the `faroUploader` plugin — no "netbook" Faro app is registered in Grafana yet; swap in the real collector URL/appId when one exists.

### Testing
Vitest config lives in the **root** `vite.config.js` (jsdom, globals, setup file `shared/__tests__/setup.js`); there is no per-app test config. Tests are colocated in `__tests__/` directories next to the code they cover, and coverage is expected to be comprehensive (nearly every component/page has a test file).

### Linting
ESLint enforces `simple-import-sort` with custom groups (react/external → `@shared/core` hooks/services → gateways → pages → `@shared/ui`/relative → css) and Prettier at `printWidth: 100`. Run `npm run lint:fix` after writing code; hand-written imports in the wrong order will fail CI.

### Comments
Prefer self-explanatory code over comments: clear names and small functions should carry the intent.
Only add a comment when it states something the code cannot — a non-obvious "why", an external contract or workaround, or a subtle correctness constraint.
Do not write comments that restate what the code does or narrate the steps.
Keep the ones you do write short.

### CI/CD
GitHub Actions: `ci.yml` runs lint + tests on every push/PR to main; `deploy.yml` on merge to main runs tests, builds per-app Docker images (build context is the **repo root** so Dockerfiles can copy `shared/`), pushes to Docker Hub, and applies the `k8s/` manifests. Lazy-loaded pages require a reload prompt after redeploys (see recent commit history).
