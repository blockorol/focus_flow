# FocusFlow — Decisions

This file records explicit product/architecture decisions so Codex does not need conversational history.

## D-001 — Product name

**Decision:** FocusFlow.

---

## D-002 — Universal entity

**Decision:** Focus is the universal hierarchical entity.

A Flow is a Focus with `parent_id = NULL`.

No separate Flow table.

---

## D-003 — Initial tables

**Decision:**

```text
focus_object
focus_goal
focus_goal_link
focus_specification
focus_event
```

No tag table.

---

## D-004 — Tags

**Decision:** tags are arbitrary strings stored directly on Focus, currently as PostgreSQL `TEXT[]`.

---

## D-005 — Focus status

**Decision:**

```text
idea
planned
active
paused
waiting
done
cancelled
```

---

## D-006 — Focus type

**Decision:** no generic `focus.type` field.

Domain-specific behavior belongs to Specifications.

---

## D-007 — Specifications

**Decision:** one Focus may have multiple Specifications.

Storage uses JSONB, but API typing is strict.

A new supported Specification requires coordinated backend + frontend + OpenAPI work.

There is no benefit to intentionally weak typing because FocusFlow is a website in a monorepo rather than an open third-party extension platform.

---

## D-008 — Goals

**Decision:** each Goal has one hard owner Focus.

Deleting the owner Focus deletes the Goal.

A Goal may additionally link to multiple Focuses through `focus_goal_link`.

Deleting a linked Focus deletes only the relation, not the Goal and not other linked Focuses.

Goal type is initially:

```text
primary
secondary
```

Goal status is nullable override plus derived behavior from linked Focuses.

---

## D-009 — Feedback

**Decision:** `feedback` is a simple nullable text field on Focus.

No comments/feedback history entity in v1.

---

## D-010 — Deletion

**Decision:** deleting a Focus hard-deletes its descendants.

No soft-delete/archive behavior in v1.

---

## D-011 — IDs and time

**Decision:**

- UUIDv7 IDs;
- `TIMESTAMPTZ`;
- timestamps as separate columns rather than a JSON object.

---

## D-012 — Backend

**Decision:**

- Go;
- REST;
- PostgreSQL;
- pgx;
- goose;
- Docker.

---

## D-013 — Backend layers

**Decision:** separate:

1. API/transport models;
2. core/internal models;
3. storage/PostgreSQL models.

Additional internal models are allowed for specific subsystems.

Storage is behind Go interfaces and PostgreSQL implementations use core/internal models at the boundary.

---

## D-014 — API contract

**Decision:** contract-first OpenAPI in the monorepo.

Generated code is committed for backend and frontend.

All supported Specifications are represented in the OpenAPI contract.

---

## D-015 — Pagination

**Decision:** every collection endpoint uses cursor pagination from the start.

---

## D-016 - Authentication

**Decision:** initial auth uses login/password from environment configuration.

No users table.

As superseded by D-028, the environment stores the configured plaintext password as `APP_PASSWORD`. Configuration loading converts it into an in-memory credential/hash representation and must never log it.

Backend issues signed token state; browser transport uses HttpOnly cookie.

---

## D-017 — Local development

**Decision:**

- frontend runs directly with Node.js;
- backend runs in Docker;
- no PostgreSQL installation directly on the host;
- local backend and PostgreSQL run in Docker Compose (clarification D-024 supersedes the initial remote-only assumption);
- local CORS setup must work by default for `http://localhost:3000`.

---

## D-018 — Production deployment

**Decision:**

- frontend: Vercel;
- backend: Railway from Dockerfile;
- database: Railway PostgreSQL;
- migrations: goose in Railway pre-deploy;
- CI must pass before production deploy.

No production Docker Compose deployment.

---

## D-019 — Phase order

**Decision:**

1. Repository foundation
2. Core backend
3. Generic UI
4. Focus page
5. Editing
6. First typed Specification
7. Activity
8. Observability
9. MCP

The numbered implementation phases in project docs are Phase 0 through Phase 8.

---

## D-020 — Scope discipline

**Decision:** implement the general system before the job-search Specification.

Do not add technologies or abstractions solely to look sophisticated.

---

## D-021 — Phase 0 approval

**Decision:** The user approved `docs/exec-plans/phase-0-foundation.md` on 2026-09-05, including its recommended defaults. Track workflow instructions, status, and execution plans in Git. Keep the local bootstrap prompt ignored.

Phase 0 uses npm, OpenAPI 3.0.3, oapi-codegen, openapi-typescript with openapi-fetch, and a public health-only bootstrap contract. Require a bounded database startup ping; defer authentication enforcement and application migrations to Phase 1. Remote development database details remain pending. This approval does not authorize production deployment or Phase 1.

## D-022 — Repository language

**Decision:** Communicate with the user in Russian. All created or modified repository content must be in English, including generated code, comments, documentation, configuration descriptions, and UI text.

## D-023 — Disposable local test PostgreSQL

**Decision:** On 2026-09-05 the user explicitly allowed local PostgreSQL in Docker for tests and delegated suitable default/version selection. Use PostgreSQL 17 in a separate `docker-compose.test.yml`, with disposable test-only credentials/data. Use the same PostgreSQL major in CI. The subsequent clarification D-024 also permits Docker PostgreSQL for normal development.

## D-024 — Corrected local development topology

**Decision:** On 2026-09-05 the user clarified that the original restriction concerned installing PostgreSQL directly on Windows, not running it in Docker. Local development is Node.js frontend plus backend and PostgreSQL in `docker-compose.local.yml`. Use the internal Compose hostname `postgres` and PostgreSQL 17. Development data uses a named Docker volume; test data remains separate and disposable. Railway PostgreSQL is for production; a remote Railway URL is not required to complete local Phase 0 verification. This supersedes all earlier remote-only local-development assumptions in the initial documents and plan. No application persistence model changes are implied.

## D-025 — No repository certificate trust workaround

**Decision:** Do not add project-level certificate replacement, local CA bundles, Docker build hooks for custom trusted roots, disabled TLS verification, or package-manager certificate overrides to solve dependency-download trust failures.

On 2026-09-07, Phase 0 Docker diagnostics showed that the clean Go builder container receives a `proxy.golang.org` leaf certificate issued by `Avast Web/Mail Shield Root`. The failure comes from local HTTPS scanning/interception outside the repository. It must be handled as a developer machine/network configuration issue, not as application architecture or repository source.

Standard operating-system CA packages inside runtime images remain allowed for ordinary HTTPS support.

## D-026 — Native Go tooling and Compose runtime

**Decision:** Use the host Go toolchain for Go development commands: module maintenance, code generation through `go tool`, formatting, vetting, tests, and local builds.

The backend application still runs locally through `docker-compose.local.yml`, and production still builds from `backend/Dockerfile`. Docker Compose is the standard entry point for local backend/PostgreSQL runtime. Do not route normal Go commands through a Docker helper.

Docker base images use explicit version tags such as `golang:1.26.8-bookworm`, not digest-pinned references, unless a later release/reproducibility policy explicitly changes this.

## D-027 - Roadmap reset

**Decision:** On 2026-09-08 the old Phase 0 through Phase 8 roadmap was superseded for execution planning. Keep it in `docs/IMPLEMENTATION_PLAN.md` as OLD history.

The next active phase is `BE full MVP`. Implementation proceeds by first-level points inside that phase rather than by the old small product phases. Each point should be independently reviewable and tested before moving on.

---

## D-028 - Configured-user password handling

**Decision:** On 2026-09-08 the user changed the configured-user password approach. Store the configured password directly in the runtime environment as `APP_PASSWORD`, not as `APP_PASSWORD_HASH`.

The backend config/auth setup converts the plaintext password into an in-memory credential/hash representation after reading configuration. The plaintext password must not be logged, passed as a command-line argument, or persisted by the application.

Auth verification must sit behind an abstraction so a later implementation can replace the single env-configured user with database-backed passwords, Google login, or another provider.

---
