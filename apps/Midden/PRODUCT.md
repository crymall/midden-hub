# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of equal weight (design trade-offs must satisfy both):

- **People evaluating Reed Gaines professionally** — prospective employers and clients who reach the suite to judge engineering and design craft. For them, working functionality is the proof.
- **Curious visitors** arriving at the personal hub to browse the sub-apps and one-off experiments.
- **Site administrators** (currently Reed) who manage user accounts across the suite from the guarded settings/admin surface.

## Product Purpose

Midden is the portal and locus of Reed Gaines's personal development work: a directory that links out to the sub-apps (Canteen, Netbook) and smaller experiments, and the single sign-on hub for the whole suite — registering for one app creates an account on them all.
It is loosely inspired by Chinese mega-apps (WeChat, Alipay) as an all-in-one entry point.
Success is a visitor understanding the breadth and quality of the work and moving into a sub-app, and an administrator managing users without friction.

## Positioning

The "midden" framing is the position no neighboring portal would copy: a personal archaeological trashheap — work tossed into the world now, trusting it may prove worth something later — rather than a polished corporate product hub.
Unified SSO across a family of genuinely separate, independently useful apps distinguishes it from a static links page or résumé site.

## Operating Context

- Public routes: Explorer (home directory), About, Professional Showcase, Experiments.
- Guarded route: Settings (self-gates via `RequireNotGuest`; the shared `guest` account is treated as logged-out).
- Two-step login: password returns a temp token, then a 2FA code seeds the session; auth is cookie-based, no client-stored tokens.
- Outbound links are part of the experience: reedgaines.com (bio/contact), the GitHub repos, and standalone experiments (a Bluesky "100 years ago" newspaper bot, Chutes Resolver, Revolutionary Date converter, Midnight Info).

## Capabilities and Constraints

- Frontend-only React 19 SPA in an npm-workspaces monorepo; no API endpoints are defined here — clients call path-prefixed backend routes (`/iam/*`).
- Identity is provided by the separate iam-service; roles are Admin and Editor, permissions are `write:users` and `write:data`.
- Admin user management lives on the settings/admin surface (roadmap calls for a more robust admin dashboard).
- Shared UI, service routing, and auth are reused across all suite apps.

## Brand Commitments

Binding across the whole suite (Midden, Canteen, Netbook share one UI layer); future work preserves these and never redesigns them away:

- **Identity:** the work reads unmistakably as Reed Gaines's — a solo developer, open source, tied to reedgaines.com for bio and contact. Not a faceless brand.
- **Voice:** literate, self-deprecating, anti-corporate, matter-of-fact. "No ads, ever." No tracking of private information. Open source, open beta, open to suggestions.
- **Concept:** the "Midden" archaeological-accumulation metaphor and its self-deprecating framing (see the About copy) are load-bearing, not decoration.
- **Aesthetic direction (durable, stated by the owner):** retro, pixellated, monospaced; personal and handmade. Responsive to user input but deliberately not Web 2.0-or-later in feel. Brutalist in spirit but never hard to use. Gothic display font and dashed-border accents. Serif faces and skeuomorphism are welcome; the touchstone is the web design of 1990s point-and-click adventure games. Always surface information to the user rather than obfuscate or over-simplify — rely on strong hierarchy to keep dense information parsable.

_This section records the direction as a product constraint; the concrete visual system (tokens, type scale, components) belongs in DESIGN.md, produced later by new-work._

## Evidence on Hand

- Live, functioning suite at midden.reedgaines.com (and canteen./netbook.).
- Real product copy: `apps/Midden/src/pages/About.jsx`, the Explorer/Showcase/Experiments pages, and `shared/core/utils/constants.js` (nav + experiment link list).
- Architecture write-up at `docs/architecture.md`; roadmap at `docs/roadmap.md`.
- No testimonials, customer counts, benchmarks, or pricing exist — future work must not fabricate them.

## Product Principles

1. Prove craft by working, not by claiming — the functioning app is the portfolio.
2. Surface information; trust hierarchy over hiding. Density is fine when it is legible.
3. Stay handmade and personal; resist generic SaaS polish and the corporate-product register.
4. One identity, many apps — SSO and shared UI make the suite feel like one hand made it.
5. No ads, no private-data tracking, ever.

## Accessibility & Inclusion

**Standard: WCAG 2.2 Level AA** across the whole suite. This is a durable commitment, not aspirational — new work must meet it. Concretely: text and placeholder contrast ≥4.5:1 (large text and non-text UI ≥3:1) against the active theme's dark ground; visible, non-obscured keyboard focus on every interactive element (do not ship `outline:none` without an equal replacement); ≥24px target sizing; and the suite's density goal — surface information, keep it legible through hierarchy — must never come at the cost of these thresholds. See DESIGN.md's Do's and Don'ts for the visual guardrails.
