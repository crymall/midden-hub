# Architecture

## Overview

Midden is an a directory app for my personal dev work, very loosely inspired by Chinese mega-apps such as WeChat and Alipay. It links to sub-apps and other one-off projects, and provides a handy all-in-one place for site administrators to manage user accounts. With that in mind, this repository, Midden Hub, contains multiple discrete frontends with shared functionality for UI, service routing, and authentication. Microservices for authentication and discrete app data are versioned in separate repositories, such as [iam-service](https://github.com/crymall/iam-service) and [canteen-service](https://github.com/crymall/canteen-service).

## Application Architecture

This monorepo uses NPM Workspaces to manage shared dependencies and configurations.

### Frontend Clients

- **Midden**: The primary portal built with React 19 and styled with [Tailwind CSS](https://tailwindcss.com/).
- **Canteen**: An app for storing, organizing, and sharing recipes.
- **Shared UI**: Both clients utilize shared pages and components for visual and functional consistency without duplication.

### Backend Microservices

- **IAM Service**: A Nodejs/Express service managing identity and access across all Midden-affiliated applications.
- **Canteen Service**: A service for the Canteen application, handling CRUD functionality for recipes, likes, lists, messages, and anything else related to Canteen.

### Data Persistence

- **Storage**: These apps store and access data via relational PostgreSQL databases.
- **Access and Migrations**: All microservices connect to databases using the `pg` (node-postgres) library for connection pooling. Database schemas and versioning are managed via `node-pg-migrate`.

## Platform, Monitoring, and Automation

### Infrastructure and Networking

The full stack is hosted on a Linode running a self-managed Kubernetes cluster.

- **Ingress**: Managed by an Nginx ingress controller that routes traffic for both the [midden.reedgaines.com](https://midden.reedgaines.com/) and [canteen.reedgaines.com](https://canteen.reedgaines.com/) subdomains. The controller also directs HTTP requests from the clients to separate ClusterIP services via path-based routing (e.g. `/iam` or `/canteen`).
- **SSL/TLS**: Automated via [cert-manager](https://github.com/cert-manager/cert-manager) using the [Let's Encrypt](https://letsencrypt.org/) production issuer.

### Observability and Telemetry

This stack implements a comprehensive Grafana Cloud-based monitoring solution.

- **Frontend Monitoring**: Handled via a Grafana Faro implementation. Disable adblocking software if you'd like to contribute to sending telemetry—it's much appreciated. No private information is collected, just generic usage data and frontend error monitoring.
- **Backend Monitoring**: Prometheus scrapes service health metrics and sends them to the dashboard.
- **Log Aggregation**: Loki stores logs from both the backend services and Faro telemetry for unified debugging.

### CI/CD and Disaster Recovery

- **CI/CD Pipeline**: Automated linting and unit test validation are triggered on push. Then, on a merge to master, applications are automatically packaged into Docker images, pushed to Docker Hub, and applied to the prod k3s cluster. This is all managed via GitHub Actions.
- **Disaster Recovery**: A Kubernetes `CronJob` resource automatically backs up databases on a nightly basis, storing backups in an S3-compatible bucket also hosted on Linode.


