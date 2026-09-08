# Execution Plans

Codex creates one active plan per implementation phase.

Naming:

```text
phase-0-foundation.md
phase-1-core-backend.md
phase-2-generic-ui.md
...
```

A plan must be created/reviewed with the user before implementation starts.

Use this structure:

```markdown
# Phase N — Name

## Goal

## Non-goals

## Assumptions

## Open questions

## Planned contract changes

## Planned database changes

## Steps

- [ ] 1. Small coherent step
  - Files/packages:
  - Validation:
- [ ] 2. Small coherent step
  - Files/packages:
  - Validation:

## Phase acceptance criteria

## Rollback/recovery notes

## Notes discovered during implementation
```

Update checkboxes while working.

Do not use the execution plan as a replacement for `SCOPE.md` or `docs/ARCHITECTURE.md`.
