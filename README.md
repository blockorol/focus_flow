# FocusFlow

FocusFlow is a personal hierarchical object/work system.

> Everything is a Focus.

A Focus can contain child Focuses. A root Focus is called a **Flow**. Domain-specific behavior is added later through strongly typed **Specifications**.

## Current phase

The repository is in Phase 0: repository foundation. Phase 0 creates the monorepo structure, toolchain, OpenAPI bootstrap, Docker backend package, local Compose topology, migration tooling, and CI checks. It does not implement the core Focus/Goal database schema or Phase 1 API behavior.

Authoritative project documents:

- [SCOPE.md](./SCOPE.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)
- [docs/STATUS.md](./docs/STATUS.md)
- [docs/DECISIONS.md](./docs/DECISIONS.md)
- [docs/exec-plans/phase-0-foundation.md](./docs/exec-plans/phase-0-foundation.md)
- [AGENTS.md](./AGENTS.md)

## Stack

Backend:

- Go 1.26.8
- REST
- contract-first OpenAPI
- oapi-codegen
- PostgreSQL 17
- pgx
- goose
- Docker

Frontend:

- Node.js 22.14.x
- npm 10.9.x
- Next.js
- React
- TypeScript
- Tailwind CSS
- generated OpenAPI types/client boundary

Hosting:

- frontend: Vercel
- backend: Railway, built from `backend/Dockerfile`
- database: Railway PostgreSQL

## Repository layout

```text
.
|-- AGENTS.md
|-- SCOPE.md
|-- README.md
|-- contracts/
|   `-- openapi.yaml
|-- backend/
|   |-- cmd/
|   |-- internal/
|   |-- migrations/
|   |-- scripts/
|   `-- Dockerfile
|-- frontend/
|-- docs/
|-- docker-compose.local.yml
`-- docker-compose.test.yml
```

The frontend and backend are independently deployable even though they live in one monorepo.

## Requirements

Install on the host:

- Go 1.26.8
- Node.js 22.14.x with npm 10.9.x
- Docker Desktop with Docker Compose v2

Do not install PostgreSQL directly on the host for this project. Local PostgreSQL runs in Docker Compose.

If dependency downloads fail because HTTPS traffic is intercepted by antivirus or a corporate proxy, fix the machine/network configuration. Do not add custom root certificates, npm `cafile` overrides, disabled TLS verification, or Docker certificate injection to this repository.

## Install dependencies

Root tooling:

```bash
npm ci
```

Frontend app:

```bash
npm --prefix frontend ci
```

Go modules:

```bash
npm run go -- mod download
npm run go -- mod verify
```

## OpenAPI and generated code

The contract source of truth is:

```text
contracts/openapi.yaml
```

Generate committed backend and frontend API artifacts:

```bash
npm run generate
```

Validate the contract:

```bash
npm run contract:lint
```

Check generated-code drift:

```bash
npm run check:generated
```

Generated outputs must not be edited by hand.

## Local development topology

Standard local development uses:

```text
Next.js on the host
http://localhost:3000
        |
        v
Go backend in Docker Compose
http://localhost:8080
        |
        v
PostgreSQL 17 in the same Docker Compose project
postgres:5432
```

Start backend and PostgreSQL:

```bash
npm run backend:up
```

Stop them while preserving the development database volume:

```bash
npm run backend:down
```

Run the frontend directly with Node.js:

```bash
npm --prefix frontend run dev
```

The default Compose configuration allows the frontend origin `http://localhost:3000`, including credentialed browser requests. Standard local development should not require manual CORS changes.

## Local environment files

Copy examples when local overrides are needed:

```text
backend/.env.example -> backend/.env.local
frontend/.env.example -> frontend/.env.local
```

`backend/.env.local` is optional for the Phase 0 Compose default because `docker-compose.local.yml` provides local database and CORS defaults. Use it for local secrets and overrides such as:

```dotenv
APP_USERNAME=local
APP_PASSWORD_HASH=<argon2id hash>
APP_TOKEN_SECRET=<local random secret>
```

The local Compose default database URL is internal to Docker Compose:

```text
postgres://focusflow:focusflow-local@postgres:5432/focusflow?sslmode=disable
```

Do not commit `.env.local` files.

Frontend public configuration:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Do not put backend secrets into `NEXT_PUBLIC_*` variables.

## Password hash helper

Build or start the backend image first, then run:

```bash
npm run hash-password
```

The helper reads the password from stdin and prints an encoded Argon2id hash. Never pass plaintext passwords as command-line arguments and never commit plaintext passwords.

## Migrations

Application migrations live in:

```text
backend/migrations/
```

Every SQL migration must contain both markers:

```sql
-- +goose Up
-- +goose Down
```

Phase 0 intentionally ships no application SQL migration. It only adds the migration directory, wrapper, checks, and disposable test fixtures.

Run local development migrations through the backend container:

```bash
npm run migrate:up
npm run migrate:status
npm run migrate:down
```

The runtime image installs a migration wrapper at:

```text
/app/bin/migrate
```

Supported commands are `up`, `status`, and `down`.

## Checks

Contract and generation:

```bash
npm run contract:lint
npm run generate
npm run check:generated
```

Backend checks using host Go:

```bash
npm run check:backend
```

Frontend checks:

```bash
npm run check:frontend
```

Migration structure checks:

```bash
npm run check:migrations
```

Backend Docker and Compose checks:

```bash
npm run check:docker
```

Disposable local database migration fixture check:

```bash
npm run test:database:local
```

This command uses `docker-compose.test.yml`, a separate Compose project, and disposable PostgreSQL data. It must never target development or production data.

## Production deployment

### Frontend: Vercel

Create a Vercel project with root directory:

```text
frontend
```

Configure:

```text
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>
```

No backend secrets belong in Vercel public variables.

### Backend: Railway

Create a Railway service from this monorepo with root directory:

```text
/backend
```

Railway builds from:

```text
backend/Dockerfile
```

Configure health check path:

```text
/v1/health
```

### PostgreSQL: Railway

Provision Railway PostgreSQL in the same project/environment as the backend service.

Configure the backend service database variable as a Railway reference variable:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Use the actual Railway PostgreSQL service name if it differs from `Postgres`.

Manually configure application-owned backend variables:

```text
APP_USERNAME
APP_PASSWORD_HASH
APP_TOKEN_SECRET
APP_ENV
CORS_ALLOWED_ORIGINS
```

Future authentication work may add cookie-related variables. Document them here when they are introduced.

## Production migrations

Configure Railway pre-deploy command:

```text
/app/bin/migrate up
```

The command uses the backend service `DATABASE_URL`. A migration failure must block deployment. Application rollback and database rollback are separate operational decisions; do not automatically run `goose down` during application rollback.

## CI/CD

GitHub Actions is the CI source of truth. The workflow runs contract, backend, frontend, database, Docker, and aggregate `CI` jobs on pull requests and pushes to `main`.

Railway production deployment should wait for the successful aggregate GitHub Actions check before deploying. Vercel production promotion should also use commits that passed CI.

No production deployment tokens or deployment jobs are added in Phase 0.

## Authentication deployment note

The planned browser architecture uses an HttpOnly auth cookie while frontend and backend are separate origins. Production CORS must explicitly allow the Vercel frontend origin and allow credentialed requests.

If Vercel and Railway default domains cause browser third-party-cookie restrictions, use custom sibling domains, for example:

```text
app.example.com
api.example.com
```

## Specification rule

Specifications are strongly typed at the OpenAPI boundary. Storage may use JSONB, but supported Specification variants are represented by explicit OpenAPI schemas and generated backend/frontend types.

A new Specification type is implemented as one coordinated monorepo change:

```text
OpenAPI + backend + frontend + tests
```

Do not expose a weakly typed public Specification CRUD API as a placeholder.
