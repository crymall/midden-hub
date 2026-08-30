# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of equal weight (design trade-offs must satisfy both):

- **Home cooks** who want to find, store, organize, and share recipes without ads or distraction — "for home cooks, by home cooks."
- **People evaluating Reed Gaines professionally**, for whom Canteen is proof of full-stack craft. A working recipe community demonstrates the skill.

The app is community-facing (contribution is invited) while candidly framed as a solo-developer open beta.

## Product Purpose

Canteen stores, organizes, and shares recipes: a searchable community collection anyone can contribute to, personal recipe lists ("curate your own recipe book"), and lightweight social features — user profiles, following, and messaging.
Success is a home cook finding or saving the recipe they need quickly, and choosing to contribute their own.

## Positioning

An ad-free, distraction-free recipe community built on a potluck model — the community's best recipes made searchable, with contribution encouraged rather than monetized.
This stands against ad-choked, SEO-bloated recipe sites; the differentiator is "no ads, ever" plus a genuine solo-made, open-source, open-beta posture.

## Operating Context

- Public routes: home, recipe search, recipe detail, user profiles.
- Guarded routes (require a signed-in account): create/edit recipe, my-lists and list detail, messages and conversations, a user's follower/following network.
- Cookie-based SSO shared with the Midden suite; a Canteen identity (`canteenId`) is enriched onto the current user from canteen-service (its failure is non-fatal).
- Two-step login (password + 2FA), identical to the rest of the suite.

## Capabilities and Constraints

- Frontend-only React 19 SPA; recipe/list/message/like data comes from the separate canteen-service (`/canteen/*` routes), no endpoints defined here.
- Recipe CRUD, likes/favorites, lists, following, and direct messaging exist today.
- Explicitly planned but undecided (roadmap, do not treat as shipped): ingredient/cook-time search, most-liked/most-favorited sorting, recipe comments, ingredient grouping, an emailable grocery list, a screen-on "cook mode", and message pagination.

## Brand Commitments

Binding across the whole suite (Midden, Canteen, Netbook share one UI layer); future work preserves these and never redesigns them away:

- **Identity:** solo developer, open source, tied to reedgaines.com — Reed Gaines's work, not a faceless brand.
- **Voice:** literate, self-deprecating, anti-corporate, matter-of-fact. "No ads. Ever." Community-first, open to suggestions.
- **Aesthetic direction (durable, stated by the owner):** retro, pixellated, monospaced; personal and handmade. Responsive to user input but deliberately not Web 2.0-or-later in feel. Brutalist in spirit but never hard to use. Gothic display font and dashed-border accents. Serif faces and skeuomorphism are welcome; the touchstone is the web design of 1990s point-and-click adventure games. Always surface information rather than obfuscate or over-simplify — rely on strong hierarchy to keep dense information (ingredients, instructions, lists) parsable.

_This section records the direction as a product constraint; the concrete visual system (tokens, type scale, components) belongs in DESIGN.md, produced later by new-work._

## Evidence on Hand

- Live app at canteen.reedgaines.com with real recipe/list/messaging functionality.
- Real product copy: `apps/Canteen/src/pages/CanteenHome.jsx` and the recipe/list/message pages.
- No testimonials, user counts, or recipe-library metrics exist — future work must not fabricate them.

## Product Principles

1. The recipe is the point — ingredients and instructions readable without distraction, ads, or friction.
2. Contribution is a potluck, not a transaction; make sharing effortless and social features light.
3. Surface information; trust hierarchy over hiding.
4. Stay handmade and personal; resist generic recipe-site polish.
5. No ads, no private-data tracking, ever.

## Accessibility & Inclusion

**Standard: WCAG 2.2 Level AA** across the whole suite. This is a durable commitment, not aspirational — new work must meet it. Concretely: text and placeholder contrast ≥4.5:1 (large text and non-text UI ≥3:1) against Canteen's dark ground; visible, non-obscured keyboard focus on every interactive element (do not ship `outline:none` without an equal replacement); ≥24px target sizing. This matters most on recipe content under load — long ingredient lists and step instructions must stay legible without dropping below these thresholds. See DESIGN.md's Do's and Don'ts for the visual guardrails.
