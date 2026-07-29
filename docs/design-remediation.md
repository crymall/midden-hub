# Design remediation plan

Remediation backlog derived from the `/impeccable critique` run of 2026-07-29.
Baseline: **20/40** on Nielsen's heuristics, 5 of 8 cognitive-load checks failed.
Full findings: `.impeccable/critique/2026-07-29T01-38-22Z__shared-ui.md`.
Findings consciously rejected: `.impeccable/critique/ignore.md`.

## Organizing principle

Work is ordered by **where the fix lives**, not by severity.
Nearly every finding is a symptom of a missing shared primitive, so fixing symptoms first means performing the same fix many times over.

| Fix | Sites if done piecemeal | Sites if done at the root |
|---|---|---|
| Ad-hoc reds | 21 occurrences across 12 files | 1 token pair per theme |
| Theme-blind shadow | 19 usages across 11 files | 4 `@utility` definitions |
| Destructive confirm | 5 call sites, 3 copy registers | 1 `ConfirmModal` |
| "No data" vs. "we're broken" | 9 list surfaces | 1 error/empty primitive |
| Pagination | 2 divergent implementations | 1 shared component |

Phases 0 through 3 form a critical path; each unblocks the next.
The surface track is independent and can interleave at any point.

Every phase closes by writing its decisions into `DESIGN.md`.
The document's negative space — no danger colour, no error surface, no empty state, no pagination spec — is what caused the drift in the first place.

---

## Phase 0 — Green the test suite

The suite is red on `agentic-design`: 23 of 404 tests fail across 6 files.
Every failure traces to one cause, and every later phase needs a signal that can be trusted.

- [x] Add a `window.matchMedia` stub to `shared/__tests__/setup.js`. **Done 2026-07-29 — 404/404 passing, lint clean.**

`Loading.jsx:21` calls `window.matchMedia`, which jsdom does not implement.
Because `Loading` is the Suspense fallback in all three app shells, it collaterally fails all three `App.test.jsx` routing suites plus `Loading`, `RequireNotGuest`, and `Dashboard`.
Lint already passes clean.

---

## Phase 1 — Tokens and rules

Mechanical, low visual risk, and it unblocks Phase 2.

- [ ] Add `--color-danger` and `--color-danger-text` to `@theme` and to both `[data-theme]` blocks in `shared/ui/styles/index.css`.
- [ ] Convert the four `@utility text-shadow-hard-*` blocks (`index.css:79-93`) from literal hex to `var(--color-*)`.
- [ ] Replace `bg-black` with `bg-dark` in `MobileBurgerMenu.jsx:33`, and `bg-black/20` in `AppCard.jsx:81`.
- [ ] Set an explicit themed placeholder colour and stop relying on the Tailwind Preflight default.
- [ ] Remove the 11 blurred drop shadows listed below.

The shadow utilities are currently hardcoded to Midden's palette, so the design system's signature depth device does not re-tint.
Verified live on themed Canteen: `--color-grey` is `#9c9482` but the rendered `text-shadow` is `rgb(125, 126, 117)`, which is Midden's `#7d7e75`.

Placeholder text measured at **4.0:1** against the input fill, below the 4.5:1 AA threshold, suite-wide.
Tailwind Preflight resolves `::placeholder` to `color-mix(in oklab, currentColor 50%, transparent)`, which composites to `rgb(107, 112, 121)`.

Blurred shadows to strip, each forbidden by the Hard-Shadow Rule in `DESIGN.md`:

- `shared/ui/components/MiddenModal.jsx:8`
- `apps/Canteen/src/components/ListAddPopover.jsx:106,118`
- `apps/Canteen/src/components/ShareRecipePopover.jsx:111,130`
- `apps/Canteen/src/components/RecipeFilter.jsx:78`
- `apps/Canteen/src/components/SortableIngredient.jsx:119`
- `apps/Canteen/src/components/RecipeForm.jsx:471`
- `apps/Canteen/src/components/DurationInput.jsx:81`
- `apps/Canteen/src/pages/RecipeDetail.jsx:199`
- `apps/Canteen/src/pages/Messages.jsx:50`

**Close the phase in `DESIGN.md`:** document the danger token pair, restate the Hard-Shadow Rule as enforced rather than aspirational, and delete the two stale warnings that call `focus:outline-none` an outstanding defect.
The focus shim at `index.css:95-113` already handles all 34 sites correctly; the document is out of date, not the code.

---

## Phase 2 — Build the missing shared components

These are the primitives `DESIGN.md` never specified, which is why each app invented its own.
`ConfirmModal` depends on the danger token from Phase 1.

- [ ] `ConfirmModal` in `shared/ui/components/`, wrapping `MiddenModal`, taking `{ title, objectName, confirmLabel, onConfirm, isPending }`.
- [ ] An error banner primitive with a **Retry** action wired to a TanStack `refetch()`.
- [ ] An empty-state primitive, to replace the three competing voices now in use.
- [ ] Promote `PaginationControls` from `apps/Canteen/src/components/` to `shared/ui/components/`, adding an optional `totalPages` prop.

`ConfirmModal` must render its destructive action against the danger token rather than `bg-red-500`, which measures **3.76:1** with white text and passes only on hover, when it darkens to `red-600` at 4.83:1.
It must also interpolate the target's name into the message, as `CanteenUserList.jsx:116` already does correctly and three other call sites do not.

**Close the phase in `DESIGN.md`:** add component specs for confirm, error, empty state, and pagination.

---

## Phase 3 — Adopt across the apps

Mechanical once Phase 2 exists.
This is where the Consistency and Standards score, currently 1 of 4, actually moves.

- [ ] Replace the native `window.confirm()` at `UserList.jsx:102`, which currently guards permanent deletion of another person's account.
- [ ] Adopt `ConfirmModal` at `RecipeDetail.jsx:296`, `MyLists.jsx:130`, `Notes.jsx:226`, `CanteenUserList.jsx:109`.
- [ ] Add `isError` branches to `RecipeList.jsx:14`, `ListList.jsx:12`, `CanteenUserList.jsx:33`, `NoteList.jsx:44`, `Messages.jsx:89`, `UserList.jsx:42`.
- [ ] Reserve "not found" copy for genuine 404s at `RecipeDetail.jsx:82`, `UserProfile.jsx:133`, `ListView.jsx:37`.
- [ ] Add one `ErrorBoundary` around the `<Outlet />` in `Dashboard.jsx`.
- [ ] Surface mutation failures currently swallowed by `console.error` in `createTag`, `createIngredient`, `createList`, `deleteList`, `createNote`, `deleteNote`.
- [ ] Adopt the shared pagination in `Notes.jsx:204-224`, replacing the Unicode `‹`/`›` with the icon font.
- [ ] Add Canteen's missing empty-page recovery, mirroring `stepBackIfPageEmptied` at `Notes.jsx:106`.
- [ ] Replace the 21 remaining raw-palette colour classes with the danger token.

Nine list surfaces currently branch only on `loading` and `length === 0`.
With TanStack's default `retry: 3`, a down API produces roughly seven seconds of loading and then reads as "No recipes found in the canteen."
Telling a user their own data is absent when the server merely failed is worse than an error.

---

## Surface track — independent, interleave freely

None of this depends on Phases 1 through 3.

### Login

Read `.impeccable/critique/ignore.md` first: the Midden palette on every app's login screen is intended and is not a defect.

- [ ] Set `data-theme="midden"` explicitly on the login route so the palette is declared rather than inherited from the absence of an attribute.
- [ ] Add a Midden wordmark above the mode heading, in `font-gothic` with the hard shadow.
- [ ] Add a line naming the shared account system, of the order "One Midden account for Canteen, Netbook, and Midden."
- [ ] Neutralize the host app's `index.html` body background on this route, so the wrong ground cannot flash before React mounts.
- [ ] Add `autoComplete` to the username and password fields, and `autoComplete="one-time-code"` plus `inputMode="numeric"` to the 2FA field.
- [ ] Add a pending state to the submit button, which currently cannot be disabled and can be double-fired.
- [ ] Add a resend affordance to the 2FA step, and stop discarding `tempToken` when the user backs out to check their email.

### RecipeForm

- [ ] Group the seven-control header grid at `RecipeForm.jsx:427-511` into dashed `<fieldset>`s, restoring the form language and bringing chunking under four.
- [ ] Add a filter input to both tag popovers, which currently render up to 500 checkboxes with no search (`RecipeForm.jsx:471`, `RecipeFilter.jsx:78`).
- [ ] Add draft persistence, or at minimum a confirm-on-dirty-cancel; `onCancel` currently discards a forty-field form silently.
- [ ] Make the existing fraction parser at `RecipeForm.jsx:289` reachable from the quantity field at `SortableIngredient.jsx:66`, which is `type="number"` and rejects `1 1/2`.

Netbook's far smaller `NoteForm` persists every keystroke to localStorage.
The pattern to reuse lives in `apps/Netbook/src/offline/noteDrafts.js`.

### Accessibility

- [ ] Add `aria-hidden` or labels to the 11 of 23 `font-icons` spans that have neither.
- [ ] Label the back link at `Conversation.jsx:119`, whose entire content is the glyph `D`.
- [ ] Give the emoji-only copy button at `ShareRecipePopover.jsx:143` a real accessible name.
- [ ] Underline inline links at rest, or raise their contrast against body text above 3:1.
- [ ] Give the five placeholder-only controls real labels (`SortableIngredient.jsx:66,79,144`, `SortableGroup.jsx:41`), and add `htmlFor` at `PaginationControls.jsx:14`.
- [ ] Give the tabs at `UserProfile.jsx:215` and `FollowerFollowingLists.jsx:107` real ARIA, matching the Headless UI `TabGroup` already used at `Settings.jsx:44`.
- [ ] Fix the skipped heading level at `RecipeDetail.jsx:131`, and its use of `font-mono` where every sibling page title is `font-gothic`.
- [ ] Raise sub-44px touch targets, starting with the destructive delete at `UserList.jsx:98`.

Inline links measured at **2.78:1** against body text with no underline until hover, below the 3:1 threshold for distinguishing a link by colour alone.
Affected: `NetbookSplash.jsx:68`, `RecipeDetail.jsx:139`, `CanteenHome.jsx:27,79`, `ListView.jsx:48`.

### Layout

- [ ] Fix `MiddenCard.jsx:3`, whose `min-h-screen` exceeds its own container's reserved height.
- [ ] Add a `max-width` to `MiddenCard`, which currently runs to roughly 2048px of monospace on a 2560px display.
- [ ] Replace the magic header heights at `Dashboard.jsx:22` and `Conversation.jsx:117` with a `--header-height` custom property.
- [ ] Reduce `ml-24` and `gap-16` at `Header.jsx:84` so the desktop nav can appear at `lg` rather than `xl`.
- [ ] Bring display leading to the specified 1.1; it currently renders at 1.25.

Measured at an 857px viewport: `main` reserves 777px while `MiddenCard` demands 857px.
With 633px of content that produced 224px of dead space and 72px of empty overflow scroll, on every mobile page in all three apps.

The nav breakpoint was verified at 843px, 1060px, and 1700px.
On a 1710px display, any half-screen split window falls back to mobile navigation.

---

## Phase 4 — Re-measure

- [ ] Re-run `/impeccable critique` against the `shared-ui` slug.

Scoring the same target produces a trend line off the 20/40 baseline rather than an impression.
`ignore.md` keeps previously settled decisions from being re-litigated.
