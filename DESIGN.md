---
name: Midden Hub
description: A handmade, excavated-console design language shared across the Midden family of apps.
colors:
  dark: "#060a08"
  primary: "#210130"
  accent: "#4a9d5b"
  grey: "#7d7e75"
  light-grey: "#b0b2b8"
  lightest-grey: "#cfd6ea"
  chalk-white: "#ffffff"
typography:
  display:
    fontFamily: "Jacquard 12, cursive"
    fontSize: "clamp(2rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Libertinus Mono, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  icon:
    fontFamily: "Midden Icons, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.grey}"
    textColor: "{colors.dark}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.light-grey}"
    textColor: "{colors.dark}"
  button-nav:
    backgroundColor: "{colors.grey}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
  button-icon:
    backgroundColor: "{colors.grey}"
    textColor: "{colors.dark}"
    typography: "{typography.icon}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  input-field:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.lightest-grey}"
    rounded: "{rounded.none}"
    padding: "8px"
  card-panel:
    backgroundColor: "transparent"
    textColor: "{colors.lightest-grey}"
    rounded: "{rounded.none}"
    padding: "24px"
---

# Design System: Midden Hub

## Overview

**Creative North Star: "The Excavated Console"**

One design language serves the whole Midden family — Midden, Canteen, and Netbook draw from a single `shared/ui` layer and one stylesheet, re-tinted per app through `[data-theme]` overrides. The world it builds is a fusion of three ideas that the owner named together: an **archaeological dig-site** (the "midden" — an accumulation excavated and laid out for inspection), a **1990s point-and-click adventure interface** (chunky clickable slabs, a glyph font that acts like a verb list, a CRT-terminal calm), and a **handmade bulletin** (dashed cut-outs pinned to a dark board, deliberately un-slick). Nothing here is Web 2.0 or later: no rounded pills, no soft glass, no gloss.

The result is brutalist in spirit but never hostile. Surfaces are near-black grounds; type is a blackletter gothic display (`Jacquard 12`) set against a monospace body (`Libertinus Mono`); everything is squared-off and framed in dashed "excavation tape" in the app's single accent color. Depth is a hard, zero-blur letterpress shadow — an intentional 8-bit/print artifact, not a naturalistic elevation. Information is surfaced, not hidden: density is welcome as long as hierarchy keeps it legible. The one thing this system refuses is the generic SaaS register — the slick, safe, rounded-and-shadowed look it is defined against.

**Key Characteristics:**
- Near-black grounds, one saturated accent per theme, no light mode.
- Blackletter display + monospace body; no third typeface.
- Zero border-radius; dashed borders are the form language.
- Hard 2px/2px zero-blur text-shadows as the only "depth."
- A bespoke `Midden Icons` glyph font supplies all iconography.

## Colors

A dark, tonal palette: every surface descends from one near-black ground, and each app owns exactly one accent that carries links, active glyphs, and dashed borders. Contrast is earned by lightening text over the dark ground, never by inverting to a light surface. The frontmatter tokens are the **Midden (default) theme**; the two `[data-theme]` blocks below re-tint the same token names.

### Primary
- **Signal Moss** (`#4a9d5b`): the Midden accent — links, list bullets, active glyphs, and the dashed borders that frame every panel. AA-text-safe on the dark ground (≈5.9:1). Used sparingly; its scarcity is the signal.

### Neutral
- **Excavation Black** (`#060a08`): the ground under everything — page and `<main>` background. A near-black with a faint green undertone.
- **Deep Regolith Violet** (`#210130`): raised fields — the header bar and the login panel. Reads as a darker slab against the black.
- **Ash Grey** (`#7d7e75`): the default button/control surface, paired with dark text.
- **Bone Grey** (`#b0b2b8`): button hover surface and secondary text.
- **Cold Chalk** (`#cfd6ea`): primary body text on the dark ground.
- **Chalk White** (`#ffffff`): headings and interactive text at rest.

### Theme Variants
The same token names are overridden per app. Each variant keeps the One-Accent and Dark-Ground rules.

- **Canteen** (`[data-theme="canteen"]`) — a warm kitchen palette. Ground **Roast Umber** (`#2a1b15`), field **Terracotta Clay** (`#6b3e2e`), accent **Sage Olive** (`#b2b67f`, ≈7.8:1 on ground), plus **Kitchen Ash** (`#9c9482`), **Oat** (`#dcd5ca`), **Warm Parchment** (`#f2ebd9`).
- **Netbook** (`[data-theme="netbook"]`) — a cool desk-lamp palette. Ground **Midnight Slate** (`#131824`), field **Ink Navy** (`#1e3a5f`), accent **Lamplight Brass** (`#ad8a43`, ≈5.5:1 on ground), plus **Slate Ash** (`#7a8194`), **Fog** (`#c0c7d6`), **Paper Blue** (`#eaeef7`).

### Named Rules
**The One Accent Rule.** Each theme carries exactly one accent. It appears on borders, links, active glyphs, and bullets — never as a large fill. Adding a second accent hue breaks the world.

**The Dark-Ground Rule.** Every surface descends from `--color-dark`. There is no light mode. Earn contrast by lightening text, not by inverting the ground.

## Typography

**Display Font:** Jacquard 12 (blackletter gothic; fallback `cursive`)
**Body / Label Font:** Libertinus Mono (monospace; fallback `monospace`)
**Icon Font:** Midden Icons (custom OpenType glyph font; single letters map to symbols, e.g. `B` is a chevron, `T` is a gear)

**Character:** A collision of centuries — medieval blackletter headings over a machine-precise monospace body. The pairing is the whole personality: handmade and archival on top, terminal and exact underneath. Pixel-hinting is disabled on the display and icon faces (`-webkit-font-smoothing: none`) to keep the retro, un-antialiased edge.

### Hierarchy
- **Display** (Jacquard 12, `clamp(2rem, 6vw, 4.5rem)`, line-height ~1.1): page titles and the app wordmark in the header. Always paired with the hard grey text-shadow.
- **Headline** (Libertinus Mono, bold, ~1.25–1.5rem): section headings inside content (`h3`).
- **Body** (Libertinus Mono, 400, 1rem, line-height ~1.6): all running text, list items, form values.
- **Label** (Libertinus Mono, bold, 0.875rem): form labels, muted captions, uppercase status text (e.g. the loading message is uppercase, tracking-widest).

### Named Rules
**The Two-Face Rule.** Blackletter display, monospace everything-else. There is no third family, ever — and monospace here is the body voice of the whole product, not a "code" costume.

## Layout

A single centered column on a full-bleed dark ground. The `Header` is a full-width bar with a 4px dashed bottom border; below it, `<main>` centers content and each page wraps in `MiddenCard` — full-width and `min-h-screen` on mobile, `w-4/5` and self-sizing from `md` up. Vertical rhythm is generous stacking (`gap-6`/`gap-8` between sections, `space-y-8` within), airy rather than dense despite the "surface everything" ethos.

Mobile-first. The desktop horizontal nav appears only at `xl`; below it, navigation collapses into a full-screen black overlay opened by a burger glyph. Directory rows (`AppCard`) show their description inline on desktop and behind an expand toggle on mobile, so small screens stay scannable. Spacing follows the Tailwind scale in practice: `8 / 16 / 24 / 32 / 64px` are the load-bearing steps.

## Elevation & Depth

Flat by construction. There are no naturalistic drop shadows and no blur. Depth is expressed three ways: (1) a **hard cast shadow** on white display type — `text-shadow: 2px 2px 0` in grey/light-grey, zero blur, a deliberate letterpress/8-bit device; (2) **dashed borders** in the accent that frame panels like pinned cut-outs; and (3) **tonal layering** — faint `white/5` and `primary/20` washes lift interactive surfaces a step off the ground on hover. Modals darken the field with a flat `black/70` scrim, not a blur.

### Named Rules
**The Hard-Shadow Rule.** The signature shadow is offset `2px 2px` with **zero blur**. It is a stylistic artifact, not an elevation cue. If a shadow has blur, it does not belong to this system.

**The Flat-Ground Rule.** Surfaces are flat at rest. The only "lift" is a tonal wash (`white/5`, `primary/20`) that appears on hover — never a soft shadow.

## Shapes

Radius is `0` everywhere; corners are cut, not rounded. The recurring silhouette is the **dashed-bordered rectangle** — 2px dashed for cards and panels, 4px dashed for structural edges like the header underline and the login card. Borders are the primary delineation device, standing in for the shadows and dividers a softer system would use. Dividers inside panels are thin dashed rules (`border-white/10`). This is the "excavation tape / adventure-game inventory frame" motif, and it is load-bearing, not decorative.

### Named Rule
**The Square-Cut Rule.** No border-radius, anywhere. Forms are cut and framed in dashed tape.

## Components

### Buttons
- **Shape:** square (`0` radius), no border; solid slab.
- **Primary:** Ash Grey fill with Excavation-Black text, `8px 16px` padding. Hover shifts the fill to Bone Grey (`bg-grey → bg-lightGrey`). Used for form submits and primary actions.
- **Nav / auth:** Ash Grey fill with white text (`4px 12px`); the login button hovers toward a translucent accent.
- **Icon buttons:** Ash Grey slab rendering a `Midden Icons` glyph in dark, with the hard text-shadow (settings `T`, logout `uJ`). These read as adventure-game verbs.
- **Focus:** must stay clearly visible — see Do's & Don'ts; do not rely on hover alone.

### Cards / Containers
- **Corner style:** square (`0` radius).
- **Border:** 2px dashed in the theme accent; internal dividers are 1px dashed `white/10`.
- **Background:** transparent on desktop, faint `white/5` on mobile; hover raises a `primary/20` wash.
- **Padding:** `24px` (`p-6`) typical.

### Inputs / Fields
- **Style:** Excavation-Black fill, 1px Ash-Grey border, Cold-Chalk text, square corners, `8px` padding.
- **Focus:** border shifts to the lightest neutral. **Note:** the current `focus:outline-none` weakens keyboard focus and must be strengthened to meet WCAG 2.2 (see Don'ts).
- **Error / info:** flat bordered banners — red border + `red-900/50` fill for errors, blue for info.

### Navigation
- **Desktop:** monospace text links in the header, white at rest → Cold Chalk on hover; the blackletter wordmark doubles as the home link, carrying the hard shadow.
- **Mobile:** a burger glyph opens a full-screen flat-black overlay with large blackletter links, closed by an `X`.

### Signature Component — the Directory Row (`AppCard`)
The clearest expression of the world: a dashed-accent-bordered row pairing a large `Midden Icons` glyph, a bold label, an optional description, and a trailing `B` chevron glyph in the accent. Hovering washes the row in `primary/20` and brightens text and chevron to white — a point-and-click "hotspot" lighting up under the cursor. On mobile it splits into an expand toggle plus a separate navigate affordance so the whole row need not be one target.

### Signature Component — the Moon-Phase Loader (`Loading`)
The suite's one authored motion moment, and its loading indicator everywhere. A large `Midden Icons` moon glyph (pale `lightestGrey`, `text-7xl`/`8xl`, with the hard letterpress shadow) cycles the eight lunar phases — glyphs `1 2 3 4 5 6 7 0` in order — advancing one discrete frame every ~160ms (~1.3s per full cycle). Below it, an uppercase, wide-tracked "Loading…" label breathes with the pulse animation. The stepping is deliberately discrete, not a smooth tween — phase illustrations are discrete, and the retro world rejects Web-2.0 easing. The moon is `aria-hidden`; the label carries `role="status"` so the state is announced. **Motion:** the phase cycle is a JS interval, not a CSS animation; under `prefers-reduced-motion: reduce` it holds on a static full moon (phase `5`) and the label stops pulsing — meaning preserved, motion removed.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (`0` radius); the form language is cut, not rounded.
- **Do** delineate with dashed borders in the theme accent — 2px for cards/panels, 4px for structural edges.
- **Do** pair `Jacquard 12` display with `Libertinus Mono` body, and nothing else.
- **Do** use `Midden Icons` glyphs for all iconography; map single letters to symbols as the existing components do.
- **Do** apply the hard `2px 2px 0` (zero-blur) text-shadow to white display headings as the signature depth.
- **Do** meet **WCAG 2.2 Level AA**: body/placeholder text ≥4.5:1, large text and non-text UI (borders, glyphs used as controls) ≥3:1, measured against the active theme's `--color-dark`. The accent is now AA-text-safe on the dark ground in all three themes — preserve that when retheming.
- **Do** tint secondary text from the neutral ramp (Cold Chalk / Bone Grey); never drop below 4.5:1 with a mid-grey.
- **Do** gate every looping animation behind `motion-safe:` / `prefers-reduced-motion`, with a static fallback that keeps the meaning — the moon loader rests on a full moon, pulses stop, nothing disappears.

### Don't:
- **Don't** introduce border-radius, blurred drop shadows, gradients, gradient text, or glassmorphism — each breaks the Excavated Console.
- **Don't** use `--color-accent` as a button background behind white text unless the pair clears 4.5:1; back accent fills with dark text instead.
- **Don't** ship `focus:outline-none` without an equally visible replacement — WCAG 2.2 (2.4.11 Focus Not Obscured, 2.4.13 Focus Appearance) requires a clear focus indicator; strengthen the input/nav focus states.
- **Don't** add a second accent hue to any theme; one accent, used sparingly.
- **Don't** reach for post-2.0 polish (soft shadows, rounded pills, glossy gradients). The aesthetic is deliberately pre-2.0 and handmade.
