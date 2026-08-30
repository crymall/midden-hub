# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of equal weight (design trade-offs must satisfy both):

- **Anyone wanting a private, plain-text notebook** — primarily Reed himself, with others welcome. The job is jotting down and organizing thoughts, fast, with nothing in the way.
- **People evaluating Reed Gaines professionally**, for whom Netbook is a deliberate engineering showcase: an offline-first, optimistic-concurrency client backed by a polyglot .NET service inside the shared identity system.

## Product Purpose

Netbook is a quiet, private, plain-text notebook — "a quiet place to think." Signed-in users get the whole notebook on one page: an inline new-note form, a paginated list of notes that expand to read and edit in place, and delete confirmation. It signs in with the Midden account, so there is no separate password.
Success is the shortest possible path from a thought to a saved note, and confidence that notes are private and never lost — even offline.

## Positioning

Local-first editing is the differentiator a typical notes app would not casually copy: creates, edits, and deletes made offline are queued and flushed when connectivity returns, with server-side optimistic concurrency. On conflict the client keeps both sides as a visible "conflicted copy" rather than silently discarding an edit — conflict resolution stays in the user's hands.
The backend is intentionally polyglot (C#/ASP.NET Core, distinct from the suite's Node services) yet stays inside the shared IAM identity, proving the identity layer generalizes across stacks.

## Operating Context

- A single public route that self-gates: signed-out visitors see a splash; signed-in users see the notebook. No route guard, no `/notes/*` sub-routes.
- Notebook interactions: inline "+ New note" form, numbered Prev/Next pagination (page size 10), expand-a-card to read then edit in place, delete-confirm modal.
- Offline behavior: a coalescing queue under the `["pendingNotes"]` query key persists to localStorage; repeated offline edits to one note collapse to a single write; in-progress form text is saved per keystroke so a refresh or post-deploy reload loses nothing.

## Capabilities and Constraints

- Frontend-only React 19 SPA; notes come from the separate netbook-service (C#/ASP.NET Core, `/netbook/*` routes), no endpoints defined here.
- Offline creates are intentionally at-least-once — duplicates are visible and user-repairable, so there are no client-generated ids.
- Flushed updates/deletes send an optional `updatedAt` precondition; the service `409`s when the stored row is strictly newer, and the client turns that into a "(conflicted copy)" note.
- Notes are plain text and private to their owner. No Faro/Grafana "netbook" app is registered yet — telemetry is paused with a placeholder collector.

## Brand Commitments

Binding across the whole suite (Midden, Canteen, Netbook share one UI layer); future work preserves these and never redesigns them away:

- **Identity:** solo developer, open source, part of the Midden family — Reed Gaines's work, not a faceless brand.
- **Voice:** literate, understated, anti-corporate, matter-of-fact. "No ads, no tracking, no clutter. Just your notes."
- **Aesthetic direction (durable, stated by the owner):** retro, pixellated, monospaced; personal and handmade. Responsive to user input but deliberately not Web 2.0-or-later in feel. Brutalist in spirit but never hard to use. Gothic display font and dashed-border accents. Serif faces and skeuomorphism are welcome; the touchstone is the web design of 1990s point-and-click adventure games. Always surface information rather than obfuscate or over-simplify — rely on strong hierarchy. For Netbook specifically this means calm and uncluttered: nothing between the writer and the page.

_This section records the direction as a product constraint; the concrete visual system (tokens, type scale, components) belongs in DESIGN.md, produced later by new-work._

## Evidence on Hand

- Live app at netbook.reedgaines.com.
- Real product copy: `apps/Netbook/src/pages/NetbookSplash.jsx` and the `Notes` page.
- Full offline design write-up at `docs/offline-notes.md`; architecture context in `docs/architecture.md`.
- No user counts or usage metrics exist — future work must not fabricate them.

## Product Principles

1. Shortest path from thought to saved note; nothing between the writer and the page.
2. Never lose a note — offline writes queue and flush; conflicts surface both copies, never silently drop one.
3. Private by default: plain text, owner-only, no tracking.
4. Calm and uncluttered; do the least the task needs.
5. Stay handmade and personal; part of the Midden family, signed in with one account.

## Accessibility & Inclusion

**Standard: WCAG 2.2 Level AA** across the whole suite. This is a durable commitment, not aspirational — new work must meet it. Concretely: text and placeholder contrast ≥4.5:1 (large text and non-text UI ≥3:1) against Netbook's dark ground; visible, non-obscured keyboard focus on every interactive element (do not ship `outline:none` without an equal replacement); ≥24px target sizing. The calm, low-clutter aim reinforces this rather than competing with it. See DESIGN.md's Do's and Don'ts for the visual guardrails.
