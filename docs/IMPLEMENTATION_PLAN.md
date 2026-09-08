# FocusFlow - Implementation Plan

This document defines the current execution model and keeps the old phase plan for history.

Detailed implementation plans live under:

```text
docs/exec-plans/
```

Codex must not start implementation for a new top-level point until the user has approved the plan for that point or phase.

---

# Current execution model

The previous fine-grained phase roadmap did not match the desired working style. From 2026-09-08 onward, implementation proceeds by first-level points inside a larger product phase.

The immediate next phase is:

```text
BE full MVP
```

Work inside this phase is implemented point by point. Example: implement backend models without logic, stop for review/commit, then move to converters/builders, then API stubs, and so on.

Each first-level point should be independently reviewable and should have its own status in the active execution plan. Tests are expected at every point where behavior or mapping can be verified.

---

# Active phase: BE full MVP

## Goal

Implement the complete backend MVP foundation for the generic FocusFlow domain before building the real frontend product UI and before adding job-search-specific Specifications.

## First-level implementation points

1. Backend models only, without business logic.
2. Converters/builders between API, internal, and PostgreSQL storage models.
3. Complete API methods as successful stubs/mocks, without business logic.
4. Authentication service and middleware.
5. Service layer for all API methods, still without database persistence.
6. PostgreSQL storage implementation with goose migrations.

## Execution rule

Do not implement the whole phase in one pass. Start with point 1 only after the user approves `docs/exec-plans/phase-1-be-full-mvp.md`.

After each point:

- run relevant checks;
- update the active execution plan;
- update `docs/STATUS.md`;
- record new decisions in `docs/DECISIONS.md`;
- report the result to the user and pause for a commit/review checkpoint when appropriate.

## Backend scope for this phase

The BE full MVP covers the generic backend domain:

- public auth API;
- user API protected by token middleware;
- Focus;
- Flow as root Focus API abstraction;
- Focus hierarchy;
- Goal;
- Goal-to-Focus links;
- generic Specification persistence infrastructure, but no job-search-specific public Specification variant yet;
- event writes for mutations where the design is ready;
- cursor pagination for every collection endpoint;
- PostgreSQL storage through interfaces;
- goose migrations with Up and Down.

## Backend non-goals for this phase

- real frontend product UI;
- job-search-specific Specification fields or UI;
- MCP;
- Redis, queues, Kafka, Kubernetes, microservices, GraphQL, event sourcing, CQRS, or other infrastructure outside the agreed scope;
- weakly typed public Specification CRUD just to expose JSONB early.

---

# BE full MVP point details

## 1. Models only, no logic

Create explicit backend model packages without behavior:

- internal/core models as the source for business services;
- API-facing handwritten request/response support models where needed around generated OpenAPI models;
- PostgreSQL storage row/input models local to the PostgreSQL implementation.

Rules:

- internal models must not import API or PostgreSQL packages;
- API mapping code may know internal models;
- storage implementation may know internal models;
- storage-specific models belong inside the PostgreSQL implementation unless there is a proven shared need;
- no validation, status transitions, hierarchy checks, database queries, or auth logic in this point.

## 2. Converters/builders

Add conversion functions between layers after models exist.

Rules:

- keep conversion functions explicit and boring;
- prefer small package-local functions or focused mapper packages near the boundary they serve;
- return errors when a conversion can fail;
- avoid reflection, magic generic mappers, global registries, or shared `util` packages;
- tests cover representative conversions, nil/optional fields, enums, timestamps, pagination cursors, and error cases.

Go style references for implementation decisions:

- `context.Context` is passed explicitly as the first argument to request-aware functions and is not stored in structs;
- context values are only for request-scoped data crossing APIs;
- context keys should use private project-defined types, not built-in string keys;
- package names should be meaningful and should not become catch-all `util`, `common`, or `types` dumping grounds.

References:

- https://pkg.go.dev/context
- https://go.dev/blog/context-and-structs
- https://go.googlesource.com/wiki/+/3c9c9e1adea9cc62389ba8adab07986c00060fe8/CodeReviewComments.md

## 3. API methods as successful stubs only

Define the complete backend OpenAPI contract for the generic MVP and wire handlers as successful mocks/stubs.

Split HTTP API into:

- public API: authentication/session endpoints;
- user API: all authenticated application endpoints.

Rules:

- no business logic in handlers;
- no database access;
- no real mutation behavior;
- user API middleware validates a token, extracts `userID`, and stores it in request context using a typed/private context key;
- handlers read `userID` from context through typed helper functions;
- every collection endpoint uses cursor pagination in the contract from the first stub;
- stubs return structurally valid successful responses so generated frontend clients can be exercised.

Public auth endpoints should include login, logout, current session/me, and token renewal. The exact endpoint names and token lifecycle must be decided in the OpenAPI design before implementation.

## 4. Auth service and middleware

Implement authentication as a real service, still designed for one configured user in v1.

Rules:

- environment contains the plaintext configured password, not a precomputed hash;
- configuration loading converts the plaintext password into an in-memory hash/credential representation and must not log the plaintext;
- expose an auth verifier abstraction so the configured-user implementation can later be replaced by database-backed passwords, Google login, or another provider;
- token signing and validation use secrets from environment configuration;
- middleware validates access tokens and places `userID` into request context;
- public auth supports login, logout, current session/me, token renewal, wrong username/password handling, expired-token handling, and invalid-token handling;
- tests cover success, failure, expiry, malformed tokens, middleware context propagation, and no secret leakage in logs/errors.

## 5. Service layer without database persistence

Create application services for all API methods.

Rules:

- services use internal models only;
- services expose methods that match use cases, not generic CRUD for every table;
- services receive storage interfaces but may use in-memory/mock implementations during this point;
- add comments at each intended storage interaction explaining what data is needed and why;
- do not put business logic in HTTP handlers;
- if several services are useful, split by actual behavior, not by table name alone.

## 6. PostgreSQL storage implementation

Add the real PostgreSQL implementation behind the service storage interfaces.

Rules:

- schema changes use goose migrations in `backend/migrations/`;
- every migration has Up and Down;
- use PostgreSQL 17;
- use pgx;
- PostgreSQL row/input structs stay local to the PostgreSQL implementation;
- use struct tags for PostgreSQL scanning/mapping where the chosen pgx approach supports them;
- storage interfaces return internal models only;
- business rules remain in services;
- integration tests use disposable Docker/CI PostgreSQL, never production.

---

# OLD roadmap - kept for history

The following roadmap is superseded as of 2026-09-08. It remains here to preserve planning history.

## OLD Phase 0 - Repository foundation

### Goal

Create a working monorepo foundation with reproducible code generation, local backend-and-PostgreSQL-in-Docker development, direct Node.js frontend development, CI, and deployment documentation.

### Includes

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
- password helper skeleton or implementation if required for auth bootstrap.

### Acceptance criteria

- repository builds;
- frontend starts directly with Node.js;
- backend Docker image builds;
- backend can start from `docker-compose.local.yml` with PostgreSQL in Docker;
- OpenAPI generation runs;
- generated files are committed;
- CI detects generated-code drift;
- README accurately explains local setup and deployment;
- integration tests use isolated disposable data.

## OLD Phase 1 - Core backend

### Goal

Implement the generic backend domain before any job-search-specific behavior.

### Includes

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

### Acceptance criteria

- core API behavior is contract-first;
- schema is created through goose;
- Up and Down migrations are present;
- subtree deletion is tested;
- Goal ownership/link delete semantics are tested;
- hierarchy cycle prevention is tested;
- collection endpoints are cursor-paginated;
- persistence integration tests run against disposable PostgreSQL in CI;
- backend Docker build succeeds.

## OLD Phase 2 - Generic UI

### Goal

Create the first usable product UI on top of the generic API.

### Includes

- login page;
- authenticated app shell;
- generated API client;
- Flow list;
- Flow cards;
- create Flow;
- logout;
- loading/error states.

## OLD Phase 3 - Focus page

### Goal

Allow navigation through the Focus hierarchy.

### Includes

- Focus details;
- parent path/breadcrumbs;
- child Focus list;
- Goal list;
- base layout for future Specification blocks;
- navigation between hierarchy levels.

## OLD Phase 4 - Editing

### Goal

Make the generic system fully usable.

### Includes

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

## OLD Phase 5 - First typed Specification

### Goal

Add the first real domain-specific capability: job-search/job-position tracking.

### Rule

Before coding, define the exact data model with the user. Do not infer fields from old discussions and silently implement them.

## OLD Phase 6 - Activity

Expose and display the event data accumulated by earlier phases.

## OLD Phase 7 - Observability

Make production behavior diagnosable without adding unnecessary infrastructure.

## OLD Phase 8 - MCP

Expose FocusFlow to an agent without duplicating domain logic.
