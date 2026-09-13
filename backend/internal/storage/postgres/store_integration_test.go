package postgres

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

func TestIntegrationFocusLifecycleAndHierarchy(t *testing.T) {
	store := openIntegrationStore(t)
	truncateIntegrationTables(t, store)
	ctx := context.Background()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))

	flow, err := store.CreateFlow(ctx, userID, core.CreateFocus{Name: "Root flow", Tags: []string{"db"}})
	if err != nil {
		t.Fatal(err)
	}
	child, err := store.CreateFocus(ctx, userID, core.CreateFocus{ParentID: &flow.ID, Name: "Child focus"})
	if err != nil {
		t.Fatal(err)
	}
	status := core.FocusStatusDone
	updated, err := store.UpdateFocus(ctx, userID, core.UpdateFocus{ID: child.ID, Status: &status})
	if err != nil {
		t.Fatal(err)
	}
	if updated.FinishedAt == nil {
		t.Fatal("terminal status must set finished_at")
	}

	got, err := store.GetFocus(ctx, userID, core.FocusQuery{ID: flow.ID, DescendantDepth: 1})
	if err != nil {
		t.Fatal(err)
	}
	if len(got.Children) != 1 || got.Children[0].ID != child.ID {
		t.Fatalf("child aggregate was not loaded: %#v", got.Children)
	}

	if _, err := store.UpdateFocus(ctx, userID, core.UpdateFocus{ID: flow.ID, ParentID: core.NullableUpdate[core.FocusID]{Set: true, Value: &child.ID}}); err != storage.ErrInvalidHierarchy {
		t.Fatalf("expected hierarchy cycle rejection, got %v", err)
	}

	if err := store.DeleteFocus(ctx, userID, flow.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := store.GetFocus(ctx, userID, core.FocusQuery{ID: child.ID}); err != storage.ErrNotFound {
		t.Fatalf("child should be deleted with subtree, got %v", err)
	}
}

func TestIntegrationGoalLinksAndProgress(t *testing.T) {
	store := openIntegrationStore(t)
	truncateIntegrationTables(t, store)
	ctx := context.Background()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))

	flow, err := store.CreateFlow(ctx, userID, core.CreateFocus{Name: "Root flow"})
	if err != nil {
		t.Fatal(err)
	}
	done := core.FocusStatusDone
	child, err := store.CreateFocus(ctx, userID, core.CreateFocus{ParentID: &flow.ID, Name: "Done child", Status: &done})
	if err != nil {
		t.Fatal(err)
	}
	goal, err := store.CreateGoal(ctx, userID, core.CreateGoal{OwnerFocusID: flow.ID, Type: core.GoalTypePrimary, Description: "Finish child"})
	if err != nil {
		t.Fatal(err)
	}
	goal, err = store.LinkGoalFocus(ctx, userID, core.GoalFocusLink{GoalID: goal.ID, FocusID: child.ID})
	if err != nil {
		t.Fatal(err)
	}
	if goal.Progress.LinkedCount != 1 || goal.Progress.TerminalCount != 1 || goal.Progress.DoneCount != 1 {
		t.Fatalf("goal progress was not computed: %#v", goal.Progress)
	}

	listed, err := store.ListFocusGoals(ctx, userID, flow.ID, core.PageRequest{Limit: 1})
	if err != nil {
		t.Fatal(err)
	}
	if listed.Count != 1 || listed.Items[0].ID != goal.ID {
		t.Fatalf("goal page mismatch: %#v", listed)
	}

	goal, err = store.UnlinkGoalFocus(ctx, userID, core.GoalFocusLink{GoalID: goal.ID, FocusID: child.ID})
	if err != nil {
		t.Fatal(err)
	}
	if goal.Progress.LinkedCount != 0 {
		t.Fatalf("goal link was not removed: %#v", goal.Progress)
	}
}

func TestIntegrationCursorPagination(t *testing.T) {
	store := openIntegrationStore(t)
	truncateIntegrationTables(t, store)
	ctx := context.Background()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))
	for _, name := range []string{"A", "B"} {
		if _, err := store.CreateFlow(ctx, userID, core.CreateFocus{Name: name}); err != nil {
			t.Fatal(err)
		}
	}
	first, err := store.ListFlows(ctx, userID, core.PageRequest{Limit: 1}, core.FocusQuery{})
	if err != nil {
		t.Fatal(err)
	}
	if first.Count != 1 || !first.HasMore || first.NextCursor == nil {
		t.Fatalf("expected first page with cursor: %#v", first)
	}
	second, err := store.ListFlows(ctx, userID, core.PageRequest{Limit: 1, Cursor: first.NextCursor}, core.FocusQuery{})
	if err != nil {
		t.Fatal(err)
	}
	if second.Count != 1 || second.Items[0].ID == first.Items[0].ID {
		t.Fatalf("expected second page after cursor: first=%#v second=%#v", first, second)
	}
}

func TestIntegrationEventsAreWrittenForMutations(t *testing.T) {
	store := openIntegrationStore(t)
	truncateIntegrationTables(t, store)
	ctx := context.Background()
	userID := core.UserID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"))

	flow, err := store.CreateFlow(ctx, userID, core.CreateFocus{Name: "Root flow"})
	if err != nil {
		t.Fatal(err)
	}
	goal, err := store.CreateGoal(ctx, userID, core.CreateGoal{OwnerFocusID: flow.ID, Type: core.GoalTypePrimary, Description: "Goal"})
	if err != nil {
		t.Fatal(err)
	}
	if err := store.DeleteGoal(ctx, userID, goal.ID); err != nil {
		t.Fatal(err)
	}

	var count int
	if err := store.pool.QueryRow(ctx, `SELECT count(*) FROM focus_event`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count < 3 {
		t.Fatalf("expected mutation events, got %d", count)
	}
}

func openIntegrationStore(t *testing.T) *Store {
	t.Helper()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL is required for PostgreSQL integration tests")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	store, err := Open(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(store.Close)
	return store
}

func truncateIntegrationTables(t *testing.T, store *Store) {
	t.Helper()
	if _, err := store.pool.Exec(context.Background(), `TRUNCATE focus_event, focus_specification, focus_goal_link, focus_goal, focus_object RESTART IDENTITY CASCADE`); err != nil {
		t.Fatal(err)
	}
}
