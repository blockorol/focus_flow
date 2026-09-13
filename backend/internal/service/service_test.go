package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func TestFocusServiceDelegatesUsingInternalModels(t *testing.T) {
	store := &recordingFocusStore{focus: core.Focus{ID: uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"), Name: "Stored"}}
	service := NewFocusService(store)
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	parentID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000101"))

	focus, err := service.CreateFlow(context.Background(), userID, core.CreateFocus{ParentID: &parentID, Name: "Root"})
	if err != nil {
		t.Fatal(err)
	}
	if focus.Name != "Stored" {
		t.Fatalf("unexpected focus: %#v", focus)
	}
	if store.createFlowInput.ParentID != nil {
		t.Fatal("CreateFlow must clear ParentID before calling storage")
	}
	if store.userID != userID {
		t.Fatalf("user id was not passed to storage: %s", store.userID)
	}
}

func TestGoalServiceDelegatesUsingInternalModels(t *testing.T) {
	goalID := core.GoalID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000200"))
	focusID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	store := &recordingGoalStore{goal: core.Goal{ID: goalID, OwnerFocusID: focusID, Type: core.GoalTypePrimary}}
	service := NewGoalService(store)

	goal, err := service.LinkGoalFocus(context.Background(), userID, core.GoalFocusLink{GoalID: goalID, FocusID: focusID})
	if err != nil {
		t.Fatal(err)
	}
	if goal.ID != goalID || store.link.GoalID != goalID || store.link.FocusID != focusID || store.userID != userID {
		t.Fatalf("goal service did not delegate link correctly: goal=%#v store=%#v", goal, store)
	}
}

type recordingFocusStore struct {
	userID          core.UserID
	createFlowInput core.CreateFocus
	focus           core.Focus
}

func (store *recordingFocusStore) ListFlows(context.Context, core.UserID, core.PageRequest, core.FocusQuery) (core.Page[core.Focus], error) {
	return core.Page[core.Focus]{Items: []core.Focus{store.focus}, Count: 1}, nil
}

func (store *recordingFocusStore) CreateFlow(_ context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error) {
	store.userID = userID
	store.createFlowInput = input
	return store.focus, nil
}

func (store *recordingFocusStore) CreateFocus(context.Context, core.UserID, core.CreateFocus) (core.Focus, error) {
	return store.focus, nil
}

func (store *recordingFocusStore) GetFocus(context.Context, core.UserID, core.FocusQuery) (core.Focus, error) {
	return store.focus, nil
}

func (store *recordingFocusStore) UpdateFocus(context.Context, core.UserID, core.UpdateFocus) (core.Focus, error) {
	return store.focus, nil
}

func (store *recordingFocusStore) DeleteFocus(context.Context, core.UserID, core.FocusID) error {
	return nil
}

func (store *recordingFocusStore) ListFocusChildren(context.Context, core.UserID, core.FocusID, core.PageRequest, core.FocusQuery) (core.Page[core.Focus], error) {
	return core.Page[core.Focus]{Items: []core.Focus{store.focus}, Count: 1}, nil
}

type recordingGoalStore struct {
	userID core.UserID
	link   core.GoalFocusLink
	goal   core.Goal
}

func (store *recordingGoalStore) ListFocusGoals(context.Context, core.UserID, core.FocusID, core.PageRequest) (core.Page[core.Goal], error) {
	return core.Page[core.Goal]{Items: []core.Goal{store.goal}, Count: 1}, nil
}

func (store *recordingGoalStore) CreateGoal(context.Context, core.UserID, core.CreateGoal) (core.Goal, error) {
	return store.goal, nil
}

func (store *recordingGoalStore) GetGoal(context.Context, core.UserID, core.GoalID) (core.Goal, error) {
	return store.goal, nil
}

func (store *recordingGoalStore) UpdateGoal(context.Context, core.UserID, core.UpdateGoal) (core.Goal, error) {
	return store.goal, nil
}

func (store *recordingGoalStore) DeleteGoal(context.Context, core.UserID, core.GoalID) error {
	return nil
}

func (store *recordingGoalStore) LinkGoalFocus(_ context.Context, userID core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	store.userID = userID
	store.link = link
	return store.goal, nil
}

func (store *recordingGoalStore) UnlinkGoalFocus(context.Context, core.UserID, core.GoalFocusLink) (core.Goal, error) {
	return store.goal, nil
}
