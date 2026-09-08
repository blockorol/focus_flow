package model

import "time"

type GoalType string

const (
	GoalTypePrimary   GoalType = "primary"
	GoalTypeSecondary GoalType = "secondary"
)

type GoalProgress struct {
	LinkedCount   int
	TerminalCount int
	DoneCount     int
	StatusCounts  map[FocusStatus]int
}

type Goal struct {
	ID             GoalID
	FocusObjectID  FocusID
	Type           GoalType
	Description    string
	StatusOverride *FocusStatus
	Progress       GoalProgress
	CreatedAt      time.Time
	UpdatedAt      time.Time
	FinishedAt     *time.Time
}

type CreateGoal struct {
	FocusObjectID  FocusID
	Type           GoalType
	Description    string
	StatusOverride *FocusStatus
}

type UpdateGoal struct {
	ID             GoalID
	Type           *GoalType
	Description    *string
	StatusOverride NullableUpdate[FocusStatus]
}

type GoalFocusLink struct {
	GoalID        GoalID
	FocusObjectID FocusID
}
