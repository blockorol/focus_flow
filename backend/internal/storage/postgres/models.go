package postgres

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// PostgreSQL row models are local to this package.
//
// They mirror database rows and scanning needs only. Do not pass these structs
// to services, API handlers, or frontend-facing code. Convert them to and from
// internal model package values at the PostgreSQL storage boundary.
type focusObjectRow struct {
	ID          uuid.UUID  `db:"id"`
	ParentID    *uuid.UUID `db:"parent_id"`
	Name        string     `db:"name"`
	Status      string     `db:"status"`
	Tags        []string   `db:"tags"`
	Description *string    `db:"description"`
	Feedback    *string    `db:"feedback"`
	Color       *string    `db:"color"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at"`
	FinishedAt  *time.Time `db:"finished_at"`
}

type focusGoalRow struct {
	ID             uuid.UUID  `db:"id"`
	FocusObjectID  uuid.UUID  `db:"focus_object_id"`
	Type           string     `db:"type"`
	Description    string     `db:"description"`
	StatusOverride *string    `db:"status_override"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	FinishedAt     *time.Time `db:"finished_at"`
}

type focusGoalLinkRow struct {
	GoalID        uuid.UUID `db:"goal_id"`
	FocusObjectID uuid.UUID `db:"focus_object_id"`
}

type focusSpecificationRow struct {
	ID            uuid.UUID       `db:"id"`
	FocusObjectID uuid.UUID       `db:"focus_object_id"`
	Type          string          `db:"type"`
	SchemaVersion int             `db:"schema_version"`
	Data          json.RawMessage `db:"data"`
	CreatedAt     time.Time       `db:"created_at"`
	UpdatedAt     time.Time       `db:"updated_at"`
}

type focusEventRow struct {
	ID            uuid.UUID       `db:"id"`
	FocusObjectID *uuid.UUID      `db:"focus_object_id"`
	GoalID        *uuid.UUID      `db:"goal_id"`
	Type          string          `db:"type"`
	Source        string          `db:"source"`
	Data          json.RawMessage `db:"data"`
	CreatedAt     time.Time       `db:"created_at"`
}
