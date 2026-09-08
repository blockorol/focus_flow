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
	OwnerFocusID   FocusID
	Type           GoalType
	Description    string
	StatusOverride *FocusStatus
	LinkedFocusIDs []FocusID
	Progress       GoalProgress
	CreatedAt      time.Time
	UpdatedAt      time.Time
	FinishedAt     *time.Time
}

type CreateGoal struct {
	OwnerFocusID   FocusID
	Type           GoalType
	Description    string
	StatusOverride *FocusStatus
	LinkedFocusIDs []FocusID
}

type UpdateGoal struct {
	ID             GoalID
	Type           *GoalType
	Description    *string
	StatusOverride NullableUpdate[FocusStatus]
	LinkedFocusIDs *[]FocusID
}

type GoalFocusLink struct {
	GoalID  GoalID
	FocusID FocusID
}
