// Package fake contains disposable in-memory storage for development and service-layer tests.
package fake

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

var _ storage.FocusStore = (*Store)(nil)
var _ storage.GoalStore = (*Store)(nil)

type Store struct {
	mu      sync.Mutex
	now     func() time.Time
	focuses map[core.FocusID]core.Focus
	goals   map[core.GoalID]core.Goal
}

func New() *Store {
	store := &Store{now: time.Now, focuses: map[core.FocusID]core.Focus{}, goals: map[core.GoalID]core.Goal{}}
	store.seed()
	return store
}

func (store *Store) ListFlows(_ context.Context, _ core.UserID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	items := make([]core.Focus, 0)
	for _, focus := range store.focuses {
		if focus.ParentID == nil {
			items = append(items, store.focusAggregateLocked(focus.ID, query.IncludeGoals, query.DescendantDepth))
		}
	}
	return focusPage(items, page), nil
}

func (store *Store) CreateFlow(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error) {
	input.ParentID = nil
	return store.CreateFocus(ctx, userID, input)
}

func (store *Store) CreateFocus(_ context.Context, _ core.UserID, input core.CreateFocus) (core.Focus, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	id := newID()
	now := store.now().UTC()
	status := core.FocusStatusPlanned
	if input.Status != nil {
		status = *input.Status
	}
	focus := core.Focus{ID: id, ParentID: input.ParentID, Name: input.Name, Status: status, Tags: append([]string(nil), input.Tags...), Description: input.Description, Feedback: input.Feedback, Color: input.Color, CreatedAt: now, UpdatedAt: now}
	store.focuses[id] = focus
	return cloneFocus(focus), nil
}

func (store *Store) GetFocus(_ context.Context, _ core.UserID, query core.FocusQuery) (core.Focus, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	focus, ok := store.focuses[query.ID]
	if !ok {
		return core.Focus{}, storage.ErrNotFound
	}
	return store.focusAggregateLocked(focus.ID, query.IncludeGoals, query.DescendantDepth), nil
}

func (store *Store) UpdateFocus(_ context.Context, _ core.UserID, input core.UpdateFocus) (core.Focus, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	focus, ok := store.focuses[input.ID]
	if !ok {
		return core.Focus{}, storage.ErrNotFound
	}
	if input.ParentID.Set {
		focus.ParentID = input.ParentID.Value
	}
	if input.Name != nil {
		focus.Name = *input.Name
	}
	if input.Status != nil {
		focus.Status = *input.Status
	}
	if input.Tags != nil {
		focus.Tags = append([]string(nil), (*input.Tags)...)
	}
	if input.Description.Set {
		focus.Description = input.Description.Value
	}
	if input.Feedback.Set {
		focus.Feedback = input.Feedback.Value
	}
	if input.Color.Set {
		focus.Color = input.Color.Value
	}
	focus.UpdatedAt = store.now().UTC()
	store.focuses[input.ID] = focus
	return cloneFocus(focus), nil
}

func (store *Store) DeleteFocus(_ context.Context, _ core.UserID, id core.FocusID) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.focuses[id]; !ok {
		return storage.ErrNotFound
	}
	store.deleteFocusLocked(id)
	return nil
}

func (store *Store) ListFocusChildren(_ context.Context, _ core.UserID, parentID core.FocusID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.focuses[parentID]; !ok {
		return core.Page[core.Focus]{}, storage.ErrNotFound
	}
	items := store.childrenLocked(parentID, query.IncludeGoals, query.DescendantDepth)
	return focusPage(items, page), nil
}

func (store *Store) ListFocusGoals(_ context.Context, _ core.UserID, focusID core.FocusID, page core.PageRequest) (core.Page[core.Goal], error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.focuses[focusID]; !ok {
		return core.Page[core.Goal]{}, storage.ErrNotFound
	}
	items := make([]core.Goal, 0)
	for _, goal := range store.goals {
		if goal.OwnerFocusID == focusID {
			items = append(items, store.goalAggregateLocked(goal.ID))
		}
	}
	return goalPage(items, page), nil
}

func (store *Store) CreateGoal(_ context.Context, _ core.UserID, input core.CreateGoal) (core.Goal, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.focuses[input.OwnerFocusID]; !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	id := newID()
	now := store.now().UTC()
	goal := core.Goal{ID: id, OwnerFocusID: input.OwnerFocusID, Type: input.Type, Description: input.Description, StatusOverride: input.StatusOverride, LinkedFocusIDs: append([]core.FocusID(nil), input.LinkedFocusIDs...), CreatedAt: now, UpdatedAt: now}
	store.goals[id] = goal
	return store.goalAggregateLocked(id), nil
}

func (store *Store) GetGoal(_ context.Context, _ core.UserID, id core.GoalID) (core.Goal, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.goals[id]; !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	return store.goalAggregateLocked(id), nil
}

func (store *Store) UpdateGoal(_ context.Context, _ core.UserID, input core.UpdateGoal) (core.Goal, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	goal, ok := store.goals[input.ID]
	if !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	if input.Type != nil {
		goal.Type = *input.Type
	}
	if input.Description != nil {
		goal.Description = *input.Description
	}
	if input.StatusOverride.Set {
		goal.StatusOverride = input.StatusOverride.Value
	}
	if input.LinkedFocusIDs != nil {
		goal.LinkedFocusIDs = append([]core.FocusID(nil), (*input.LinkedFocusIDs)...)
	}
	goal.UpdatedAt = store.now().UTC()
	store.goals[input.ID] = goal
	return store.goalAggregateLocked(input.ID), nil
}

func (store *Store) DeleteGoal(_ context.Context, _ core.UserID, id core.GoalID) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.goals[id]; !ok {
		return storage.ErrNotFound
	}
	delete(store.goals, id)
	return nil
}

func (store *Store) LinkGoalFocus(_ context.Context, _ core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	goal, ok := store.goals[link.GoalID]
	if !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	if _, ok := store.focuses[link.FocusID]; !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	for _, id := range goal.LinkedFocusIDs {
		if id == link.FocusID {
			return store.goalAggregateLocked(link.GoalID), nil
		}
	}
	goal.LinkedFocusIDs = append(goal.LinkedFocusIDs, link.FocusID)
	goal.UpdatedAt = store.now().UTC()
	store.goals[link.GoalID] = goal
	return store.goalAggregateLocked(link.GoalID), nil
}

func (store *Store) UnlinkGoalFocus(_ context.Context, _ core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	goal, ok := store.goals[link.GoalID]
	if !ok {
		return core.Goal{}, storage.ErrNotFound
	}
	linked := goal.LinkedFocusIDs[:0]
	for _, id := range goal.LinkedFocusIDs {
		if id != link.FocusID {
			linked = append(linked, id)
		}
	}
	goal.LinkedFocusIDs = append([]core.FocusID(nil), linked...)
	goal.UpdatedAt = store.now().UTC()
	store.goals[link.GoalID] = goal
	return store.goalAggregateLocked(link.GoalID), nil
}

func (store *Store) focusAggregateLocked(id core.FocusID, includeGoals bool, depth int) core.Focus {
	focus := cloneFocus(store.focuses[id])
	if includeGoals {
		for _, goal := range store.goals {
			if goal.OwnerFocusID == id {
				focus.Goals = append(focus.Goals, store.goalAggregateLocked(goal.ID))
			}
		}
		sortGoals(focus.Goals)
	}
	if depth > 0 {
		focus.Children = store.childrenLocked(id, includeGoals, depth-1)
	}
	return focus
}

func (store *Store) childrenLocked(parentID core.FocusID, includeGoals bool, depth int) []core.Focus {
	items := make([]core.Focus, 0)
	for _, focus := range store.focuses {
		if focus.ParentID != nil && *focus.ParentID == parentID {
			items = append(items, store.focusAggregateLocked(focus.ID, includeGoals, depth))
		}
	}
	sortFocuses(items)
	return items
}

func (store *Store) goalAggregateLocked(id core.GoalID) core.Goal {
	goal := cloneGoal(store.goals[id])
	goal.Progress = core.GoalProgress{StatusCounts: map[core.FocusStatus]int{}}
	for _, focusID := range goal.LinkedFocusIDs {
		focus, ok := store.focuses[focusID]
		if !ok {
			continue
		}
		goal.Progress.LinkedCount++
		goal.Progress.StatusCounts[focus.Status]++
		if focus.Status == core.FocusStatusDone || focus.Status == core.FocusStatusCancelled {
			goal.Progress.TerminalCount++
		}
		if focus.Status == core.FocusStatusDone {
			goal.Progress.DoneCount++
		}
	}
	return goal
}

func (store *Store) deleteFocusLocked(id core.FocusID) {
	for _, focus := range store.focuses {
		if focus.ParentID != nil && *focus.ParentID == id {
			store.deleteFocusLocked(focus.ID)
		}
	}
	for goalID, goal := range store.goals {
		if goal.OwnerFocusID == id {
			delete(store.goals, goalID)
			continue
		}
		linked := goal.LinkedFocusIDs[:0]
		for _, linkedID := range goal.LinkedFocusIDs {
			if linkedID != id {
				linked = append(linked, linkedID)
			}
		}
		goal.LinkedFocusIDs = append([]core.FocusID(nil), linked...)
		store.goals[goalID] = goal
	}
	delete(store.focuses, id)
}

func (store *Store) seed() {
	now := time.Date(2026, 9, 8, 12, 0, 0, 0, time.UTC)
	rootID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000100"))
	childID := core.FocusID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000101"))
	goalID := core.GoalID(uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000200"))
	store.focuses[rootID] = core.Focus{ID: rootID, Name: "Mock flow", Status: core.FocusStatusActive, Tags: []string{"mock"}, CreatedAt: now, UpdatedAt: now}
	store.focuses[childID] = core.Focus{ID: childID, ParentID: &rootID, Name: "Mock child focus", Status: core.FocusStatusPlanned, Tags: []string{"mock"}, CreatedAt: now, UpdatedAt: now}
	store.goals[goalID] = core.Goal{ID: goalID, OwnerFocusID: rootID, Type: core.GoalTypePrimary, Description: "Mock goal", LinkedFocusIDs: []core.FocusID{childID}, CreatedAt: now, UpdatedAt: now}
}

func newID() uuid.UUID {
	id, err := uuid.NewV7()
	if err == nil {
		return id
	}
	return uuid.New()
}

func focusPage(items []core.Focus, request core.PageRequest) core.Page[core.Focus] {
	sortFocuses(items)
	paged := pageItems(items, request, func(item core.Focus) string { return item.ID.String() })
	return core.Page[core.Focus]{Items: paged.items, Count: len(paged.items), NextCursor: paged.nextCursor, HasMore: paged.hasMore}
}

func goalPage(items []core.Goal, request core.PageRequest) core.Page[core.Goal] {
	sortGoals(items)
	paged := pageItems(items, request, func(item core.Goal) string { return item.ID.String() })
	return core.Page[core.Goal]{Items: paged.items, Count: len(paged.items), NextCursor: paged.nextCursor, HasMore: paged.hasMore}
}

type pageResult[T any] struct {
	items      []T
	nextCursor *string
	hasMore    bool
}

func pageItems[T any](items []T, request core.PageRequest, cursor func(T) string) pageResult[T] {
	limit := request.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	start := 0
	if request.Cursor != nil {
		for i, item := range items {
			if cursor(item) == *request.Cursor {
				start = i + 1
				break
			}
		}
	}
	end := start + limit
	if end > len(items) {
		end = len(items)
	}
	out := append([]T(nil), items[start:end]...)
	result := pageResult[T]{items: out, hasMore: end < len(items)}
	if result.hasMore && len(out) > 0 {
		next := cursor(out[len(out)-1])
		result.nextCursor = &next
	}
	return result
}

func sortFocuses(items []core.Focus) {
	sort.Slice(items, func(i, j int) bool { return items[i].ID.String() < items[j].ID.String() })
}

func sortGoals(items []core.Goal) {
	sort.Slice(items, func(i, j int) bool { return items[i].ID.String() < items[j].ID.String() })
}

func cloneFocus(value core.Focus) core.Focus {
	value.Tags = append([]string(nil), value.Tags...)
	value.Goals = append([]core.Goal(nil), value.Goals...)
	value.Specifications = append([]core.Specification(nil), value.Specifications...)
	value.Children = append([]core.Focus(nil), value.Children...)
	return value
}

func cloneGoal(value core.Goal) core.Goal {
	value.LinkedFocusIDs = append([]core.FocusID(nil), value.LinkedFocusIDs...)
	if value.Progress.StatusCounts != nil {
		counts := make(map[core.FocusStatus]int, len(value.Progress.StatusCounts))
		for status, count := range value.Progress.StatusCounts {
			counts[status] = count
		}
		value.Progress.StatusCounts = counts
	}
	return value
}
