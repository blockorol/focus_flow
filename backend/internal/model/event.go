package model

import (
	"encoding/json"
	"time"
)

type EventSource string

const (
	EventSourceWeb    EventSource = "web"
	EventSourceAPI    EventSource = "api"
	EventSourceSystem EventSource = "system"
)

type FocusEvent struct {
	ID            EventID
	FocusObjectID *FocusID
	GoalID        *GoalID
	Type          string
	Source        EventSource
	Data          json.RawMessage
	CreatedAt     time.Time
}
