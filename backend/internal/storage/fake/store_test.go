package fake

import (
	"context"
	"testing"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func TestStoreSupportsFocusLifecycleWithoutPersistence(t *testing.T) {
	store := New()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	flow, err := store.CreateFlow(context.Background(), userID, core.CreateFocus{Name: "Flow"})
	if err != nil {
		t.Fatal(err)
	}
	child, err := store.CreateFocus(context.Background(), userID, core.CreateFocus{ParentID: &flow.ID, Name: "Child"})
	if err != nil {
		t.Fatal(err)
	}

	query := core.FocusQuery{ID: flow.ID, DescendantDepth: 1}
	got, err := store.GetFocus(context.Background(), userID, query)
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Children) != 1 || got.Children[0].ID != child.ID {
		t.Fatalf("children were not attached: %#v", got.Children)
	}

	name := "Updated flow"
	updated, err := store.UpdateFocus(context.Background(), userID, core.UpdateFocus{ID: flow.ID, Name: &name})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Name != name {
		t.Fatalf("focus was not updated: %#v", updated)
	}

	if err := store.DeleteFocus(context.Background(), userID, flow.ID); err != nil {
		t.Fatal(err)
	}
	children, err := store.ListFocusChildren(context.Background(), userID, flow.ID, core.PageRequest{}, core.FocusQuery{})
	if err == nil || children.Count != 0 {
		t.Fatalf("deleted focus should not be readable: page=%#v err=%v", children, err)
	}
}

func TestStoreSupportsGoalLinksAndProgress(t *testing.T) {
	store := New()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	flow, err := store.CreateFlow(context.Background(), userID, core.CreateFocus{Name: "Flow"})
	if err != nil {
		t.Fatal(err)
	}
	status := core.FocusStatusDone
	child, err := store.CreateFocus(context.Background(), userID, core.CreateFocus{ParentID: &flow.ID, Name: "Child", Status: &status})
	if err != nil {
		t.Fatal(err)
	}
	goal, err := store.CreateGoal(context.Background(), userID, core.CreateGoal{OwnerFocusID: flow.ID, Type: core.GoalTypePrimary, Description: "Done child"})
	if err != nil {
		t.Fatal(err)
	}
	goal, err = store.LinkGoalFocus(context.Background(), userID, core.GoalFocusLink{GoalID: goal.ID, FocusID: child.ID})
	if err != nil {
		t.Fatal(err)
	}
	if goal.Progress.LinkedCount != 1 || goal.Progress.DoneCount != 1 || goal.Progress.TerminalCount != 1 {
		t.Fatalf("progress was not computed: %#v", goal.Progress)
	}
	goal, err = store.UnlinkGoalFocus(context.Background(), userID, core.GoalFocusLink{GoalID: goal.ID, FocusID: child.ID})
	if err != nil {
		t.Fatal(err)
	}
	if goal.Progress.LinkedCount != 0 {
		t.Fatalf("goal was not unlinked: %#v", goal.Progress)
	}
}

func TestStoreUsesCursorPagination(t *testing.T) {
	store := New()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	if _, err := store.CreateFlow(context.Background(), userID, core.CreateFocus{Name: "Second flow"}); err != nil {
		t.Fatal(err)
	}
	first, err := store.ListFlows(context.Background(), userID, core.PageRequest{Limit: 1}, core.FocusQuery{})
	if err != nil {
		t.Fatal(err)
	}
	if first.Count != 1 || !first.HasMore || first.NextCursor == nil {
		t.Fatalf("expected first page with cursor: %#v", first)
	}
	second, err := store.ListFlows(context.Background(), userID, core.PageRequest{Limit: 1, Cursor: first.NextCursor}, core.FocusQuery{})
	if err != nil {
		t.Fatal(err)
	}
	if second.Count != 1 || second.Items[0].ID == first.Items[0].ID {
		t.Fatalf("expected second page after cursor: first=%#v second=%#v", first, second)
	}
}
