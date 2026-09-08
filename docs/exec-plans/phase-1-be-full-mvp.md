# Phase 1 - BE full MVP

Status: draft, awaiting user approval. Do not start implementation until approved.

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

## Open questions requiring user input

1. Exact auth endpoint names and token lifecycle names: `login`, `logout`, `me`, and `reauth` versus `refresh`.
2. Token shape and lifetime defaults: access-token TTL, refresh-token TTL if refresh/reauth uses a second token, and whether renewal rotates tokens.
3. Configured single-user identity shape: whether the env-configured user has a stable UUID from env or the backend derives a deterministic single-user ID.
4. Whether public successful stubs should use fixed example UUIDs or generated UUIDv7 values.
5. Whether Phase 1 should include event writes for all mutations immediately or defer event persistence until after core CRUD behavior is stable within the same phase.

## API contract changes

This phase expands `contracts/openapi.yaml` from health-only to the generic backend MVP.

Expected groups:

- public API:
  - `POST /v1/auth/login`;
  - `POST /v1/auth/logout`;
  - `GET /v1/auth/me`;
  - token renewal endpoint, exact name pending user decision.
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

- [ ] **Goal:** define the model shapes for API support, internal/core behavior, and PostgreSQL storage without implementing behavior.
- **Files/packages expected to change:** `contracts/openapi.yaml`; generated API files; `backend/internal/model/` or similarly named internal model packages; PostgreSQL-local model files under `backend/internal/storage/postgres/`; model tests where useful for zero-value/compile-time shape checks.
- **Commands/checks:** `npm run contract:lint`; `npm run generate`; `npm run check:generated` after generated files are tracked; `npm run check:backend`.
- **Acceptance criteria:** models compile; dependency direction is correct; no validation, persistence, auth, status transition, hierarchy, or handler behavior is implemented in this point; API/core/storage models are visibly separate.

### 2. Converters/builders

- [ ] **Goal:** add explicit boundary conversion functions between generated API models, internal/core models, and PostgreSQL-local storage models.
- **Files/packages expected to change:** API mapping packages under `backend/internal/api/`; PostgreSQL mapping files under `backend/internal/storage/postgres/`; tests for conversions.
- **Commands/checks:** `npm run check:backend`; focused mapper tests; generated drift check when OpenAPI changes.
- **Acceptance criteria:** mappings are explicit; failing conversions return errors; optional/null fields and enums are covered; no reflection/generic mapper library; internal/core code remains independent of API and PostgreSQL packages.

### 3. Complete API methods as successful stubs

- [ ] **Goal:** expose the full generic MVP API shape with successful mock responses only.
- **Files/packages expected to change:** `contracts/openapi.yaml`; generated API files; `backend/internal/api/` public/user API routing, handlers, middleware shell, response helpers, and tests.
- **Commands/checks:** `npm run contract:lint`; `npm run generate`; `npm run check:generated`; `npm run check:backend`; HTTP handler tests for route grouping, auth-required behavior, pagination response shape, and mock success responses.
- **Acceptance criteria:** public and user API groups are separated; user API receives `userID` from middleware/context; handlers contain no business logic and no database access; all stubs return valid successful contract responses; every collection endpoint is cursor-paginated.

### 4. Auth service and middleware

- [ ] **Goal:** implement real authentication boundaries for the one configured user while keeping provider replacement easy later.
- **Files/packages expected to change:** backend config; auth service package; token signer/verifier; public auth handlers; user middleware; tests; `.env.example`; README/status/decisions if config names change.
- **Commands/checks:** `npm run check:backend`; focused auth tests for login, logout response behavior, me/session behavior, renewal, wrong credentials, malformed tokens, expired tokens, middleware context propagation, and secret redaction.
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
