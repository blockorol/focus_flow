# Phase 0 Ã¢â‚¬â€ Repository foundation

Status: approved on 2026-09-05; implementation in progress. All repository content is English; user communication is Russian.

Clarification approved on 2026-09-05 (D-024): PostgreSQL must run in Docker, not be installed directly on the host. Standard local Compose now contains backend and PostgreSQL 17 with a development volume. A separate test Compose project provides disposable PostgreSQL; CI uses the same major. Railway remains production-only for this phase. Local verification no longer depends on remote credentials. This correction changes development topology, not the application schema.

## Goal

Create a reproducible monorepo foundation: committed OpenAPI outputs, a minimal Go HTTP server, a Next.js/TypeScript scaffold, backend and PostgreSQL Docker development, goose tooling, CI, and accurate setup/deployment instructions. Each numbered step below is a separate review checkpoint.

Approval of this plan authorizes Phase 0 only. It does not authorize a production deployment or starting Phase 1.

## Repository inspection

Inspected on 2026-09-05 after reading `AGENTS.md`, `SCOPE.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/STATUS.md`, and `docs/DECISIONS.md`. Also read the README, Compose stub, `.gitignore`, and execution-plan README.

- Branch: `main`, tracking `origin/main`; HEAD: `7c6ce07`. Tracked working tree was clean before planning.
- Remote: `https://github.com/blockorol/focus_flow`; proposed Go module: `github.com/blockorol/focus_flow/backend`.
- Tracked files are documentation, license, `.gitignore`, and `docker-compose.local.yml`. No backend, frontend, contract, dependency manifests, migrations, generated files, or CI exist.
- Compose already contains only a backend service, with build context `./backend`, environment file `backend/.env.local`, port 8080, and automatic localhost CORS/cookie defaults. Its referenced backend does not exist yet.
- `docs/STATUS.md` exists but is empty. `.gitignore` explicitly excludes `AGENTS.md`, `docs/STATUS.md`, and `docs/exec-plans/`. This plan is consequently a local ignored file until the tracking decision below is resolved.
- Host tools report Go 1.19.4, Node 22.14.0, npm 10.9.2, Docker 29.1.2, and Compose 2.40.3. Make is available. Docker daemon readiness, cloud credentials, database connectivity, and hosted project settings have not been tested.
- Existing README commands are aspirational; they are not evidence of implemented functionality.

## Non-goals

- No Focus, Flow, Goal, event, hierarchy, pagination implementation, or application database tables. Preserve the five agreed tables and all existing domain decisions for Phase 1.
- No login/session endpoints, cookie issuance, authorization, or generic product UI. The password hashing utility is the only auth-related implementation proposed here.
- No public Specification schema/API until a concrete typed variant is approved in its phase. No job-search fields, arbitrary JSON payload contract, or placeholder Specification variant.
- No host-installed PostgreSQL, frontend container, production Compose file, automatic application-start migrations, cloud provisioning, or production deployment.
- No Redis, queues, Kafka, Kubernetes, microservices, GraphQL, event sourcing, or other additional infrastructure.
- No Phase 7 observability project; only the basic startup/error messages needed to operate the scaffold.

## Assumptions and proposed defaults

- Existing architecture and persistence decisions remain authoritative. Stop and discuss any discovered need to alter them or an approved public contract.
- Use **npm**, with independent root tooling and frontend `package.json`/`package-lock.json` files. Avoid a JavaScript workspace requirement so Vercel can install/build from `frontend/` alone. Root tooling owns contract validation and generation; frontend owns its runtime dependencies.
- Use Next.js App Router, TypeScript strict mode, React, Tailwind CSS, ESLint, and Vitest. The initial page is a minimal FocusFlow placeholder; test infrastructure exercises the API boundary, not product behavior.
- Select exact supported tool releases during step 2 and record them in manifests, lockfiles, and Docker/CI configuration. No floating `latest` versions in repeatable commands. Use a supported Go release meeting the chosen generators' requirements, and a supported Node LTS release compatible with Next.js and Vercel.
- Host Go 1.19 is not the project baseline. Provide a pinned Go tooling Docker target for local checks/generation; native Go is an optional alternative with the documented matching version. Do not modify machine-wide tool installations as part of implementation.
- Use root npm scripts with small Node scripts where shell portability requires them. A thin Makefile may alias the same commands, including the README's `make hash-password` and migration commands; PowerShell users can use npm directly.
- Backend build context remains `backend/`. Builds consume committed generated Go source and do not need `contracts/` outside that context. Frontend production builds likewise consume committed TypeScript output without root tooling.
- Full configuration/auth behavior remains Phase 1 work. Phase 0 implements only the environment loading, validation, database startup connection, and CORS needed to exercise the foundation.

## Open questions and approval decisions

1. **Workflow document tracking:** approved; remove the ignore rules for `AGENTS.md`, `docs/STATUS.md`, and `docs/exec-plans/`. Keep `CODEX_FIRST_PROMPT.md` ignored.
2. **Bootstrap contract and configuration:** approved. Startup requires a successful bounded database ping; the health endpoint is public and reports process liveness only; auth variables are reserved/documented but not required or used until Phase 1. No domain routes exist during this interval.
3. **Local database verification:** resolved by D-024. Use Docker PostgreSQL 17 with documented development defaults and isolated disposable test data. No Railway credentials are required for Phase 0 acceptance.

Exact dependency patch pins and routine file naming are implementation decisions, not additional approval questions. Actual production origins, cookie SameSite policy, token lifetime, and preview-domain policy are deferred to the Phase 1 auth/deployment contract; placeholders suffice here. Provisioning services or changing hosted settings is outside this plan.

## OpenAPI bootstrap and planned contract changes

- Create `contracts/openapi.yaml` using OpenAPI **3.0.3**, JSON `camelCase`, explicit operation IDs, and an API version indicating the bootstrap stage.
- Add only `GET /v1/health` (`getHealth`), explicitly unauthenticated, returning HTTP 200 with `application/json` and a closed `HealthResponse` object containing required `status`, a string enum with the single value `ok`.
- This is process liveness after successful startup, not ongoing database readiness. It returns no dependency details, credentials, or version metadata. A later readiness contract needs a separate decision.
- Do not invent a domain-wide error envelope, login schema, collection endpoint, or unused resource DTO in Phase 0. Define those contract-first with their Phase 1 operations.
- Record pagination conventions alongside the bootstrap: future collections require opaque `cursor`, default `limit=50`, maximum 100, and typed `{items, count, nextCursor, hasMore}` responses with deterministic ordering. No offset pagination or total-count promise.
- Record the Specification rule: future supported variants use `oneOf` plus an explicit `type` discriminator mapping and typed `data`; backend and frontend support must land together. Do not put an empty union or free-form fallback in the bootstrap document.
- Validate with a pinned Redocly CLI and checked-in configuration. Explicitly mark the health operation public rather than globally suppressing security-related validation. [Redocly lint documentation](https://redocly.com/docs/cli/commands/lint).

### Go generation

Use the repository's already selected `github.com/oapi-codegen/oapi-codegen/v2`, pinned through Go tool dependencies. Generate models, a strict server interface, standard-library `net/http` routing, and an embedded contract into `backend/internal/api/generated/openapi.gen.go`. Keep its configuration at `backend/oapi-codegen.yaml`; run from `backend/` with `go tool oapi-codegen -config oapi-codegen.yaml ../contracts/openapi.yaml` using the pinned toolchain.

Handwritten adapters live outside `generated/`. Generated transport types never become core or PostgreSQL models. Strict generated interfaces do not substitute for runtime request validation; add validation when request-bearing operations arrive in Phase 1. Future union handling must use typed variant accessors and internal models, not raw arbitrary maps. [oapi-codegen documentation](https://github.com/oapi-codegen/oapi-codegen).

### TypeScript generation

Use pinned `openapi-typescript` in root tooling to generate `frontend/src/api/generated/schema.d.ts`. Use `openapi-fetch` in the frontend with those generated `paths` types and a small handwritten `frontend/src/api/client.ts` configuration wrapper. The generated artifact is the contract types; the client runtime is the library, not a second generated SDK. No handwritten request/response DTOs. [Type generation](https://openapi-ts.dev/introduction), [typed fetch client](https://openapi-ts.dev/openapi-fetch/).

Configure the wrapper with `NEXT_PUBLIC_API_BASE_URL` and `credentials: 'include'`. This prepares credentialed requests without implementing authentication. Use a browser-side test/smoke invocation of health; no backend dependency at Next.js build time.

Both generated directories are versioned and never hand-edited. A root `generate` command runs both generators. `check:generated` compares tracked changes and unexpected/untracked generated paths after regeneration, including deletions. A plain `git diff` alone is insufficient to detect an untracked new generated file. Require deterministic LF output without local paths/timestamps.

## Environment/configuration proposal

| Variable or setting | Local development | Production documentation / ownership |
| --- | --- | --- |
| `DATABASE_URL` | Compose supplies a development-only URL targeting `postgres:5432`; optional overrides belong in ignored `backend/.env.local` | Railway reference `${{Postgres.DATABASE_URL}}`, substituting the actual service name; private connection |
| `APP_ENV` | Compose explicitly sets `local` | Application-owned, manually set to `production`; CI uses `test` |
| `PORT` | Compose explicitly sets `8080`; publish `127.0.0.1:8080:8080` | Honor Railway's injected port; listen on `0.0.0.0` inside the container |
| `CORS_ALLOWED_ORIGINS` | Compose supplies exactly `http://localhost:3000` | Manually configured explicit frontend origin allowlist, no credentialed wildcard |
| `COOKIE_SECURE` | Preserve Compose's `false` | Document `true` for production auth in Phase 1; no cookie is issued in Phase 0 |
| `APP_USERNAME`, `APP_PASSWORD_HASH`, `APP_TOKEN_SECRET` | Reserved examples; use distinct local credentials when auth starts | Manually configured secrets; not validated/consumed by the Phase 0 HTTP server |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` in `frontend/.env.local`, copied from its example | Manually set to HTTPS backend origin in Vercel; public build-time configuration |

Fail clearly on missing/malformed required runtime configuration, invalid ports/origins, or an unreachable database. Use a bounded startup connection timeout (proposed 10 seconds), then close the pgx pool on shutdown. Do not log connection strings or secrets. Preserve provider connection/TLS parameters; do not silently weaken TLS or assume the Railway public endpoint uses the same settings as private networking.

`backend/.env.example` and `frontend/.env.example` contain placeholders only. Ensure Compose preserves literal `$` characters in Argon2id hashes; quote sample dotenv values appropriately and test this with a dummy value without printing secrets. Compose's explicit local environment takes precedence over the file. [Compose environment precedence](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/).

## Backend Docker and local Compose strategy

- Build API, stdin password hash helper, and pinned goose CLI in a multi-stage `backend/Dockerfile`. Use a thin non-root runtime with CA certificates, `/app/bin/api`, `/app/bin/hash-password`, `/app/bin/goose`, `/app/bin/migrate`, and `/app/migrations/`. A small shell wrapper for goose requires a runtime shell; a slim Debian runtime is the proposed baseline. Add timezone data only if needed.
- Pin builder/runtime images and Go dependencies. Keep compilers, Node, and code generators out of the final runtime. Use `.dockerignore` to exclude local env files, caches, and build artifacts. Do not pass runtime secrets as build arguments.
- Use exec-form `CMD` for the API, rather than a fixed API entrypoint that prevents Railway from overriding the command for pre-deploy. Respect SIGTERM with bounded HTTP shutdown.
- Use host Go for generation, formatting, vetting, tests, and local builds. The deployment build stays self-contained under `backend/`, and local backend/PostgreSQL runtime starts through Docker Compose.
- Extend `docker-compose.local.yml` with `backend` and `postgres` services, a PostgreSQL health check, and a named development volume. Do not add a frontend service. Use the same runtime image locally and in deployment. Rebuild/restart on changes initially; hot reload is not necessary for the foundation.
- Standard start: `docker compose -f docker-compose.local.yml up --build -d`; frontend: `npm --prefix frontend run dev` on port 3000. Avoid silent frontend port fallback because the CORS default deliberately targets port 3000.
- Test allowed-origin actual requests and OPTIONS preflight with credentials; disallowed origins must receive no permitting CORS headers. Do not require browser-security changes or a Vercel proxy.

Railway's service root remains `/backend`, where the repository's `backend/Dockerfile` becomes `Dockerfile` relative to that root. Configure the health path `/v1/health` and the migration command below in deployment instructions. [Railway Dockerfile documentation](https://docs.railway.com/builds/dockerfiles).

## Goose installation, migrations, and execution

- Pin `github.com/pressly/goose/v3/cmd/goose` as a Go tool dependency; install/build the CLI in the Docker builder, preferably with only the PostgreSQL driver enabled using the selected release's documented build tags. No global goose installation is required. [Goose installation](https://pressly.github.io/goose/installation/).
- Keep `backend/migrations/README.md` and tooling, but **no application SQL migration in Phase 0**. Application tables and their indexes/constraints remain Phase 1. Do not add a no-op deployed migration just to populate the directory.
- `/app/bin/migrate` maps runtime `DATABASE_URL` to `GOOSE_DBSTRING`, sets `GOOSE_DRIVER=postgres` and `GOOSE_MIGRATION_DIR=/app/migrations`, and invokes the installed goose CLI. Pass credentials through environment, not command arguments; propagate nonzero exit status. Document supported `up`, `status`, and explicit single-step `down` operations. [Goose commands](https://pressly.github.io/goose/documentation/cli-commands/).
- Distinguish an absent migration directory (error) from the expected Phase 0 directory with zero SQL files. For the latter, report no migrations and exit successfully without opening the database or creating goose metadata. Never swallow a goose error once SQL files exist.
- Local commands reuse the backend service, e.g. `docker compose -f docker-compose.local.yml run --rm --no-deps backend /app/bin/migrate up` and the equivalent `status`. Expose npm/Make aliases. No migration on ordinary API startup.
- Production pre-deploy command: **`/app/bin/migrate up`**. It uses Railway's private `DATABASE_URL` reference; failed migrations must block deployment. The no-migrations behavior makes this command usable during Phase 0 without schema changes. [Railway pre-deploy documentation](https://docs.railway.com/deployments/pre-deploy-command).
- Every committed migration must have executable Up and Down sections. A static check validates naming/order/unique versions and both markers; goose execution in CI validates actual SQL behavior.
- To test tooling now, keep a reversible test-only SQL fixture under `backend/testdata/migrations/`, outside the shipped migration directory. Run Up Ã¢â€ â€™ Down Ã¢â€ â€™ Up against disposable CI PostgreSQL and verify the fixture table's presence/absence and goose status. Also test malformed SQL failure propagation and the empty-directory case. Run this fixture only on disposable test PostgreSQL, never development data or Railway; exclude it from the runtime image.
- Phase 0 makes no application schema changes to any production database. Local test Compose and CI may create the fixture and goose bookkeeping in their disposable databases.

## GitHub Actions structure

Use one `.github/workflows/ci.yml` on pull requests and pushes to `main`, with read-only repository permissions, lockfile-based caches, timeouts, and cancellation of superseded runs. Pin third-party actions to reviewed commit SHAs with version comments. Avoid path filters initially so a required gate cannot be skipped accidentally.

| Job | Work |
| --- | --- |
| `contract` | Root `npm ci`; pinned Go setup; OpenAPI lint; regenerate both outputs; fail on drift, including untracked files |
| `backend` | Matching Go setup; module verification; formatting check; `go vet`; pinned Staticcheck; unit tests; build |
| `frontend` | `npm ci` in `frontend/`; ESLint; TypeScript check; Vitest; production build using a non-secret API URL |
| `database` | Disposable PostgreSQL service, PostgreSQL 17, matching development; migration structural validation, fixture round-trip, wrapper failure tests, and pgx connection smoke test |
| `docker` | Build production backend image; verify non-root runtime, binaries, CA availability, migration directory, command override, and absence of source secrets/toolchains |
| `ci` | Always-run aggregate job that fails unless every required job succeeded; stable required-check name |

CI database credentials are disposable job-local values; no Railway or Vercel secrets are required. Persistence integration tests added in Phase 1 extend the database job to exercise the real migrations and repositories. The same isolated integration tests also run against `docker-compose.test.yml`; standard development data stays separate.

README will explain Railway's **Wait for CI** setting and the required check. For Vercel, document a production promotion/deployment procedure that uses a successful CI commit; previews must not bypass the production gate. No production deploy jobs or tokens are added in Phase 0. Do not claim hosted gates are enabled until verified. [Railway Wait for CI](https://docs.railway.com/deployments/github-autodeploys).

## Implementation steps

The steps below are the Phase 0 review slices. Checkboxes reflect the current implementation state. Root npm commands are the portable developer interface; Go development commands use the host Go 1.26.8 toolchain; backend/PostgreSQL runtime uses Docker Compose. After each step, run its checks, update this plan and `docs/STATUS.md`, record approved/unexpected decisions in `docs/DECISIONS.md`, and report results before continuing.

### 1. Record approval and establish the repository checkpoint

- [x] **Goal:** persist the approved scope and resolve workflow document tracking before adding code.
- **Files/packages:** `.gitignore` if approved; `docs/STATUS.md`; `docs/DECISIONS.md`; this plan; `.gitattributes` for deterministic line endings.
- **Commands/checks:** `git status --short`; `git check-ignore -v` on workflow docs, `.env.local` files, and generated paths; `git diff --check`.
- **Acceptance:** status states Phase 0 is approved/in progress; decisions distinguish approved choices from pending remote settings; actual secrets remain ignored; generated outputs can be tracked; workflow tracking matches the user's answer. No implementation of later phases.

### 2. Pin tools and initialize minimal package boundaries

- [x] **Goal:** make dependency installation and basic commands reproducible on Windows and CI.
- **Files/packages:** root `package.json`/`package-lock.json`, Node version file, `scripts/`, Makefile aliases; `backend/go.mod`/`go.sum`; minimal Go package documentation; frontend `package.json`/`package-lock.json`; initial `backend/Dockerfile` and `.dockerignore` foundation.
- **Commands/checks:** resolve compatible exact versions; root and frontend `npm ci`; `go mod download`; `go mod verify`; verify Node/npm/Go/Docker Compose versions; `git diff --check`.
- **Acceptance:** module uses the existing GitHub remote identity; fresh lockfile installs work; root and frontend installs are independent; no floating generator/tool versions; no placeholder domain interfaces or models. Record the selected versions and the native-Go tooling decision.

### 3. Define and validate the bootstrap contract

- [x] **Goal:** approve an executable HTTP contract before handler implementation.
- **Files/packages:** `contracts/openapi.yaml`, `contracts/README.md`, Redocly configuration, root `contract:lint` script.
- **Commands/checks:** `npm run contract:lint`; review health example against its schema; verify no collection or Specification endpoint has slipped into the bootstrap.
- **Acceptance:** only the agreed typed health response is exposed; operation is explicitly public; pagination and future Specification requirements are documented; no database or domain contract is invented.

### 4. Generate Go transport code

- [x] **Goal:** prove the Go generator and router choices compile from the contract.
- **Files/packages:** `backend/oapi-codegen.yaml`, Go tool pins, `backend/internal/api/generated/openapi.gen.go`, root `generate:go` script.
- **Commands/checks:** `npm run generate:go`; `go test ./internal/api/generated/...`; repeat generation and compare output bytes.
- **Acceptance:** generated strict interface/router/models compile; output is deterministic and intended for commit; no manual modifications to generated code and no contract import needed at runtime from outside `backend/`.

### 5. Scaffold the frontend and generated API boundary

- [x] **Goal:** build the independent Next.js application and prove it consumes the generated contract.
- **Files/packages:** `frontend/src/app/`, Next.js/TypeScript/Tailwind/ESLint/Vitest configuration; `frontend/src/api/generated/schema.d.ts`; `frontend/src/api/client.ts` and its tests; root `generate:ts`/`generate` scripts; `frontend/.env.example`.
- **Commands/checks:** `npm run generate:ts`; `npm --prefix frontend run lint`; `npm --prefix frontend run typecheck`; `npm --prefix frontend test -- --run`; `npm --prefix frontend run build`; start `npm --prefix frontend run dev` and load the placeholder page.
- **Acceptance:** independent frontend install/build succeeds without a live backend; typed health calls use configured origin and include credentials; a fetch-boundary test covers URL/configuration and failed-request handling; no duplicated DTOs, auth UI, or domain UI. No remote font fetch is needed to build the placeholder. [Next.js setup reference](https://nextjs.org/docs/app/getting-started/installation).

### 6. Add runtime configuration and PostgreSQL connection bootstrap

- [x] **Goal:** provide only the startup wiring needed to run with PostgreSQL through configuration.
- **Files/packages:** `backend/internal/config/`, `backend/internal/storage/postgres/` connection lifecycle code, a small storage lifecycle interface where consumed; `backend/.env.example`; unit tests.
- **Commands/checks:** focused `go test` for configuration/lifecycle; `go vet ./...`; test required values, malformed configuration, timeout/failure cleanup, and redacted errors using fakes. Real connectivity is checked in steps 10/11.
- **Acceptance:** bounded pgx startup ping and pool shutdown are available without reading/writing application tables; reserved auth settings are documented accurately; no generated API type crosses the storage interface; business repositories remain Phase 1 work.

### 7. Wire the health server and local CORS

- [x] **Goal:** run the generated HTTP adapter with the approved startup and browser behavior.
- **Files/packages:** `backend/cmd/api/`, handwritten `backend/internal/api/` handler/router/CORS code and tests; startup assembly.
- **Commands/checks:** `go test ./...`; `go vet ./...`; `go build ./cmd/api`; HTTP tests for the exact health schema, allowed/disallowed origins, credentialed preflight, and graceful shutdown.
- **Acceptance:** health returns the generated typed response; server binds the configured port after successful database startup; startup failure exits nonzero; CORS supports localhost:3000 without wildcard credentials; no business logic resides in handlers.

### 8. Add the stdin password hash utility

- [x] **Goal:** make the documented secret-bootstrap helper real without adding authentication endpoints.
- **Files/packages:** `backend/cmd/hash-password/` and narrowly scoped hashing implementation/tests; dependency pins; root/Make command aliases.
- **Commands/checks:** focused Go tests for Argon2id encoding, random salt, verification, empty input, and stdin line endings; `go build ./cmd/hash-password`; a dummy stdin smoke check.
- **Acceptance:** reads password only from stdin, writes an encoded Argon2id hash, never requires a plaintext CLI argument; no insecure default password or token secret. Document compatible parameters for Phase 1; do not implement sessions here.

### 9. Package the backend and goose runtime

- [ ] **Goal:** create the deployable image and operational migration commands without application schema changes.
- **Files/packages:** runtime/build stages in `backend/Dockerfile`, `.dockerignore`, `backend/scripts/migrate` (installed as `/app/bin/migrate`), `backend/migrations/README.md`, `backend/testdata/migrations/`, goose pins; `docker-compose.local.yml`, `docker-compose.test.yml`, and command aliases.
- **Commands/checks:** `docker build -f backend/Dockerfile -t focusflow-backend:phase0 backend`; run binary/help and empty-migration checks in runtime; `docker compose -f docker-compose.local.yml config --quiet` with dummy configuration; inspect service names and non-root image configuration; validate migration markers/names; test missing directory and wrapper exit status.
- **Acceptance:** final image contains all runtime/migration assets and supports command override; no build tools, env secrets, or test fixtures ship; backend and PostgreSQL development services plus a separate disposable test project; local port/CORS defaults and literal hash handling work; empty migrations do not touch a database. Database-backed migration fixture execution remains step 10.

### 10. Add verification commands and GitHub Actions gates

- [ ] **Goal:** make all relevant checks repeatable and demonstrate that CI catches contract drift and migration failure.
- **Files/packages:** root check scripts/aliases, Staticcheck pin, migration/drift check helpers and tests, `.github/workflows/ci.yml`, backend connection integration test/CI fixture runner.
- **Commands/checks:** `npm run contract:lint`; `npm run generate`; `npm run check:generated`; `npm run check:backend` (gofmt check, vet, Staticcheck, unit tests, build); `npm run check:frontend` (lint, typecheck, tests, build); `npm run check:migrations`; `npm run test:database:local` and CI `npm run test:database`; backend Docker build.
- **Acceptance:** all jobs described above execute; database fixture passes Up Ã¢â€ â€™ Down Ã¢â€ â€™ Up and connectivity test on disposable CI PostgreSQL; invalid migration fails; generated-file modification, deletion, and untracked addition each fail the drift checker in an isolated test checkout/temp fixture. No production/development DB is used by CI. Use the separate test Compose project for local integration checks.

### 11. Complete setup documentation and phase acceptance

- [ ] **Goal:** demonstrate the documented local topology and leave an accurate checkpoint.
- **Files/packages:** `README.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, this plan; environment examples if verification finds corrections.
- **Commands/checks:** run the full checks from step 10 on the final change; confirm the GitHub Actions result for that revision when available; using Compose development defaults, run `docker compose -f docker-compose.local.yml up --build -d`, `npm --prefix frontend run dev`, and a browser health fetch through the typed client with credentials. Check a localhost-origin preflight, successful startup ping, clean shutdown, and migration `status` in the empty-directory case. Finish with `git diff --check` and a tracked/untracked/ignored-file review.
- **Acceptance:** README commands are executable and distinguish manual application settings, Railway references/provided settings, and frontend public configuration. It covers environment-file copies, secret/hash setup, local migration commands, Docker rebuilds, Vercel root `frontend/`, Railway root `/backend`, exact pre-deploy command, and CI-before-production procedure. Generated outputs are included in the versioned change; all acceptance evidence/limitations are recorded. No phase is marked complete while required checks are unavailable or failing; no Phase 1 implementation starts.

## Phase acceptance criteria

- [ ] Root/Go/frontend dependencies install reproducibly using recorded pins and lockfiles.
- [ ] OpenAPI validates; Go and TypeScript generation is deterministic; both generated outputs are included in version control; CI detects all forms of generated drift.
- [ ] Backend formatting, Staticcheck, vet, unit tests, build, and Docker build pass.
- [ ] Frontend lint, typecheck, meaningful API-boundary tests, and production build pass; frontend starts directly with Node.js.
- [ ] Backend starts in Docker with the Compose PostgreSQL service; browser requests from localhost:3000 succeed without CORS changes; supplied auth secrets are tolerated but not yet used.
- [ ] Migration structure checks and disposable CI PostgreSQL integration checks pass; test fixtures never ship or run remotely; every SQL fixture/migration has Up and Down.
- [ ] Runtime supports goose pre-deploy execution with failure propagation; no application migration exists yet.
- [ ] GitHub Actions for the final revision is green, or explicitly pending with phase completion withheld. README describes production CI gates without claiming unverified hosted settings.
- [ ] No host-installed PostgreSQL, frontend container, later-phase domain code, weak Specification API, or additional infrastructure has been introduced.
- [ ] README, status, decisions, and step checkboxes agree with actual verification results. Review generated files for inclusion in the eventual commit; this task does not itself request a Git commit/push.

## Rollback and recovery

- Each step should be reviewable independently. Revert the relevant code/configuration change to undo a failed foundation step; keep the contract and both generated outputs together.
- Regenerate from the contract with pinned tools to recover generated files. Never repair drift by hand-editing outputs.
- Stop local containers with `docker compose -f docker-compose.local.yml down` and stop the Node process. This preserves the named development database volume. Do not use `down --volumes` on the development project without explicit intent to delete its data. The test project has separate disposable data.
- Remote application schema is unchanged in Phase 0. Dispose of the CI database after fixture tests. Failed goose tests must fail CI, not be ignored.
- In later phases, application rollback never runs `goose down` automatically. Database rollback is a separate explicit action after reviewing data loss and compatibility; never edit deployed schema manually.
- If cloud access, tool installation, Docker availability, or CI execution prevents a required check, record the exact blocker and remaining action in status. Do not claim an unrun test passed.

## Notes discovered during implementation

- Step 1: approval and language policy recorded; workflow documents are no longer ignored. Database defaults were subsequently resolved by D-024.
- Docker Desktop's Linux engine was not running at implementation start; local PostgreSQL runs in Docker Compose, as clarified in D-024.
- Steps 2-8 are implemented and locally checked with host Go and existing Node dependencies. `npm run contract:lint`, `npm run generate`, `npm run check:backend`, `npm run check:frontend`, `npm run check:migrations`, and `npm run test:tooling` have passed in the working tree.
- `scripts/check-generated.mjs` now invokes Go and TypeScript generation directly instead of spawning nested npm on Windows. In the current uncommitted working tree it correctly fails because `backend/internal/api/generated/openapi.gen.go` and `frontend/src/api/generated/schema.d.ts` are still untracked; it should pass after the Phase 0 files are staged/committed.
- Step 9 remains incomplete because `npm run check:docker` fails during `go mod download` inside the Docker builder with `x509: certificate signed by unknown authority` for `proxy.golang.org`. This is consistent with external HTTPS interception and must not be fixed with repository certificate overrides per D-025.
- The current shell has `npm_config_offline=true`; clean npm install checks require clearing that environment variable or using `--offline=false` with working registry access. The frontend lockfile should be regenerated or validated after registry access is healthy. The latest attempted `npm --prefix frontend install --package-lock-only --ignore-scripts` could not reach `registry.npmjs.org` and ended with `ENETUNREACH`.

