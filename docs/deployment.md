# Deploying a frontend app

This is the end-to-end procedure for taking any Vite/React app in this monorepo from source to production.
It assumes the app uses IAM cookie auth (`useAuth` → `iamApi.verify()` at `/iam`) like the others.
Read `architecture.md` first for the hosting model; this document is the concrete checklist.

Throughout, `<App>` is the workspace directory name (`apps/Canteen`), `<app>` is its lowercase form used in image names, hostnames, and the API prefix (`canteen`).
Substitute both consistently.

## The model in one paragraph

Each app is a separate subdomain (`<app>.reedgaines.com`) served as static files by an nginx container.
The SPA calls its backends on the **same origin** under path prefixes: `/iam/*` for auth, and `/<app>/*` for the app's own service.
In the browser dev server, Vite proxies those prefixes (see the app's `vite.config.js`).
In production, the cluster's nginx ingress does the same routing: it sends `/` to the app's static container and `/iam`, `/<app>` to the corresponding ClusterIP services.
Cookie auth only works because everything is same-origin, so the app must be reached through the ingress, never the container directly.

## What lives where

The deploy touches three places, and it is worth knowing the split before you start because the third is the one that bites.

1. This repo owns: the app's build, its Docker image, its static-serving nginx, its Kubernetes Deployment and Service, the `/` ingress rule and TLS host for its subdomain, and the CI step that builds and rolls it out.
2. The platform owns: the DNS record for the subdomain and the cluster itself.
3. The backend repos own: the ingress path rules that send `/iam` and `/<app>` to their services **for the new host**.

Point 3 is the trap.
This repo's `k8s/ingress.yaml` only defines the `/` (SPA) route per host; the API path rules are added by `iam-service` and `<app>-service` in their own manifests.
A new subdomain will serve the SPA fine but fail every API call until those backends learn about the host.

## Step 1 — App builds standalone

Before deploying, confirm the app is a complete, buildable workspace member.
These are the things that are easy to miss and that break the build or the runtime rather than the deploy:

- `apps/<App>/package.json` has `"build": "vite build"` and the app is listed under the root `workspaces` glob (`apps/*`).
- `apps/<App>/vite.config.js` sets the `@shared/core` and `@shared/ui` aliases, points `publicDir` at `../../shared/ui/assets`, and proxies `/iam` and `/<app>` in its dev `server.proxy`.
- The app's `src` directory is registered as an `@source` glob in `shared/ui/styles/index.css`, or Tailwind will not generate its classes and the production build will look unstyled.
- `main.jsx` registers the `vite:preloadError` listener that reloads on a stale lazy chunk; without it, users hit blank pages after a redeploy.

Run `npm run build -w apps/<App>` locally and confirm a `dist/` is produced.

## Step 2 — Dockerfile

Add `apps/<App>/Dockerfile`.
It is a two-stage build, and the one non-obvious rule is that **the build context is the repo root**, not the app directory, so that `shared/` can be copied in.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/<App>/package.json ./apps/<App>/
RUN npm ci
COPY shared ./shared
COPY apps/<App> ./apps/<App>
# One ARG/ENV pair per VITE_ build var the app actually reads (see Step 6). Omit if none.
ARG VITE_FARO_API_KEY
ENV VITE_FARO_API_KEY=$VITE_FARO_API_KEY
RUN npm run build -w apps/<App>

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/<App>/dist /usr/share/nginx/html
COPY apps/<App>/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Only declare the `ARG`/`ENV` pairs for variables the app reads through `import.meta.env`.
`VITE_` values are baked in at build time, so a variable the app does not read is dead weight, and one it does read but you forget will silently be `undefined` in production.

## Step 3 — nginx.conf

Add `apps/<App>/nginx.conf`.
This file is identical across every app; copy it verbatim.
It serves the static build, falls back to `index.html` for client-side routes, caches hashed assets for a year, and forbids caching `index.html` so a redeploy is picked up immediately.

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location ~* \.(?:css|js|woff2?|eot|ttf|svg|png|jpe?g|gif)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

This nginx does not proxy `/iam` or `/<app>`; the ingress does that (Step 5).

## Step 4 — Kubernetes Deployment and Service

Add `k8s/<app>-deployment.yaml` with a Deployment and a ClusterIP Service.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app>-client
spec:
  replicas: 1
  selector:
    matchLabels:
      app: <app>-client
  template:
    metadata:
      labels:
        app: <app>-client
    spec:
      containers:
      - name: <app>-client
        image: crymall/<app>-client:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: <app>-client
spec:
  type: ClusterIP
  selector:
    app: <app>-client
  ports:
  - port: 80
    targetPort: 80
```

The Service name is arbitrary but must match the ingress backend in Step 5.
Existing apps are inconsistent here (`canteen-client` is named `canteen-client`, but Midden's Service is `midden-service`), so do not assume a convention — just keep the name identical in both files.

## Step 5 — Ingress: SPA route and TLS

Edit `k8s/ingress.yaml`.
Add a rule sending `/` to the app's Service:

```yaml
# a new entry under spec.rules:
  - host: <app>.reedgaines.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: <app>-client
            port:
              number: 80
```

The workspace ingress owns each app host and its certificate, so add the subdomain to `spec.tls[0].hosts` (the shared `workspace-tls-secret` SAN cert):

```yaml
# under spec.tls[0].hosts:
    - <app>.reedgaines.com
```

The host's root (`/`, the SPA) is a frontend concern, so the frontend ingress is the natural owner of the host and its TLS; a backend under `/<app>` should contribute only its path rule and declare no `tls` for the host.
A host's certificate must be declared in exactly one ingress — two ingresses declaring TLS for the same host with different `secretName`s is undefined behavior in nginx-ingress, though path rules across ingresses merge cleanly.

If the app's backend already deployed under `<app>.reedgaines.com` and declares TLS for it (its repo's ingress has a `tls` block naming the host), migrate that ownership here rather than leaving it split:

1. Add the host to `workspace-tls-secret` here and deploy this repo first. Both ingresses now declare TLS for the host, but both certs are valid, so nginx serves one and TLS keeps working while cert-manager reissues `workspace-tls-secret` to cover the host.
2. Then remove the `tls` block from the backend repo's ingress (keep its path rule) and deploy it.
3. Delete the now-orphaned backend cert secret and its `Certificate` resource.

Adding here first and removing there second means the host is never left without a valid certificate; doing it in the other order would open an outage window.

## Step 6 — Ingress: API path routing (the cross-repo step)

The SPA route above is not enough.
For the new host, `/iam/*` must reach `iam-service` and `/<app>/*` must reach `<app>-service`, or auth and all data calls fall through to the SPA's `index.html` and return HTML where the client expects JSON.

In this repo's model those path rules live in the backend repos, not here.
So for each backend the app talks to, add the new host to that repo's ingress:

- `iam-service`: route `<app>.reedgaines.com/iam` → the IAM service. Every app needs this.
- `<app>-service`: route `<app>.reedgaines.com/<app>` → the app's own service. Only if the app has a backend.

The nginx ingress controller merges multiple Ingress objects for the same host, so these can be separate resources.
After deploy, verify this worked (Step 9) rather than assuming it.

## Step 7 — CI/CD

Edit `.github/workflows/deploy.yml`.
Add a build-and-push step for the image:

```yaml
    - name: Build and push <App>
      uses: docker/build-push-action@v4
      with:
        context: .
        file: apps/<App>/Dockerfile
        push: true
        tags: |
          crymall/<app>-client:${{ github.sha }}
          crymall/<app>-client:latest
        platforms: linux/amd64
        build-args: |
          VITE_FARO_API_KEY=${{ vars.VITE_FARO_API_KEY }}
```

Include only the `build-args` the app's Dockerfile declares.
Then, in the `Deploy to Kubernetes` step, pin the image to the commit SHA and wait for the rollout, matching the existing lines:

```bash
sed -i 's|crymall/<app>-client:latest|crymall/<app>-client:${{ github.sha }}|g' k8s/<app>-deployment.yaml
# ... existing kubectl apply -f k8s/ ...
kubectl rollout status deployment/<app>-client
```

`kubectl apply -f k8s/` already applies the whole directory, so the new manifest and the edited ingress ship automatically once the files exist.

If the hub (Midden) links to this app, wire the link too: add a `VITE_<APP>_URL` build-arg to Midden's build step sourced from a `PROD_<APP>_URL` repo variable, and read it in `shared/core/utils/constants.js`.

## Step 8 — Secrets, variables, and DNS

Confirm the GitHub repo has what the workflow references.

- Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `KUBE_CONFIG`.
- Variables: `VITE_FARO_API_KEY` if the app ships Faro, `PROD_<APP>_URL` if another app links to it, plus any `VITE_` variable the app reads.

Create a DNS record for `<app>.reedgaines.com` pointing at the ingress controller's load-balancer IP (the same target the existing subdomains use).
If the app's backend already serves this host, the record already exists and this is a no-op.
The TLS certificate is handled by cert-manager once the host is in the ingress `tls` list and the ingress is applied; no manual cert step.

## Step 9 — Deploy and verify

Merge to `main`.
`deploy.yml` runs the tests, builds and pushes the images, applies `k8s/`, and waits for the rollouts.

Then verify against the live host rather than trusting a green pipeline:

- `curl -I https://<app>.reedgaines.com/` returns 200 and the SPA HTML, on a valid certificate.
- `curl -i https://<app>.reedgaines.com/iam/verify` returns a JSON 401 (unauthenticated), **not** HTML. HTML here means Step 6 is missing and the request fell through to the SPA.
- If the app has a backend, hit one of its endpoints the same way and confirm JSON, not HTML.
- Log in through the UI and exercise the app's own data path end to end.

## Optional — Observability

To register the app with Grafana Faro: create a Faro app in Grafana to get its `appId`, `stackId`, and collector URL, add the `faroUploader` rollup plugin to `vite.config.js` (see `apps/Canteen/vite.config.js`), initialize Faro in `main.jsx` with the real collector URL, and pass `VITE_FARO_API_KEY` as a build-arg.
Until then, an app can ship with Faro initialized `paused: true` against a placeholder URL and omit the uploader plugin, which is how a not-yet-registered app avoids emitting to a nonexistent collector.

## Quick checklist

- [ ] `npm run build -w apps/<App>` succeeds; app registered in `@source` globs.
- [ ] `apps/<App>/Dockerfile` (repo-root context, correct build-args).
- [ ] `apps/<App>/nginx.conf` (verbatim copy).
- [ ] `k8s/<app>-deployment.yaml` (Deployment + Service, names matched).
- [ ] `k8s/ingress.yaml` (TLS host + `/` rule; migrate the cert here if a backend already owns it).
- [ ] Backend repos route `/iam` and `/<app>` for the new host.
- [ ] `deploy.yml` build step, SHA pin, and rollout wait added.
- [ ] GitHub secrets/variables present; DNS record created.
- [ ] Post-deploy: SPA loads, `/iam/verify` returns JSON 401, login works.
