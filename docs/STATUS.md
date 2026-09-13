# FocusFlow - Status

## Current phase

Planning reset in progress. Phase 0 foundation work remains in the working tree, but execution planning has moved to the new BE full MVP phase as of 2026-09-08.

## Completed

- Read the source-of-truth documents and inspected the repository before starting Phase 0 work.
- Created and received approval for the 11-step foundation plan.
- Recorded the repository language rule: communicate with the user in Russian; write repository content in English.
- Enabled version control for workflow documents and execution plans.
- Added deterministic repository line-ending rules.
- Added root npm tooling, lockfile, Node version metadata, npm defaults, and Make aliases.
- Added the bootstrap OpenAPI contract with only `GET /v1/health`.
- Added OpenAPI validation and Go/TypeScript generation commands.
- Generated and committed-ready backend and frontend API artifacts.
- Added the Go backend module, runtime configuration, PostgreSQL connection bootstrap, health HTTP adapter, local CORS behavior, graceful server startup/shutdown tests, and stdin-based Argon2id password hash helper.
- Added the Next.js/TypeScript frontend foundation, generated API type boundary, API client helper, placeholder page, and frontend tests.
- Added `backend/Dockerfile`, backend migration wrapper, migration directory documentation, local/test Compose files, migration validation, and disposable migration fixtures.
- Added GitHub Actions CI structure for contract, backend, frontend, database, Docker, and aggregate checks.
- Updated backend build checks so local binaries are written only to ignored temporary output paths, not source directories.
- Updated README with the current local, migration, CI, Railway, and Vercel workflows.

## Decisions recorded

- D-021: Phase 0 approval and initial foundation defaults.
- D-022: Russian user communication; English repository content.
- D-023: disposable local test PostgreSQL in Docker.
- D-024: corrected local development topology: frontend on host Node.js, backend and PostgreSQL 17 in Docker Compose.
- D-025: no repository certificate trust workaround.
- D-026: host Go for Go tooling; Docker Compose for backend/PostgreSQL runtime; Docker image version tags without digest pins.
- D-027: old phase roadmap superseded; new active phase is BE full MVP.
- D-028: configured-user password is read from `APP_PASSWORD` and converted to an in-memory credential/hash representation by backend auth setup.
- D-030: auth configuration uses `APP_USER_ID`; the API session cookie is `focusflow_session`; cookie security is derived from `APP_ENV`.
- D-031: API missing-resource and hierarchy-conflict responses.
- D-032: frontend mock-first sequence and UI style.

## Validation run locally

Passed:

- `go version` reports `go1.26.8 windows/amd64`.
- `node --version` reports `v22.14.0`.
- `npm --version` reports `10.9.2`.
- `docker compose version` reports Docker Compose v2.40.3.
- `npm run contract:lint`.
- `npm run generate`.
- `scripts/check-generated.mjs` runs generation directly on Windows; in the current uncommitted tree, `npm run check:generated` correctly fails because generated files are still untracked.
- `go mod verify`.
- `go fmt ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go test ./...`.
- `go build -o <ignored-temp-dir>/api ./cmd/api`.
- `go build -o <ignored-temp-dir>/hash-password ./cmd/hash-password`.
- `npm run check:backend`.
- `npm run check:frontend`.
- `npm run check:migrations`.
- `docker compose -f docker-compose.local.yml config --quiet`.
- `docker compose -f docker-compose.test.yml config --quiet`.
- `git diff --check`.

Blocked locally:

- The current shell has `npm_config_offline=true`; clean npm install checks require either removing that environment variable for the command/session or passing `--offline=false` with working registry access.
- `npm ci --ignore-scripts --offline=false` was attempted but did not complete reliably against the registry in this environment.
- `npm run check:docker` currently fails while Docker build downloads Go modules because the container receives a `proxy.golang.org` certificate issued by `Avast Web/Mail Shield Root`, causing `x509: certificate signed by unknown authority`.
- `npm --prefix frontend install --package-lock-only --ignore-scripts` currently cannot complete because npm cannot reach `registry.npmjs.org` for an optional Tailwind package (`ENETUNREACH`).
- Per D-025, the repository must not add custom trusted certificates or disable TLS verification to work around trust failures. The machine/network HTTPS and registry access path must be fixed, then Docker and npm lockfile validation must be rerun.

## Pending / known limitations

- Full Phase 0 completion is withheld until Docker image build and disposable Compose database checks pass on a clean HTTPS path.
- Hosted GitHub Actions has not been run or verified for this revision.
- Railway and Vercel project settings have not been configured or verified.
- The frontend package lock was adjusted after removing an accidental root file dependency, but the lockfile should be regenerated/validated with npm after TLS interception is fixed.
- BE full MVP point 1 backend models are complete.
- BE full MVP point 2 and point 3 API contract/stub work is complete in the working tree.
- BE full MVP point 4 auth service and middleware work is complete in the working tree.
- BE full MVP point 5 service layer without database persistence is complete in the working tree.
- BE full MVP point 6 PostgreSQL storage implementation with goose migrations is complete in the working tree.
- Phase 2 frontend/backend/integration plan is created in `docs/exec-plans/phase-2-frontend-backend-integration.md`.
- Phase 2 step 1.1 frontend design foundation is complete in the working tree.

## Next action

Phase 2 step 1.1 frontend design foundation is complete and awaiting review/commit checkpoint. Next planned point is Phase 2 step 1.2: API client boundary and mock mode. Do not start implementation until the user approves continuing.

## BE full MVP point 1 result

Completed:

- `contracts/openapi.yaml` kept health-only; API request/response models are deferred to the API contract/stub point.
- Internal/core aggregate backend models in `backend/internal/model/`.
- API model package documentation in `backend/internal/api/model/`, without API request/response models yet.
- PostgreSQL-local row models with `db` tags and boundary comments in `backend/internal/storage/postgres/`.
- Model/tag shape tests.

Validation:

- `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`.
- `go test ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go build -o .tmp/check-backend/api.exe ./cmd/api`.
- `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.
Not done in point 1:

- no converters/builders;
- no API stubs;
- no auth service or middleware;
- no service layer;
- no migrations or PostgreSQL queries;
- no frontend product work.

## BE full MVP point 2 and point 3 result

Completed:

- Expanded the OpenAPI contract to the generic backend MVP API surface.
- Generated Go API code and synchronized generated TypeScript API types from the contract.
- Added API boundary model aliases and explicit converters between API and internal models.
- Added public API and user API handler separation.
- Added deterministic mock responses for all current API endpoints.
- Added temporary userID context middleware shell for user API stubs.
- Kept typed Specifications out of the API until Specification variants are approved and implemented end-to-end.

Validation:

- `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`.
- Generated drift check by regenerating and comparing `backend/internal/api/generated/openapi.gen.go` and `frontend/src/api/generated/schema.d.ts`.
- `gofmt -w internal/api`.
- `go test ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go build -o .tmp/check-backend/api.exe ./cmd/api`.
- `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.
- `npm run contract:lint`.
- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend test -- --run`.

Not done in this point:

- no real auth verification;
- no service layer;
- no storage interfaces or PostgreSQL implementation;
- no migrations;
- no frontend UI/client work.

## BE full MVP point 4 result

Completed:

- Added configured single-user authentication behind a verifier abstraction.
- Added in-memory password credential conversion from `APP_PASSWORD`.
- Added HMAC-signed session tokens with 2-hour expiration.
- Added real cookie middleware for protected API routes.
- Added login, logout, refresh, and me behavior over the `focusflow_session` HttpOnly cookie.
- Added `APP_USER_ID` local/test/prod documentation.


Validation:

- `go test ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go build -o .tmp/check-backend/api.exe ./cmd/api`.
- `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.
- `npm run contract:lint`.
- Generated drift check by regenerating and comparing `backend/internal/api/generated/openapi.gen.go` and `frontend/src/api/generated/schema.d.ts`.
- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend test -- --run`.
- `docker compose -f docker-compose.local.yml config --quiet`.
- `docker compose -f docker-compose.test.yml config --quiet`.
- `git diff --check`.

Not done in this point:

- no server-side token revocation persistence;
- no service layer;
- no storage interfaces or PostgreSQL implementation;
- no migrations;
- no frontend UI/client work.

## BE full MVP point 5 result

Completed:

- Added Focus and Goal storage interfaces using internal models only.
- Added application services for Flow, Focus, Goal, and Goal-to-Focus link use cases.
- Added future PostgreSQL read/write comments to storage interface methods.
- Added in-memory fake storage for current local behavior before durable persistence.
- Wired API user handlers through services.
- Removed API-owned mock data; temporary state now lives behind the storage boundary.

Validation:

- `gofmt -w internal/service internal/storage internal/api cmd/api`.
- `go test ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go build -o .tmp/check-backend/api.exe ./cmd/api`.
- `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.

Not done in this point:

- no PostgreSQL repository implementation;
- no SQL queries;
- no migrations;
- no durable persistence;
- no frontend UI/client work.

## BE full MVP point 6 result

Completed:

- Added `backend/migrations/000001_initial_schema.sql` with goose Up and Down sections.
- Added PostgreSQL tables for Focus, Goal, Goal links, generic Specification persistence infrastructure, and mutation Events.
- Added pgx-based PostgreSQL storage behind the Focus and Goal storage interfaces.
- Kept PostgreSQL row models and mappers local to the PostgreSQL implementation.
- Wired the backend API service setup to the PostgreSQL store.
- Updated disposable database test tooling to run application migrations and storage integration tests through Docker Compose.
- Added integration coverage for CRUD persistence, hierarchy loading, cycle prevention, subtree deletion, Goal links/progress, cursor pagination, event writes, and migration rollback/reapply validation.

Validation:

- `go test ./...` from `backend/`.
- `npm run check:migrations` from repository root.
- `npm run test:database:local` from repository root with disposable Docker PostgreSQL.

Known follow-up:

- Refine the public API contract so `POST /v1/focuses` can return a clean not-found response when `parentId` does not exist.
## Phase 2 step 1.1 result

Completed:

- Added frontend functional design tokens.
- Added shared UI primitives for buttons, form controls, cards, badges, and reusable state blocks.
- Updated the home page to preview the design foundation without product data flow.
- Added UI primitive smoke tests.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.

Not done in this step:

- no API client mock mode;
- no auth UI;
- no app shell routing;
- no Flow, Focus, or Goal product behavior.
