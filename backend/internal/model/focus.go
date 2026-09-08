package model

import "time"

type FocusStatus string

const (
	FocusStatusIdea      FocusStatus = "idea"
	FocusStatusPlanned   FocusStatus = "planned"
	FocusStatusActive    FocusStatus = "active"
	FocusStatusPaused    FocusStatus = "paused"
	FocusStatusWaiting   FocusStatus = "waiting"
	FocusStatusDone      FocusStatus = "done"
	FocusStatusCancelled FocusStatus = "cancelled"
)

type Focus struct {
	ID          FocusID
	ParentID    *FocusID
	Name        string
	Status      FocusStatus
	Tags        []string
	Description *string
	Feedback    *string
	Color       *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	FinishedAt  *time.Time
}

type CreateFocus struct {
	ParentID    *FocusID
	Name        string
	Status      *FocusStatus
	Tags        []string
	Description *string
	Feedback    *string
	Color       *string
}

type UpdateFocus struct {
	ID          FocusID
	ParentID    NullableUpdate[FocusID]
	Name        *string
	Status      *FocusStatus
	Tags        *[]string
	Description NullableUpdate[string]
	Feedback    NullableUpdate[string]
	Color       NullableUpdate[string]
}
