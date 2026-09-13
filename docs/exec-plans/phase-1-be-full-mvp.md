# Phase 1 - BE full MVP

Status: point 1 complete; point 2 and point 3 complete; point 4 auth service and middleware complete and awaiting review on 2026-09-13.

## Goal

Build the full backend MVP for the generic FocusFlow domain in independently reviewable first-level points.

The phase intentionally starts with backend-only work. It should produce a complete generic backend contract, model boundaries, auth foundation, service layer, and PostgreSQL implementation before real frontend product UI work begins.

## Non-goals

- No full frontend product UI in this phase.
- No job-search-specific Specification model, API, storage behavior, or UI.
- No weakly typed public Specification CRUD endpoint.
- No Redis, queues, Kafka, Kubernetes, microservices, GraphQL, event sourcing, CQRS, or other infrastructure outside the agreed scope.
- No business logic in HTTP handlers.
- No PostgreSQL installed directly on the host.

## Assumptions

- The current Phase 0 repository foundation remains the base.
- OpenAPI remains contract-first and generated API code remains committed.
- Go commands run on the host Go toolchain; backend and PostgreSQL runtime use Docker Compose.
- Local PostgreSQL uses PostgreSQL 17 in Docker Compose.
- API, internal/core, and PostgreSQL storage models stay separate.
- Storage interfaces use internal models only.
- API code may depend on internal/core models through explicit mapping; internal/core code must not depend on API or PostgreSQL packages.
- PostgreSQL-specific row/input models live inside the PostgreSQL implementation unless a concrete need proves otherwise.
- Every collection endpoint uses cursor pagination from the first contract version.
- Events are recorded for mutations once service/storage behavior is implemented, but activity read UI/API remains outside this phase unless explicitly approved.

## Resolved user decisions for this phase

- Token renewal endpoint name: `refresh`.
- Token/session TTL: 2 hours.
- No separate long-lived refresh token in the BE full MVP; refresh renews only a currently valid token/session.
- Configured single-user ID is a UUID; service APIs use a project alias type for user IDs.
- API stubs use fixed UUID values.
- Event persistence is deferred until CRUD behavior is stable and is not part of the first BE full MVP points.

## Open questions requiring user input

No blocking questions for point 4. Token cookie name and production cookie policy are recorded in D-030.

## API contract changes

This phase expands `contracts/openapi.yaml` from health-only to the generic backend MVP.

Expected groups:

- public API:
  - `POST /v1/auth/login`;
  - `POST /v1/auth/logout`;
  - `GET /v1/auth/me`;
  - `POST /v1/auth/refresh`;
- user API:
  - Flow endpoints over root Focuses;
  - Focus CRUD and hierarchy endpoints;
  - Goal endpoints;
  - Goal-to-Focus link endpoints;
  - generic Specification infrastructure only if it can remain strongly typed at the public contract boundary;
  - health remains public.

Every collection response uses the agreed cursor pagination shape:

```json
{
  "items": [],
  "count": 0,
  "nextCursor": null,
  "hasMore": false
}
```

## Migration changes

This phase adds real application migrations under `backend/migrations/`.

Expected tables remain:

```text
focus_object
focus_goal
focus_goal_link
focus_specification
focus_event
```

Every migration must include both:

```sql
-- +goose Up
-- +goose Down
```

No deployed schema may be changed manually.

## Go implementation notes

Use the official Go context guidance for user identity propagation:

- pass `context.Context` explicitly as the first argument to request-aware functions;
- do not store context in structs;
- use context values only for request-scoped data crossing API boundaries;
- use private project-defined key types for context values, not string keys.

References:

- https://pkg.go.dev/context
- https://go.dev/blog/context-and-structs
- https://go.googlesource.com/wiki/+/3c9c9e1adea9cc62389ba8adab07986c00060fe8/CodeReviewComments.md

Converter/builder style:

- prefer explicit functions over reflection or generic mapping libraries;
- place conversion functions near the boundary they serve;
- use names that describe direction, for example `toCoreFocus`, `fromCoreFocus`, `scanFocusRow`, or equivalent package-local names;
- return errors for lossy or invalid conversions;
- keep packages meaningful; avoid catch-all `util`, `common`, or `types` packages.

## First-level implementation points

### 1. Backend models only, no logic

- [x] **Goal:** define the model shapes for API support, internal/core behavior, and PostgreSQL storage without implementing behavior.
- **Files/packages expected to change:** `backend/internal/model/`; API model package documentation under `backend/internal/api/model/`; PostgreSQL-local model files under `backend/internal/storage/postgres/`; model tests where useful for shape checks. `contracts/openapi.yaml` remains health-only until the API point.
- **Commands/checks:** `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`; `gofmt -w ...`; `go test ./...`; `go vet ./...`; `go tool staticcheck ./...`; `go build -o .tmp/check-backend/api.exe ./cmd/api`; `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.
- **Acceptance criteria:** internal aggregate models and PostgreSQL-local row models compile; dependency direction is correct; no API request/response model implementation yet; no validation, persistence, auth, status transition, hierarchy, or handler behavior is implemented in this point.

### 2. Converters/builders

- [x] **Goal:** add explicit boundary conversion functions between generated API models and internal/core models. PostgreSQL storage converters remain for the PostgreSQL implementation point.
- **Files/packages expected to change:** API mapping packages under `backend/internal/api/`; PostgreSQL mapping files under `backend/internal/storage/postgres/`; tests for conversions.
- **Commands/checks:** `gofmt -w internal/api`; `go test ./...`; `go vet ./...`; `go tool staticcheck ./...`; `go build -o .tmp/check-backend/api.exe ./cmd/api`; `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`; focused mapper tests; generated drift check when OpenAPI changes.
- **Acceptance criteria:** mappings are explicit; optional/null fields and enums are covered; no reflection/generic mapper library; internal/core code remains independent of API packages. PostgreSQL storage mapping is intentionally deferred until storage SQL shape is implemented.

### 3. Complete API methods as successful stubs

- [x] **Goal:** expose the full generic MVP API shape with successful mock responses only.
- **Files/packages expected to change:** `contracts/openapi.yaml`; generated API files; `backend/internal/api/` public/user API routing, handlers, middleware shell, response helpers, and tests.
- **Commands/checks:** `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`; generated drift check; `gofmt -w internal/api`; `go test ./...`; `go vet ./...`; `go tool staticcheck ./...`; `go build -o .tmp/check-backend/api.exe ./cmd/api`; `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`; HTTP handler tests for route grouping, auth-required behavior, pagination response shape, and mock success responses.
- **Acceptance criteria:** public and user API groups are separated; user API receives `userID` from middleware/context; handlers contain no business logic and no database access; all stubs return valid successful contract responses; every collection endpoint is cursor-paginated.

### 4. Auth service and middleware

- [x] **Goal:** implement real authentication boundaries for the one configured user while keeping provider replacement easy later.
- **Files/packages expected to change:** backend config; auth service package; token signer/verifier; public auth handlers; user middleware; tests; `.env.example`; README/status/decisions if config names change.
- **Commands/checks:** `gofmt -w internal/auth internal/config internal/api cmd/api`; `go test ./...`; `go vet ./...`; `go tool staticcheck ./...`; `go build -o .tmp/check-backend/api.exe ./cmd/api`; `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`; `npm run contract:lint`; generated drift check for Go and TypeScript OpenAPI outputs; focused auth tests for login, logout response behavior, me/session behavior, renewal, wrong credentials, malformed tokens, expired tokens, middleware context propagation, and secret redaction.
- **Acceptance criteria:** env config contains plaintext `APP_PASSWORD`; config loading converts it to an in-memory credential/hash representation without logging it; auth verifier abstraction can later be backed by DB/Google/etc.; tokens are signed and validated with env secret material; userID is propagated through request context with typed/private keys; invalid and expired tokens are handled predictably.

### 5. Service layer without database persistence

- [ ] **Goal:** add application services for every API use case while still using mock/in-memory storage behavior.
- **Files/packages expected to change:** `backend/internal/service/`; storage interface definitions; API handlers wired to services; tests; comments marking intended storage reads/writes.
- **Commands/checks:** `npm run check:backend`; service tests with fake storage; handler tests proving handlers delegate rather than implement logic.
- **Acceptance criteria:** services use internal models only; storage interfaces are use-case oriented; comments identify what each future storage call needs and why; business logic moves out of handlers; no PostgreSQL implementation is required in this point.

### 6. PostgreSQL storage implementation

- [ ] **Goal:** implement real PostgreSQL persistence behind the service storage interfaces.
- **Files/packages expected to change:** `backend/migrations/`; `backend/internal/storage/postgres/`; integration tests; Docker/Compose test scripts if needed; README/status updates.
- **Commands/checks:** `npm run check:migrations`; `npm run check:backend`; `npm run test:database:local`; backend Docker build/check after local HTTPS trust is healthy; SQL integration tests for CRUD, hierarchy, cycle prevention, subtree deletion, Goal links, cursor pagination, and event writes where implemented.
- **Acceptance criteria:** goose migrations create and roll back the schema; PostgreSQL implementation uses pgx; storage models stay local to PostgreSQL implementation; storage interfaces return internal models; service behavior works against disposable PostgreSQL; no production database is touched.

## Phase-level acceptance criteria

- [ ] OpenAPI contract covers the generic backend MVP and validates.
- [ ] Generated Go and TypeScript API outputs are committed and drift-checked.
- [ ] API, internal/core, and PostgreSQL storage models are separate.
- [ ] Public API and user API are separated.
- [ ] User API auth middleware validates token state and places userID into request context.
- [ ] Auth service supports configured single-user login, logout behavior, session/me, renewal, wrong credentials, invalid token, and expired token handling.
- [ ] Application services contain business logic; HTTP handlers do not.
- [ ] Storage interfaces use internal models only.
- [ ] PostgreSQL implementation is behind the storage interfaces and uses pgx.
- [ ] Goose migrations have Up and Down and pass disposable database validation.
- [ ] Every collection endpoint uses cursor pagination.
- [ ] Tests cover each implemented point.
- [ ] Backend checks and Docker build pass once local network trust issues are resolved.
- [ ] No frontend product UI, job-search Specification, or out-of-scope infrastructure is added.

## Rollback and recovery

- Each first-level point should be commit-sized and independently revertible.
- Keep OpenAPI changes and generated outputs together.
- Revert a point by reverting its source, generated code, and docs/status changes together.
- Never repair generated drift by hand-editing generated files.
- Database rollback uses goose Down only after reviewing data loss and compatibility.
- If Docker/npm registry access is blocked by local network or antivirus configuration, record the blocker and do not add repository certificate workarounds.

## Point 1 completion notes

- Kept `contracts/openapi.yaml` health-only. API request/response models will be designed with the API contract/stub point, not in backend model point 1.
- Added internal/core aggregate model definitions under `backend/internal/model/`; `Focus` can hold nested children, goals, and specifications for depth/include-style service responses.
- Added `FocusQuery` as an internal query shape for depth/include requirements without defining API parameters yet.
- Added PostgreSQL-local row model definitions under `backend/internal/storage/postgres/` with `db` tags and package comments forbidding leakage into services/API.
- Added API model package documentation under `backend/internal/api/model/` without request/response models yet.
- Documented that generic `Specification.Data` is infrastructure/storage-oriented and must be decoded into typed internal Specification variants before reaching the API/frontend.
- Added lightweight compile/tag tests for model shape checks.
- No converters, API stubs, auth service, middleware, service layer, migrations, SQL queries, or persistence logic were added in point 1.
- Validation run from `backend/`: `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`, `gofmt -w ...`, `go test ./...`, `go vet ./...`, `go tool staticcheck ./...`, `go build -o .tmp/check-backend/api.exe ./cmd/api`, and `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`.

## Point 2 and 3 completion notes

- Expanded `contracts/openapi.yaml` from health-only to the generic backend MVP API contract.
- Added public auth endpoints for login, logout, refresh, and current session shape.
- Added user API endpoints for root Flow listing/creation, Focus CRUD/hierarchy, Goal CRUD, and Goal-to-Focus links.
- Kept Specifications out of the public API contract until supported typed Specification variants are approved and implemented end-to-end.
- Added generated Go API code and synchronized generated TypeScript API types from the OpenAPI contract.
- Added explicit API-to-internal and internal-to-API converters for Focus, Goal, auth session, pagination, request bodies, includes, and nullable clear fields.
- Added separated public and user API handler files with deterministic mock responses only.
- Added a temporary user-context middleware shell using the fixed mock user ID; real token validation belongs to the next auth point.
- No service logic, auth verification, database access, migrations, PostgreSQL queries, or frontend UI work was added in this point.
- Validation run: `npm run contract:lint`; generated drift check for Go and TypeScript OpenAPI outputs; from `backend/`, `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml`, `gofmt -w internal/api`, `go test ./...`, `go vet ./...`, `go tool staticcheck ./...`, `go build -o .tmp/check-backend/api.exe ./cmd/api`, and `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`; from root, `npm --prefix frontend run typecheck` and `npm --prefix frontend test -- --run`.

## Point 4 completion notes

- Added an auth package with a configured-user verifier abstraction, in-memory Argon2id password credential, HMAC-signed session token, token verification, and refresh for currently valid sessions.
- Added `APP_USER_ID` to the required auth configuration so the single configured user has a stable UUID before a users table exists.
- Configuration loading converts `APP_PASSWORD` into an in-memory credential and validates `APP_TOKEN_SECRET` length without exposing secret values in errors.
- Replaced temporary mock user middleware with real cookie middleware that verifies `focusflow_session` and places the authenticated session/userID into request context.
- Login and refresh issue HttpOnly session cookies; logout expires the session cookie.
- CRUD endpoints still return deterministic mock data only. No service layer, database access, migrations, or storage behavior was added in this point.
- Validation run: `go test ./...`, `go vet ./...`, `go tool staticcheck ./...`, `go build -o .tmp/check-backend/api.exe ./cmd/api`, `go build -o .tmp/check-backend/hash-password.exe ./cmd/hash-password`, `npm run contract:lint`, Go and TypeScript generated drift checks, `npm --prefix frontend run typecheck`, `npm --prefix frontend test -- --run`, `docker compose -f docker-compose.local.yml config --quiet`, `docker compose -f docker-compose.test.yml config --quiet`, and `git diff --check`.
