## 1. Add a query-key factory and a Canteen hooks layer

Query keys are hand-written at roughly thirty call sites and their shapes have drifted.
`["userLists", user?.canteenId]` and `["userLists", id, { page, limit }]` coexist, so an invalidation of one does not reliably reach the other.
Invalidations are correspondingly broad; `["searchedRecipes"]` is invalidated with no parameters from three separate places.

Netbook has `apps/Netbook/src/hooks/useNotes.js`; Canteen has no equivalent, so pages import service functions directly and each re-derives its own caching contract.
A key factory plus per-resource hooks would make cache invalidation a property of the resource rather than of each page that happens to touch it.

## 2. Adopt TypeScript, starting at the API boundary

Commit `37fbcaf`, "add frontend changes for new db query shape on backend," is the canonical failure mode of four independently deployed repositories sharing an untyped JSON boundary.
Nothing in this repo can detect a backend response-shape change until it renders wrong.

Generating types from the service contracts and typing `shared/core/services/*` would catch that class at build time.
TypeScript is already on `docs/roadmap.md`; it belongs above most of the feature work listed there.

## 3. Add end-to-end coverage

There are 404 tests and no browser tests.
The riskiest behaviours in this system are cross-subdomain cookie auth, ingress path routing, and Netbook's flush-on-reconnect, and none of them are observable in jsdom.

One Playwright spec covering login, navigation to a guarded route, and a reload would cover more production risk than a large fraction of the existing component tests.
A second covering an offline note write followed by reconnection would cover the rest.

## 4. Tighten the delivery path

- `deploy.yml` fires on every push to `main`, with no branch protection and no staging environment.
- All three deployments are `replicas: 1` with no readiness or liveness probes and no resource requests or limits, so every rollout is a brief outage and any node pressure is unbounded.
- Image pinning is done by `sed` over the manifests in the workflow rather than by rendering them.
- `ci.yml` runs lint and tests; `deploy.yml` re-runs only tests. Lint is not gating a deploy.

Adding probes and a second replica removes deploy-time downtime and is a small change.
Branch protection on `main` is smaller still, and is listed on the roadmap already.