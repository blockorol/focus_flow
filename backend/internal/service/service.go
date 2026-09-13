// Package service contains application use cases over internal models.
package service

import (
	"context"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

type FocusService struct {
	store storage.FocusStore
}

func NewFocusService(store storage.FocusStore) FocusService {
	return FocusService{store: store}
}

func (service FocusService) ListFlows(ctx context.Context, userID core.UserID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	query.ID = core.FocusID{}
	return service.store.ListFlows(ctx, userID, page, query)
}

func (service FocusService) CreateFlow(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error) {
	input.ParentID = nil
	return service.store.CreateFlow(ctx, userID, input)
}

func (service FocusService) CreateFocus(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error) {
	return service.store.CreateFocus(ctx, userID, input)
}

func (service FocusService) GetFocus(ctx context.Context, userID core.UserID, query core.FocusQuery) (core.Focus, error) {
	return service.store.GetFocus(ctx, userID, query)
}

func (service FocusService) UpdateFocus(ctx context.Context, userID core.UserID, input core.UpdateFocus) (core.Focus, error) {
	return service.store.UpdateFocus(ctx, userID, input)
}

func (service FocusService) DeleteFocus(ctx context.Context, userID core.UserID, id core.FocusID) error {
	return service.store.DeleteFocus(ctx, userID, id)
}

func (service FocusService) ListFocusChildren(ctx context.Context, userID core.UserID, parentID core.FocusID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	return service.store.ListFocusChildren(ctx, userID, parentID, page, query)
}

type GoalService struct {
	store storage.GoalStore
}

func NewGoalService(store storage.GoalStore) GoalService {
	return GoalService{store: store}
}

func (service GoalService) ListFocusGoals(ctx context.Context, userID core.UserID, focusID core.FocusID, page core.PageRequest) (core.Page[core.Goal], error) {
	return service.store.ListFocusGoals(ctx, userID, focusID, page)
}

func (service GoalService) CreateGoal(ctx context.Context, userID core.UserID, input core.CreateGoal) (core.Goal, error) {
	return service.store.CreateGoal(ctx, userID, input)
}

func (service GoalService) GetGoal(ctx context.Context, userID core.UserID, id core.GoalID) (core.Goal, error) {
	return service.store.GetGoal(ctx, userID, id)
}

func (service GoalService) UpdateGoal(ctx context.Context, userID core.UserID, input core.UpdateGoal) (core.Goal, error) {
	return service.store.UpdateGoal(ctx, userID, input)
}

func (service GoalService) DeleteGoal(ctx context.Context, userID core.UserID, id core.GoalID) error {
	return service.store.DeleteGoal(ctx, userID, id)
}

func (service GoalService) LinkGoalFocus(ctx context.Context, userID core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	return service.store.LinkGoalFocus(ctx, userID, link)
}

func (service GoalService) UnlinkGoalFocus(ctx context.Context, userID core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	return service.store.UnlinkGoalFocus(ctx, userID, link)
}
