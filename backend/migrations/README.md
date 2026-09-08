# Database Migrations

Application schema migrations live in this directory and are executed with goose.

Phase 0 intentionally ships no application SQL migrations. Phase 1 introduces the first schema migration for the agreed FocusFlow tables.

Every SQL migration must include both sections:

```sql
-- +goose Up

-- +goose Down
```

Local and production execution use the same migration files. Production runs `/app/bin/migrate up` as the Railway pre-deploy command.
