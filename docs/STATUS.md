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
- No BE full MVP implementation has started after the planning reset.

## Next action

Review and approve [the BE full MVP execution plan](exec-plans/phase-1-be-full-mvp.md). After approval, start only point 1: backend models without logic.
