package storage

import (
	"context"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

type FocusStore interface {
	// PostgreSQL will read root focus_object rows for the user, apply cursor ordering, and attach requested aggregates.
	ListFlows(ctx context.Context, userID core.UserID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error)
	// PostgreSQL will insert one focus_object row with a nil parent_id.
	CreateFlow(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error)
	// PostgreSQL will insert one focus_object row after validating the requested parent relationship.
	CreateFocus(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error)
	// PostgreSQL will read one focus_object row and attach requested child/goal/specification data.
	GetFocus(ctx context.Context, userID core.UserID, query core.FocusQuery) (core.Focus, error)
	// PostgreSQL will update one focus_object row and return the resulting aggregate.
	UpdateFocus(ctx context.Context, userID core.UserID, input core.UpdateFocus) (core.Focus, error)
	// PostgreSQL will delete the target focus_object subtree through relational cascade/recursive selection.
	DeleteFocus(ctx context.Context, userID core.UserID, id core.FocusID) error
	// PostgreSQL will read direct child focus_object rows for the parent and apply cursor ordering.
	ListFocusChildren(ctx context.Context, userID core.UserID, parentID core.FocusID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error)
}

type GoalStore interface {
	// PostgreSQL will read focus_goal rows owned by the focus and compute progress from linked focus_object statuses.
	ListFocusGoals(ctx context.Context, userID core.UserID, focusID core.FocusID, page core.PageRequest) (core.Page[core.Goal], error)
	// PostgreSQL will insert one focus_goal row and optional focus_goal_link rows.
	CreateGoal(ctx context.Context, userID core.UserID, input core.CreateGoal) (core.Goal, error)
	// PostgreSQL will read one focus_goal row and compute progress from linked focus_object statuses.
	GetGoal(ctx context.Context, userID core.UserID, id core.GoalID) (core.Goal, error)
	// PostgreSQL will update one focus_goal row and replace link rows when requested.
	UpdateGoal(ctx context.Context, userID core.UserID, input core.UpdateGoal) (core.Goal, error)
	// PostgreSQL will delete one focus_goal row and cascade its focus_goal_link rows.
	DeleteGoal(ctx context.Context, userID core.UserID, id core.GoalID) error
	// PostgreSQL will insert one focus_goal_link row after checking both sides are visible to the user.
	LinkGoalFocus(ctx context.Context, userID core.UserID, link core.GoalFocusLink) (core.Goal, error)
	// PostgreSQL will delete one focus_goal_link row and return the updated goal aggregate.
	UnlinkGoalFocus(ctx context.Context, userID core.UserID, link core.GoalFocusLink) (core.Goal, error)
}
