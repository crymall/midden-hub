# Critique findings to ignore

Findings listed here are deliberate product decisions, not defects.
`/impeccable critique` reads this file and drops matching findings silently.
Add an entry when a critique flags something you have consciously chosen to keep.

---

## `/login` renders in the Midden palette regardless of host app

**Decided:** 2026-07-29.

The login screen is a shared identity surface — one `iam-service` account spans Midden, Canteen, and Netbook.
It is intended to carry Midden branding no matter which app the user arrived from, in the manner of a central SSO page.

Do **not** report the Midden palette on `canteen.reedgaines.com/login` or `netbook.reedgaines.com/login` as a theming bug, a brand discontinuity, or a phishing-signature risk.

Still in scope, and deliberately not ignored:

- `data-theme` is absent on the login route rather than explicitly set to `"midden"`, so the correct palette arrives by falling through to `@theme` defaults instead of by declaration.
- The host app's `index.html` body background still paints underneath, so the wrong ground can flash before React mounts and on overscroll.
- The page carries no Midden wordmark or any text naming the shared account system.
