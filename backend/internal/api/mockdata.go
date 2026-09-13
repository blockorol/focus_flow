package api

import (
	"time"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/google/uuid"
)

var (
	mockUserID       = core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	mockRootFocusID  = core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	mockChildFocusID = core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000101"))
	mockGoalID       = core.GoalID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000200"))
	mockNow          = time.Date(2026, 9, 8, 12, 0, 0, 0, time.UTC)
)

func mockUser() core.User {
	return core.User{ID: mockUserID, Username: "local"}
}

func mockSession() core.Session {
	return core.Session{User: mockUser(), ExpiresAt: mockNow.Add(2 * time.Hour)}
}

func mockGoal() core.Goal {
	return core.Goal{
		ID:             mockGoalID,
		OwnerFocusID:   mockRootFocusID,
		Type:           core.GoalTypePrimary,
		Description:    "Mock goal",
		LinkedFocusIDs: []core.FocusID{mockChildFocusID},
		Progress: core.GoalProgress{
			LinkedCount:   1,
			TerminalCount: 0,
			DoneCount:     0,
			StatusCounts:  map[core.FocusStatus]int{core.FocusStatusPlanned: 1},
		},
		CreatedAt: mockNow,
		UpdatedAt: mockNow,
	}
}

func mockFocus() core.Focus {
	return core.Focus{
		ID:        mockRootFocusID,
		Name:      "Mock flow",
		Status:    core.FocusStatusActive,
		Tags:      []string{"mock"},
		Goals:     []core.Goal{mockGoal()},
		Children:  []core.Focus{mockChildFocus()},
		CreatedAt: mockNow,
		UpdatedAt: mockNow,
	}
}

func mockChildFocus() core.Focus {
	parentID := mockRootFocusID
	return core.Focus{
		ID:        mockChildFocusID,
		ParentID:  &parentID,
		Name:      "Mock child focus",
		Status:    core.FocusStatusPlanned,
		Tags:      []string{"mock"},
		CreatedAt: mockNow,
		UpdatedAt: mockNow,
	}
}

func mockFocusPage() core.Page[core.Focus] {
	return core.Page[core.Focus]{Items: []core.Focus{mockFocus()}, Count: 1, HasMore: false}
}

func mockGoalPage() core.Page[core.Goal] {
	return core.Page[core.Goal]{Items: []core.Goal{mockGoal()}, Count: 1, HasMore: false}
}
