# FocusFlow

FocusFlow is a personal hierarchical object/work system.

> Everything is a Focus.

A Focus can contain child Focuses. A root Focus is called a **Flow**. Domain-specific behavior is added through strongly typed **Specifications**.

```text
Job Search
├── Company A
│   ├── HR Interview
│   └── Technical Interview
└── Company B
```

The core deliberately stays small while Specifications add typed domain behavior later.

## Current state

The project is planned in phases. See:

- [`SCOPE.md`](./SCOPE.md) — product/domain scope.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — architecture.
- [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) — phase workflow.
- [`docs/STATUS.md`](./docs/STATUS.md) — current checkpoint.
- [`AGENTS.md`](./AGENTS.md) — Codex operating instructions.

## Planned stack

### Backend

- Go
- REST
- PostgreSQL
- pgx
- goose
- OpenAPI / oapi-codegen
- Docker

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- generated OpenAPI client/types

### Hosting

- frontend: Vercel
- backend: Railway
- PostgreSQL: Railway

## Repository layout

Target layout:

```text
.
├── AGENTS.md
├── SCOPE.md
├── README.md
├── contracts/
│   └── openapi.yaml
├── backend/
│   ├── cmd/
│   ├── internal/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
├── docs/
└── docker-compose.local.yml
```

Frontend and backend are independently deployable even though they live in one monorepo.

---

# Local development

## Topology

The developer does **not** run PostgreSQL locally.

```text
Next.js local process
http://localhost:3000
        |
        v
Go backend in Docker
http://localhost:8080
        |
        v
Railway PostgreSQL public connection
```

The frontend runs directly with Node.js.

The backend runs through:

```bash
docker compose -f docker-compose.local.yml up --build
```

The local Compose file must not contain a PostgreSQL service.

## Local database connection

Railway PostgreSQL is private by default.

For local development, enable Public Access/TCP Proxy for the Railway PostgreSQL service and use the external connection string exposed by Railway as `DATABASE_PUBLIC_URL`.

Copy that value into the backend local environment as the application's `DATABASE_URL`.

Example local file:

```text
backend/.env.local
```

Conceptual values:

```dotenv
DATABASE_URL=<Railway DATABASE_PUBLIC_URL>
APP_USERNAME=<local username>
APP_PASSWORD_HASH=<argon2id hash>
APP_TOKEN_SECRET=<local random secret>
APP_ENV=local
```

Do not commit this file.

Using the public Railway database endpoint can incur network egress charges.

## Local CORS

Standard local development uses:

```text
frontend: http://localhost:3000
backend:  http://localhost:8080
```

`docker-compose.local.yml` should configure the backend so `http://localhost:3000` is allowed automatically.

The developer should not need to manually change CORS settings for the normal local topology.

Do not use wildcard CORS with credentialed authentication.

## Frontend local environment

Expected public frontend variable:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The exact filename is chosen by the frontend implementation, for example:

```text
frontend/.env.local
```

Do not commit secrets into `NEXT_PUBLIC_*` variables.

## Password hash

The repository provides a helper:

```bash
make hash-password
```

It reads the password from stdin and prints an Argon2id hash.

Use the result as:

```text
APP_PASSWORD_HASH
```

Never store the plaintext password in Git.

## Local migrations

The developer does not run a local database, but schema changes are still applied only through goose.

Against the configured development Railway database:

```bash
make migrate-up
make migrate-status
```

Rollback when explicitly needed:

```bash
make migrate-down
```

The exact Make targets are implemented in Phase 0/1.

Be deliberate when running migration commands because the configured database is remote.

Use a non-production Railway environment/database for development.

---

# Environment variables

## Backend application variables — set manually

These are application-owned and must be configured manually in Railway:

```text
APP_USERNAME
APP_PASSWORD_HASH
APP_TOKEN_SECRET
CORS_ALLOWED_ORIGINS
APP_ENV
```

Potential cookie configuration may also be explicit depending on the Phase 1 auth implementation, for example:

```text
COOKIE_SECURE
COOKIE_SAME_SITE
```

The exact set must be documented when auth is implemented.

## Backend database variable — Railway reference

Do not paste production PostgreSQL credentials into the backend service.

Configure the backend Railway service variable:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

where `Postgres` is the actual Railway PostgreSQL service name.

Railway resolves the referenced database URL and keeps it in sync with the database service.

PostgreSQL itself exposes variables including:

```text
PGHOST
PGPORT
PGUSER
PGPASSWORD
PGDATABASE
DATABASE_URL
```

The application should normally need only `DATABASE_URL`.

## Railway-provided variables

Railway provides platform variables such as:

```text
RAILWAY_PUBLIC_DOMAIN
RAILWAY_PRIVATE_DOMAIN
RAILWAY_PROJECT_NAME
RAILWAY_ENVIRONMENT_NAME
RAILWAY_SERVICE_NAME
```

Do not manually create copies unless the application has a concrete use for them.

## Local-only variables

Local backend configuration uses an external database URL, normally copied from Railway's:

```text
DATABASE_PUBLIC_URL
```

into local:

```text
DATABASE_URL
```

Do not configure production backend with `DATABASE_PUBLIC_URL`; production should use the private `DATABASE_URL` reference.

---

# Production deployment

## Frontend — Vercel

Create a Vercel project whose root directory is:

```text
frontend
```

Configure the production API URL, for example:

```text
NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>
```

No backend secrets belong in Vercel public variables.

The exact Vercel environment variable list must stay documented here as frontend configuration evolves.

## Backend — Railway

Create a Railway service from the monorepo.

Set the service root directory to:

```text
/backend
```

Railway builds the service from:

```text
backend/Dockerfile
```

The repository does not use Docker Compose as the Railway production deployment unit.

Create/generate a public backend domain in Railway networking.

## PostgreSQL — Railway

Provision PostgreSQL in the same Railway project/environment.

In the backend service, add a reference variable:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Use the actual database service name if it differs from `Postgres`.

This production connection uses Railway private networking.

---

# Production migrations

All database migrations are goose migrations committed in:

```text
backend/migrations/
```

Normal SQL migrations contain both:

```sql
-- +goose Up
...

-- +goose Down
...
```

Configure a Railway **pre-deploy command** that runs:

```text
goose up
```

using the production `DATABASE_URL` and the repository migration directory.

The exact command depends on the final runtime image layout and is documented here when Phase 0 creates the Dockerfile.

The Docker runtime image must therefore contain:

- the goose executable or project migration runner;
- migration files.

If the pre-deploy migration command fails, the deployment must not continue.

Application rollback and database rollback are separate decisions. Do not automatically execute `goose down` during application rollback.

---

# CI/CD

GitHub Actions is the CI source of truth.

CI should run:

## Contract

- OpenAPI validation
- Go generation
- TypeScript generation
- generated-code drift check

## Backend

- format
- lint/static analysis
- `go vet`
- tests
- integration tests
- build
- Docker image build
- goose migration validation

## Frontend

- install from lockfile
- lint
- typecheck
- tests
- production build

Persistence integration tests should use a disposable PostgreSQL service in CI.

They must not use the developer or production Railway database.

Railway production deployment should wait for successful GitHub CI.

---

# Authentication deployment note

The initial browser architecture uses an HttpOnly auth cookie while frontend and backend are separate origins.

Production CORS must explicitly allow the Vercel frontend origin and allow credentialed requests.

If Vercel and Railway default domains cause browser third-party-cookie restrictions, use custom sibling domains, for example:

```text
app.example.com
api.example.com
```

rather than proxying the backend through Vercel.

---

# Specifications and the API contract

Specifications are strongly typed.

Storage uses JSONB, but the OpenAPI contract does not expose arbitrary JSON for supported Specification types.

A new type is implemented as one coordinated monorepo change:

```text
OpenAPI
  + backend
  + frontend
  + tests
```

This intentionally favors correctness over unknown-extension compatibility.

---

# Development workflow with Codex

Codex instructions live in `AGENTS.md`.

The key workflow is:

1. work one phase at a time;
2. re-read repository source-of-truth docs before each phase;
3. create a detailed small-step phase plan;
4. discuss material questions with the user;
5. get phase approval;
6. implement step by step;
7. validate each step;
8. persist decisions/status in repository docs;
9. re-read docs before the next phase.

This prevents long-running implementation from depending on conversational memory.
