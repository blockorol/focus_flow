# FocusFlow — Architecture

## 1. Architecture goal

FocusFlow should be small enough for a one-user product while still demonstrating clear backend boundaries and allowing future clients such as MCP or mobile apps.

The architecture is intentionally modular but not enterprise-heavy.

---

## 2. System topology

### Local

```text
Next.js dev server
localhost:3000
        |
        | HTTP + credentials
        v
Go API in Docker
localhost:8080
        |
        | PostgreSQL connection
        v
Railway PostgreSQL public endpoint
```

No local PostgreSQL service.

### Production

```text
Vercel frontend
       |
       | HTTPS
       v
Railway Go API
       |
       | Railway private network
       v
Railway PostgreSQL
```

Railway builds the backend from `backend/Dockerfile`.

Docker Compose is not the production deployment unit.

---

## 3. Monorepo

High-level target:

```text
/
├── AGENTS.md
├── SCOPE.md
├── README.md
├── contracts/
│   └── openapi.yaml
├── backend/
│   ├── cmd/
│   │   ├── api/
│   │   └── hash-password/
│   ├── internal/
│   │   ├── api/
│   │   ├── model/
│   │   ├── service/
│   │   ├── storage/
│   │   │   └── postgres/
│   │   └── specification/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
└── docs/
    ├── ARCHITECTURE.md
    ├── IMPLEMENTATION_PLAN.md
    ├── STATUS.md
    ├── DECISIONS.md
    └── exec-plans/
```

The exact package split can evolve when the code makes a better boundary obvious.

Do not create packages just to mirror every noun in the system.

---

## 4. Backend layers

Required conceptual model:

```text
Transport / OpenAPI
       |
       | mapping
       v
Application / core
       |
       | interface
       v
Storage abstraction
       |
       | implementation
       v
PostgreSQL
```

### API layer

Responsibilities:

- HTTP routing;
- authentication middleware;
- request parsing;
- OpenAPI-generated types/interfaces;
- mapping API models to core models;
- mapping application errors to HTTP responses.

Must not contain business rules.

### Application/core layer

Responsibilities:

- Focus hierarchy rules;
- status transitions and timestamps;
- Goal derivation;
- delete semantics;
- Specification validation orchestration;
- Event creation;
- transaction-level workflows.

This is the layer future MCP calls.

### Storage interfaces

Storage boundaries are represented with Go interfaces.

Example shape:

```go
type FocusStorage interface {
    Create(ctx context.Context, focus model.Focus) (model.Focus, error)
    Get(ctx context.Context, id uuid.UUID) (model.Focus, error)
    Update(ctx context.Context, focus model.Focus) (model.Focus, error)
    DeleteSubtree(ctx context.Context, id uuid.UUID) error
    ListChildren(ctx context.Context, parentID uuid.UUID, page PageRequest) (Page[model.Focus], error)
}
```

The exact methods must be designed around actual use cases, not generic CRUD completeness.

### PostgreSQL implementation

Responsibilities:

- SQL;
- pgx;
- transactions supplied/controlled according to application workflows;
- DB-specific structs if needed;
- mapping DB rows to core models;
- recursive CTEs;
- cursor query implementation.

PostgreSQL-specific types must not leak into API models.

---

## 5. Model separation

Do not reuse one struct across all layers.

Expected pattern:

```text
generated API model
      ↓
core/internal model
      ↓
PostgreSQL row/storage model
```

A fourth model is allowed when a subsystem has its own meaningful representation, for example:

```text
JobPositionSpecificationV1
```

Do not add a fourth model by default.

---

## 6. Flows

Flow is a query/business concept:

```text
Focus where parent_id IS NULL
```

No separate table.

`/v1/flows` may later gain Flow-specific aggregation/metrics without changing persistence.

---

## 7. Specifications

### Persistence

Generic storage:

```text
type
schema_version
data JSONB
```

### API

Strongly typed.

Supported variants live in one discriminated OpenAPI union.

Conceptually:

```yaml
FocusSpecification:
  oneOf:
    - $ref: '#/components/schemas/JobPositionSpecification'
  discriminator:
    propertyName: type
    mapping:
      jobPosition: '#/components/schemas/JobPositionSpecification'
```

A variant's `data` property is a typed schema.

### Backend

For each Specification variant:

```text
OpenAPI typed model
        ↓
typed internal specification model
        ↓
validation/business behavior
        ↓
JSONB storage mapping
```

Do not decode a known Specification into `map[string]any` in application code.

### Frontend

The generated union drives exhaustive rendering/editing.

A new Specification variant must update OpenAPI, backend, and frontend together.

This is a monorepo contract, not an extensibility protocol for unknown third-party clients.

---

## 8. OpenAPI workflow

`contracts/openapi.yaml` is source of truth.

Generated code is committed.

Typical workflow:

```text
edit OpenAPI
    ↓
generate Go
    ↓
generate TypeScript
    ↓
implement mappings/business behavior
    ↓
tests
    ↓
CI regenerates and checks for diff
```

Never hand-edit generated files.

---

## 9. Pagination

All collections use opaque cursor pagination.

Storage queries must use stable deterministic ordering.

Prefer keyset pagination.

Cursor encoding is an implementation detail and must not become a public client contract.

---

## 10. Database migrations

Goose owns schema evolution.

Every normal migration has Up and Down sections.

Production:

```text
Railway build
   ↓
goose up (pre-deploy)
   ↓
new backend deployment
```

Rollback of application code does not automatically imply destructive DB rollback.

A human explicitly runs `goose down`/`down-to` when a database rollback is required and safe.

---

## 11. Authentication and browser topology

The application uses username/password login backed by environment configuration.

Password is stored as Argon2id hash.

Backend issues a signed token in an HttpOnly cookie.

Because production frontend and backend may initially live on different Vercel/Railway sites:

- CORS must explicitly allow the frontend origin;
- credentialed requests must be enabled;
- production cookies need secure settings compatible with cross-site deployment.

If browser third-party-cookie policies become a problem, use custom sibling domains such as:

```text
app.example.com
api.example.com
```

Do not replace the architecture merely to avoid this deployment detail.

---

## 12. Local CORS

Do not truly "turn off browser CORS".

Instead, local configuration should make it invisible to the developer:

```text
CORS_ALLOWED_ORIGINS=http://localhost:3000
COOKIE_SECURE=false
```

`docker-compose.local.yml` should provide the standard local values automatically.

---

## 13. Docker

Backend uses a multi-stage build.

The runtime image should be thin.

It must contain what Railway needs for:

- the API binary;
- goose migration execution;
- migration files;
- required CA certificates/timezone data if needed.

Do not install build tools in the runtime stage.

---

## 14. CI database

No local developer DB does not mean no DB tests.

GitHub Actions should use a disposable PostgreSQL service for persistence integration tests.

Tests must never target the production database.

---

## 15. Future adapters

The dependency direction must allow:

```text
HTTP ─┐
      ├──> application services ──> storage
MCP ──┘
```

A future mobile client uses HTTP and does not change core business logic.

---

## 16. Intentional non-architecture

Do not add these merely to make the repository look more sophisticated:

- Redis;
- Kafka;
- queues;
- Kubernetes;
- microservices;
- CQRS;
- event sourcing;
- service mesh;
- GraphQL.

The project should demonstrate choosing the smallest architecture that satisfies the current product.
