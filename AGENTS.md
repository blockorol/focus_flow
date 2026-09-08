# FocusFlow — Codex Working Instructions

This file is the operating guide for Codex. Keep it short. Detailed product and architecture decisions live in the linked repository documents.

## Language

Communicate with the user in Russian. Write all repository content in English, including code, comments, documentation, configuration descriptions, generated files, and UI text.

## Source of truth

Before making changes, read only the documents relevant to the current task:

- `SCOPE.md` — product scope, domain rules, phases, and explicit non-goals.
- `docs/ARCHITECTURE.md` — architecture and dependency rules.
- `docs/IMPLEMENTATION_PLAN.md` — phase workflow and phase acceptance criteria.
- `docs/STATUS.md` — current phase, completed work, known issues, and next action.
- `docs/DECISIONS.md` — decisions already made by the user.
- `docs/exec-plans/phase-*.md` — detailed plan for the active phase.

Do not rely on remembered chat context when the repository documents can answer the question.

If a user decision changes the design, update the appropriate repository document in the same change so the repository remains the source of truth.

## Work phase by phase

Do not implement the whole project at once.

Before starting each phase:

1. Re-read `SCOPE.md`.
2. Re-read `docs/ARCHITECTURE.md`.
3. Re-read `docs/STATUS.md`.
4. Re-read `docs/DECISIONS.md`.
5. Read the relevant section of `docs/IMPLEMENTATION_PLAN.md`.
6. Inspect the current codebase instead of assuming prior implementation details.
7. Create or update `docs/exec-plans/phase-N-<name>.md`.
8. Break the phase into the smallest coherent implementation steps.
9. Present the phase plan to the user and ask only questions that materially affect the contract, schema, architecture, deployment, or product behavior.
10. Wait for user approval before starting a new phase.

Do not ask questions that can be answered from the repository.

## Phase plan requirements

Every phase execution plan must contain:

- goal;
- non-goals;
- assumptions;
- open questions;
- numbered implementation steps;
- expected files/packages affected;
- migrations, if any;
- API contract changes, if any;
- tests/checks for each step;
- phase-level acceptance criteria;
- rollback/recovery notes where relevant.

Prefer small steps that can be reviewed independently.

Do not mix work from a later phase into the current phase unless the user explicitly approves it.

## During implementation

After each coherent step:

- run the relevant checks;
- mark the step complete in the active phase plan;
- record unexpected design decisions in `docs/DECISIONS.md`;
- keep `docs/STATUS.md` accurate;
- briefly report what changed, what was verified, and what remains.

If implementation reveals that the current design is wrong or incomplete, stop before changing a public contract or persistence model and ask the user.

## Between phases

At the end of every phase:

1. Run all phase acceptance checks.
2. Update `docs/STATUS.md`.
3. Move unresolved issues into the next phase plan or `docs/STATUS.md`.
4. Update README instructions if running, configuration, or deployment changed.
5. Re-read the source-of-truth documents before proposing the next phase.
6. Present a concise phase summary.
7. Ask for approval before beginning the next phase.

This is intentionally designed so Codex does not need to keep the entire project history in conversational context.

## Architecture constraints

Do not change these without explicit user approval:

- monorepo;
- REST API;
- contract-first OpenAPI;
- strongly typed Specifications in OpenAPI;
- Go backend;
- Next.js/TypeScript frontend;
- PostgreSQL;
- pgx;
- goose migrations;
- backend in Docker;
- frontend runs directly with Node.js locally and is deployed to Vercel;
- Railway backend deployment from `backend/Dockerfile`;
- separate API, core/internal, and storage models;
- storage behind Go interfaces with PostgreSQL implementations;
- business logic outside HTTP handlers;
- no separate Flow table;
- no tags table;
- local PostgreSQL runs in Docker; no host-installed PostgreSQL;
- cursor pagination for every collection endpoint.

## Specification rule

Specifications are not weakly typed extension blobs at the API boundary.

Every supported Specification type must be represented in the OpenAPI contract and supported by both backend and frontend in the same repository change.

Use an OpenAPI discriminated union (`oneOf` + discriminator) for the supported Specification variants.

The PostgreSQL representation may use JSONB, but transport and internal handling for a known Specification must be strongly typed.

Do not introduce a new Specification type in only one side of the application.

## Database migrations

All schema changes use goose.

Every SQL migration must include both:

- `-- +goose Up`
- `-- +goose Down`

unless rollback is genuinely impossible, in which case stop and discuss it with the user first.

Migration files live in `backend/migrations/`.

Never change a deployed schema manually.

## Local development

The user does not want PostgreSQL installed directly on the host. PostgreSQL runs locally in Docker, as clarified on 2026-09-05. Use PostgreSQL 17 as the initial baseline.

Expected local topology:

- frontend: local Node.js process;
- backend: Docker via `docker-compose.local.yml`;
- database: PostgreSQL in the same local Compose project, reached by the backend through the `postgres` service name.

`docker-compose.local.yml` should configure local frontend origin automatically. The developer should not need to manually troubleshoot CORS for the standard `http://localhost:3000` frontend.

Include PostgreSQL in `docker-compose.local.yml`. Keep integration tests isolated from development data using `docker-compose.test.yml` and disposable test credentials/data. Never target production from tests.

## Production deployment

- Frontend: Vercel.
- Backend: Railway, built from `backend/Dockerfile`.
- Database: Railway PostgreSQL.
- Production migrations: goose via Railway pre-deploy command.
- CI must pass before production deployment.
- README must state which environment variables are manually configured and which are Railway-provided/reference variables.

Railway does not use a repository Docker Compose file as the backend deployment unit. Do not create a second production Compose file unless the user later has a concrete non-Railway use case for it.

## Validation

For any code change, run the checks relevant to the touched area.

At minimum, before declaring a phase complete:

- OpenAPI validation and generated-code drift check;
- backend formatting, lint/static analysis, tests, and build;
- backend Docker build;
- frontend lint, typecheck, tests, and production build;
- migration validation;
- integration tests against disposable PostgreSQL in CI where persistence behavior is involved.

Do not claim something was tested if it was not actually run.
