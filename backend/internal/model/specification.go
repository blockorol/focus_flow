package model

import (
	"encoding/json"
	"time"
)

type Specification struct {
	ID            SpecificationID
	FocusObjectID FocusID
	Type          string
	SchemaVersion int
	Data          json.RawMessage
	CreatedAt     time.Time
	UpdatedAt     time.Time
}
