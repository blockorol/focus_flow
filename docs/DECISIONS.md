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

## D-016 — Authentication

**Decision:** initial auth uses login/password from environment configuration.

No users table.

Password is stored as Argon2id hash.

Provide a stdin-based hash-generation helper.

Backend issues a signed token; browser transport uses HttpOnly cookie.

---

## D-017 — Local development

**Decision:**

- frontend runs directly with Node.js;
- backend runs in Docker;
- no local PostgreSQL;
- local backend connects to Railway PostgreSQL externally;
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
