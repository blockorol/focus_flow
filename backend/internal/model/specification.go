package model

import (
	"encoding/json"
	"time"
)

// Specification is the internal generic record for stored specifications.
//
// Its Data field represents raw persisted JSON for infrastructure-level work.
// Known public specification variants must be decoded into explicit typed
// internal models before they are returned through the API. This model is not a
// frontend/API response shape.
type Specification struct {
	ID            SpecificationID
	FocusID       FocusID
	Type          string
	SchemaVersion int
	Data          json.RawMessage
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
