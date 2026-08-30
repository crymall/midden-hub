# Architecture

## Overview

Midden is an a directory app for my personal dev work, very loosely inspired by Chinese mega-apps such as WeChat and Alipay. It links to sub-apps and other one-off projects, and provides a handy all-in-one place for site administrators to manage user accounts. With that in mind, this repository, Midden Hub, contains multiple discrete frontends with shared functionality for UI, service routing, and authentication. Microservices for authentication and discrete app data are versioned in separate repositories, such as [iam-service](https://github.com/crymall/iam-service) and [canteen-service](https://github.com/crymall/canteen-service).

## Application Architecture

This monorepo uses NPM Workspaces to manage shared dependencies and configurations.

### Frontend Clients

- **Midden**: The primary portal built with React 19 and styled with [Tailwind CSS](https://tailwindcss.com/).
- **Canteen**: An app for storing, organizing, and sharing recipes.
- **Netbook**: A personal notes app whose writes keep working offline.
- **Shared UI**: All clients utilize shared pages and components for visual and functional consistency without duplication.

### Backend Microservices

- **IAM Service**: A Nodejs/Express service managing identity and access across all Midden-affiliated applications.
- **Canteen Service**: A service for the Canteen application, handling CRUD functionality for recipes, likes, lists, messages, and anything else related to Canteen.
- **Netbook Service**: A C#/ASP.NET Core service backing Netbook's notes. It is deliberately polyglot — a different stack from the Node services — but stays inside the same identity system by validating the IAM-issued JWT against the shared signing secret, so auth is not duplicated.

### Data Persistence

- **Storage**: These apps store and access data via relational PostgreSQL databases, one per service.
- **Access and Migrations**: The Node services (IAM, Canteen) connect using the `pg` (node-postgres) library for connection pooling, with schemas versioned via `node-pg-migrate`. Netbook Service, being on .NET, uses Entity Framework Core with the Npgsql provider and EF Core migrations instead.

### Netbook: local-first editing and optimistic concurrency

Netbook makes a few choices that set it apart from Midden and Canteen. The full frontend design is written up in [offline-notes.md](offline-notes.md).

On the frontend, the notebook lives on a single public route that gates itself. Signed-out visitors see a splash; signed-in users see the notebook, both at `/`, with no route guard in front. This fits an app that is one page rather than a tree of protected routes.

Editing is local-first rather than request-per-action. Creates, edits, and deletes made offline are held in a state-based queue inside the TanStack Query cache, persisted to `localStorage`, and flushed oldest-first when connectivity returns.
Repeated offline edits to the same note collapse into a single write, so the queue never holds two operations for one note and there is no operation-replay ordering to get wrong. In-progress form text is saved on each keystroke, so a refresh or a post-deploy reload does not lose what was being typed.

On the backend, writes carry an optional optimistic-concurrency check. A `PUT` or `DELETE` may include the `updatedAt` value the client last saw; when it is present, the server rejects the write with `409` and returns the current row if the stored row is newer, and when it is absent the write is unconditional. The same endpoints therefore serve both the synced client and any caller that does not care about conflicts. The client turns a `409` into a visible "conflicted copy" instead of silently discarding the losing edit, keeping conflict resolution in the user's hands.

## Platform, Monitoring, and Automation

### Infrastructure and Networking

The full stack is hosted on a Linode running a self-managed Kubernetes cluster.

- **Ingress**: Managed by an Nginx ingress controller that routes traffic for the [midden.reedgaines.com](https://midden.reedgaines.com/), [canteen.reedgaines.com](https://canteen.reedgaines.com/), and [netbook.reedgaines.com](https://netbook.reedgaines.com/) subdomains. The controller also directs HTTP requests from the clients to separate ClusterIP services via path-based routing (e.g. `/iam`, `/canteen`, or `/netbook`). Each frontend's ingress owns its host and TLS certificate; a backend on the same host contributes only its API path rule.
- **SSL/TLS**: Automated via [cert-manager](https://github.com/cert-manager/cert-manager) using the [Let's Encrypt](https://letsencrypt.org/) production issuer.

### Observability and Telemetry

This stack implements a comprehensive Grafana Cloud-based monitoring solution.

- **Frontend Monitoring**: Handled via a Grafana Faro implementation. Disable adblocking software if you'd like to contribute to sending telemetry—it's much appreciated. No private information is collected, just generic usage data and frontend error monitoring.
- **Backend Monitoring**: Prometheus scrapes service health metrics and sends them to the dashboard.
- **Log Aggregation**: Loki stores logs from both the backend services and Faro telemetry for unified debugging.

### CI/CD and Disaster Recovery

- **CI/CD Pipeline**: Automated linting and unit test validation are triggered on push. Then, on a merge to master, applications are automatically packaged into Docker images, pushed to Docker Hub, and applied to the prod k3s cluster. This is all managed via GitHub Actions.
- **Disaster Recovery**: A Kubernetes `CronJob` resource automatically backs up databases on a nightly basis, storing backups in an S3-compatible bucket also hosted on Linode.


