package model

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func TestFocusFromInternalMapsAggregate(t *testing.T) {
	parentID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	childID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000101"))
	goalID := core.GoalID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000200"))
	now := time.Date(2026, 9, 8, 12, 0, 0, 0, time.UTC)
	done := core.FocusStatusDone

	got := FocusFromInternal(core.Focus{
		ID:        parentID,
		Name:      "Root",
		Status:    core.FocusStatusActive,
		Tags:      []string{"mvp"},
		CreatedAt: now,
		UpdatedAt: now,
		Goals: []core.Goal{{
			ID:             goalID,
			OwnerFocusID:   parentID,
			Type:           core.GoalTypePrimary,
			Description:    "Finish children",
			StatusOverride: &done,
			LinkedFocusIDs: []core.FocusID{childID},
			Progress:       core.GoalProgress{LinkedCount: 1, TerminalCount: 1, DoneCount: 1, StatusCounts: map[core.FocusStatus]int{core.FocusStatusDone: 1}},
			CreatedAt:      now,
			UpdatedAt:      now,
		}},
		Children: []core.Focus{{ID: childID, ParentID: &parentID, Name: "Child", Status: core.FocusStatusPlanned, CreatedAt: now, UpdatedAt: now}},
	})

	if got.Id != generated.UUID(parentID) || got.Name != "Root" || got.Status != generated.FocusStatusActive {
		t.Fatalf("focus was not mapped: %#v", got)
	}
	if len(got.Goals) != 1 || got.Goals[0].Id != generated.UUID(goalID) || got.Goals[0].Progress.DoneCount != 1 {
		t.Fatalf("goals were not mapped: %#v", got.Goals)
	}
	if len(got.Children) != 1 || got.Children[0].ParentId == nil || *got.Children[0].ParentId != generated.UUID(parentID) {
		t.Fatalf("children were not mapped: %#v", got.Children)
	}
}

func TestUpdateFocusToInternalMapsPatchAndClearFields(t *testing.T) {
	id := generated.UUID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	parentID := generated.UUID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000101"))
	name := "Updated"
	description := "temporary"
	clearFields := []generated.FocusClearField{generated.ParentId, generated.Description}

	got := UpdateFocusToInternal(id, generated.UpdateFocusRequest{
		ParentId:    &parentID,
		Name:        &name,
		Description: &description,
		ClearFields: &clearFields,
	})

	if got.ID != core.FocusID(id) || got.Name == nil || *got.Name != "Updated" {
		t.Fatalf("basic patch fields were not mapped: %#v", got)
	}
	if !got.ParentID.Set || got.ParentID.Value != nil {
		t.Fatalf("parent clear field should win over parent value: %#v", got.ParentID)
	}
	if !got.Description.Set || got.Description.Value != nil {
		t.Fatalf("description clear field should win over description value: %#v", got.Description)
	}
}

func TestUpdateGoalToInternalMapsClearStatusOverride(t *testing.T) {
	id := generated.UUID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000200"))
	status := generated.FocusStatusDone
	clearFields := []generated.GoalClearField{generated.StatusOverride}

	got := UpdateGoalToInternal(id, generated.UpdateGoalRequest{StatusOverride: &status, ClearFields: &clearFields})

	if got.ID != core.GoalID(id) {
		t.Fatalf("goal id was not mapped: %#v", got)
	}
	if !got.StatusOverride.Set || got.StatusOverride.Value != nil {
		t.Fatalf("status override clear field should win over status value: %#v", got.StatusOverride)
	}
}

func TestQueryFromParamsMapsIncludeAndDepth(t *testing.T) {
	id := generated.UUID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	include := generated.Include("goals,children")
	depth := generated.Depth(3)

	got, err := QueryFromParams(id, &include, &depth)
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != core.FocusID(id) || !got.IncludeGoals || got.DescendantDepth != 3 {
		t.Fatalf("query params were not mapped: %#v", got)
	}
}

func TestQueryFromParamsRejectsUnsupportedInclude(t *testing.T) {
	id := generated.UUID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	include := generated.Include("specifications")

	_, err := QueryFromParams(id, &include, nil)
	if err == nil {
		t.Fatal("expected unsupported include error")
	}
	var unsupported UnsupportedIncludeError
	if !errors.As(err, &unsupported) {
		t.Fatalf("unexpected error type: %T", err)
	}
}

func TestUserIDContextHelpers(t *testing.T) {
	id := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	ctx := ContextWithUserID(context.Background(), id)

	got, ok := UserIDFromContext(ctx)
	if !ok || got != id {
		t.Fatalf("user id was not read from context: %v %v", got, ok)
	}
	if _, ok := UserIDFromContext(context.Background()); ok {
		t.Fatal("empty context should not contain a user id")
	}
}
