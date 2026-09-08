# FocusFlow — Implementation Plan

This document defines phase boundaries and how Codex must execute them.

It is not the detailed plan for any individual phase.

Before implementing a phase, Codex creates a small-step execution plan under:

```text
docs/exec-plans/
```

Example:

```text
docs/exec-plans/phase-0-foundation.md
```

Codex must not begin a new phase until the user approves that phase plan.

---

# Phase workflow

For every phase:

1. Re-read `SCOPE.md`.
2. Re-read `docs/ARCHITECTURE.md`.
3. Re-read `docs/STATUS.md`.
4. Re-read `docs/DECISIONS.md`.
5. Inspect the actual repository state.
6. Create/update the phase execution plan.
7. Break implementation into minimal coherent steps.
8. List unresolved product/architecture questions.
9. Ask the user only the questions that materially affect the phase.
10. Get approval.
11. Implement one step at a time.
12. Validate each step.
13. Keep the phase plan checkboxes current.
14. Update `docs/STATUS.md` as facts change.
15. Complete phase acceptance checks.
16. Summarize the phase to the user.
17. Do not proceed to the next phase without approval.

---

# Phase 0 — Repository foundation

## Goal

Create a working monorepo foundation with reproducible code generation, local backend-and-PostgreSQL-in-Docker development, direct Node.js frontend development, CI, and deployment documentation.

## Includes

- repository layout;
- Go module;
- Next.js/TypeScript frontend;
- `contracts/openapi.yaml`;
- API code generation;
- committed generated outputs;
- Makefile or equivalent developer commands;
- `backend/Dockerfile`;
- `docker-compose.local.yml`;
- `.env.example` files;
- GitHub Actions;
- README;
- goose tooling/bootstrap;
- password hash helper skeleton or implementation if required for auth bootstrap.

## Important local constraint

Do not install PostgreSQL directly on the host. As clarified by the user on 2026-09-05, local Compose contains the backend and PostgreSQL 17. A separate test Compose project provides disposable PostgreSQL, isolated from development data. Railway remains the production database.

## Acceptance criteria

- repository builds;
- frontend starts directly with Node.js;
- backend Docker image builds;
- backend can start from `docker-compose.local.yml` when a valid remote DB URL and auth secrets are supplied;
- OpenAPI generation runs;
- generated files are committed;
- CI detects generated-code drift;
- README accurately explains local setup and deployment;
- PostgreSQL runs in Docker without a host installation; integration tests use isolated disposable data.

---

# Phase 1 — Core backend

## Goal

Implement the generic backend domain before any job-search-specific behavior.

## Includes

- configuration;
- auth;
- Focus;
- Focus hierarchy;
- Flow endpoints;
- Goal;
- Goal-to-Focus links;
- Specification storage/infrastructure;
- Events;
- cursor pagination;
- application services;
- storage interfaces;
- PostgreSQL implementations;
- goose migrations;
- REST API;
- API/core/storage model mapping;
- tests;
- event writes.

## Specification limitation

Do not expose a weakly typed public Specification payload just because the storage table exists.

The first concrete public Specification API arrives with the first typed Specification variant.

## Acceptance criteria

- core API behavior is contract-first;
- schema is created through goose;
- Up and Down migrations are present;
- subtree deletion is tested;
- Goal ownership/link delete semantics are tested;
- hierarchy cycle prevention is tested;
- collection endpoints are cursor-paginated;
- persistence integration tests run against disposable PostgreSQL in CI;
- backend Docker build succeeds.

---

# Phase 2 — Generic UI

## Goal

Create the first usable product UI on top of the generic API.

## Includes

- login page;
- authenticated app shell;
- generated API client;
- Flow list;
- Flow cards;
- create Flow;
- logout;
- loading/error states.

## Acceptance criteria

- frontend uses generated contract types/client;
- no manually duplicated API DTOs;
- login works against backend;
- Flow list is paginated;
- Flow creation works;
- production build passes.

---

# Phase 3 — Focus page

## Goal

Allow navigation through the Focus hierarchy.

## Includes

- Focus details;
- parent path/breadcrumbs;
- child Focus list;
- Goal list;
- base layout for future Specification blocks;
- navigation between hierarchy levels.

## Acceptance criteria

- arbitrary-depth hierarchy can be navigated;
- children use pagination;
- parents/breadcrumbs are represented by an API designed for that use case;
- no job-specific behavior exists yet.

---

# Phase 4 — Editing

## Goal

Make the generic system fully usable.

## Includes

- edit Focus fields;
- status changes;
- tags;
- description;
- feedback;
- color;
- parent changes;
- Goal create/edit/delete;
- Goal-to-Focus links;
- relevant validation and event writes.

## Acceptance criteria

- all generic core data is editable;
- invalid hierarchy changes are rejected;
- event history is populated by mutations;
- Goal derived/override behavior is covered by tests.

---

# Phase 5 — First typed Specification

## Goal

Add the first real domain-specific capability: job-search/job-position tracking.

## Required design step

Before coding, define the exact data model with the user.

Do not infer fields from old discussions and silently implement them.

## Contract rule

The Specification is a strongly typed OpenAPI variant.

The same repository change must include:

- OpenAPI variant;
- generated Go changes;
- generated TypeScript changes;
- internal typed backend model;
- validation;
- JSONB mapping;
- API handling;
- frontend renderer;
- frontend editor;
- tests.

## Acceptance criteria

- no untyped Specification payload at the API boundary;
- backend and frontend support the same version;
- JSONB persistence round-trips through typed models;
- UI renders the typed block.

---

# Phase 6 — Activity

## Goal

Expose and display the event data accumulated by earlier phases.

## Includes

- typed activity response;
- cursor pagination;
- Activity UI;
- useful event summaries.

## Acceptance criteria

- activity is backed by existing event records;
- API is paginated;
- no event sourcing is introduced.

---

# Phase 7 — Observability

## Goal

Make production behavior diagnosable without adding an unnecessary platform.

## Includes

Start with:

- structured JSON logs;
- request ID/correlation ID;
- HTTP latency;
- status/error logging;
- database operation timing.

Then evaluate OpenTelemetry.

## Acceptance criteria

- a failed production request can be traced through logs;
- no unnecessary observability infrastructure is added.

---

# Phase 8 — MCP

## Goal

Expose FocusFlow to an agent without duplicating domain logic.

## Includes

- separate MCP adapter/server;
- read tools;
- mutation tools;
- same application services as HTTP;
- same validation;
- same event creation;
- source marked as MCP.

## Acceptance criteria

- no MCP-specific duplicate business implementation;
- MCP and HTTP produce equivalent domain behavior.

---

# Execution-plan granularity

A phase plan should not contain giant steps such as:

```text
Implement backend.
```

Prefer:

```text
1. Define initial OpenAPI schemas and error envelope.
2. Generate server/client types and lock generation commands.
3. Add configuration model and validation.
4. Add first goose migration for Focus.
5. Implement Focus core model and storage interface.
6. Implement PostgreSQL Focus storage.
7. Add Focus service rules.
8. Add HTTP mappings/handlers.
9. Add integration tests.
...
```

Each step should be small enough that the user can review the direction before the next architectural decision is buried underneath more code.
