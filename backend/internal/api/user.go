package api

import (
	"context"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	apimodel "github.com/blockorol/focus_flow/backend/internal/api/model"
	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func (api userAPI) GetCurrentSession(ctx context.Context, _ generated.GetCurrentSessionRequestObject) (generated.GetCurrentSessionResponseObject, error) {
	session, ok := apimodel.SessionFromContext(ctx)
	if !ok {
		return generated.GetCurrentSession401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	return generated.GetCurrentSession200JSONResponse{Session: apimodel.SessionFromInternal(session)}, nil
}

func (api userAPI) ListFlows(ctx context.Context, request generated.ListFlowsRequestObject) (generated.ListFlowsResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.ListFlows401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	query, err := apimodel.QueryFromParams(core.FocusID{}, request.Params.Include, request.Params.Depth)
	if err != nil {
		return nil, err
	}
	page, err := api.focuses.ListFlows(ctx, userID, apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor), query)
	if err != nil {
		return nil, err
	}
	return generated.ListFlows200JSONResponse(apimodel.FocusPageFromInternal(page)), nil
}

func (api userAPI) CreateFlow(ctx context.Context, request generated.CreateFlowRequestObject) (generated.CreateFlowResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.CreateFlow401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	focus, err := api.focuses.CreateFlow(ctx, userID, apimodel.CreateFlowToInternal(*request.Body))
	if err != nil {
		return nil, err
	}
	return generated.CreateFlow201JSONResponse{Focus: apimodel.FocusFromInternal(focus)}, nil
}

func (api userAPI) CreateFocus(ctx context.Context, request generated.CreateFocusRequestObject) (generated.CreateFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.CreateFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	focus, err := api.focuses.CreateFocus(ctx, userID, apimodel.CreateFocusToInternal(*request.Body))
	if err != nil {
		if isNotFound(err) {
			return generated.CreateFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
		}
		return nil, err
	}
	return generated.CreateFocus201JSONResponse{Focus: apimodel.FocusFromInternal(focus)}, nil
}

func (api userAPI) DeleteFocus(ctx context.Context, request generated.DeleteFocusRequestObject) (generated.DeleteFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.DeleteFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if err := api.focuses.DeleteFocus(ctx, userID, request.Id); err != nil {
		if isNotFound(err) {
			return generated.DeleteFocus404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.DeleteFocus204Response{}, nil
}

func (api userAPI) GetFocus(ctx context.Context, request generated.GetFocusRequestObject) (generated.GetFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.GetFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	query, err := apimodel.QueryFromParams(request.Id, request.Params.Include, request.Params.Depth)
	if err != nil {
		return nil, err
	}
	focus, err := api.focuses.GetFocus(ctx, userID, query)
	if err != nil {
		if isNotFound(err) {
			return generated.GetFocus404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.GetFocus200JSONResponse{Focus: apimodel.FocusFromInternal(focus)}, nil
}

func (api userAPI) UpdateFocus(ctx context.Context, request generated.UpdateFocusRequestObject) (generated.UpdateFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.UpdateFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	focus, err := api.focuses.UpdateFocus(ctx, userID, apimodel.UpdateFocusToInternal(request.Id, *request.Body))
	if err != nil {
		if isNotFound(err) {
			return generated.UpdateFocus404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.UpdateFocus200JSONResponse{Focus: apimodel.FocusFromInternal(focus)}, nil
}

func (api userAPI) ListFocusChildren(ctx context.Context, request generated.ListFocusChildrenRequestObject) (generated.ListFocusChildrenResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.ListFocusChildren401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	query, err := apimodel.QueryFromParams(request.Id, request.Params.Include, request.Params.Depth)
	if err != nil {
		return nil, err
	}
	page, err := api.focuses.ListFocusChildren(ctx, userID, request.Id, apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor), query)
	if err != nil {
		if isNotFound(err) {
			return generated.ListFocusChildren404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.ListFocusChildren200JSONResponse(apimodel.FocusPageFromInternal(page)), nil
}

func (api userAPI) ListFocusGoals(ctx context.Context, request generated.ListFocusGoalsRequestObject) (generated.ListFocusGoalsResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.ListFocusGoals401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	page, err := api.goals.ListFocusGoals(ctx, userID, request.Id, apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor))
	if err != nil {
		if isNotFound(err) {
			return generated.ListFocusGoals404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.ListFocusGoals200JSONResponse(apimodel.GoalPageFromInternal(page)), nil
}

func (api userAPI) CreateGoal(ctx context.Context, request generated.CreateGoalRequestObject) (generated.CreateGoalResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.CreateGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	goal, err := api.goals.CreateGoal(ctx, userID, apimodel.CreateGoalToInternal(request.Id, *request.Body))
	if err != nil {
		if isNotFound(err) {
			return generated.CreateGoal404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.CreateGoal201JSONResponse{Goal: apimodel.GoalFromInternal(goal)}, nil
}

func (api userAPI) DeleteGoal(ctx context.Context, request generated.DeleteGoalRequestObject) (generated.DeleteGoalResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.DeleteGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if err := api.goals.DeleteGoal(ctx, userID, request.Id); err != nil {
		if isNotFound(err) {
			return generated.DeleteGoal404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.DeleteGoal204Response{}, nil
}

func (api userAPI) GetGoal(ctx context.Context, request generated.GetGoalRequestObject) (generated.GetGoalResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.GetGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	goal, err := api.goals.GetGoal(ctx, userID, request.Id)
	if err != nil {
		if isNotFound(err) {
			return generated.GetGoal404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.GetGoal200JSONResponse{Goal: apimodel.GoalFromInternal(goal)}, nil
}

func (api userAPI) UpdateGoal(ctx context.Context, request generated.UpdateGoalRequestObject) (generated.UpdateGoalResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.UpdateGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	goal, err := api.goals.UpdateGoal(ctx, userID, apimodel.UpdateGoalToInternal(request.Id, *request.Body))
	if err != nil {
		if isNotFound(err) {
			return generated.UpdateGoal404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.UpdateGoal200JSONResponse{Goal: apimodel.GoalFromInternal(goal)}, nil
}

func (api userAPI) LinkGoalFocus(ctx context.Context, request generated.LinkGoalFocusRequestObject) (generated.LinkGoalFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.LinkGoalFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	goal, err := api.goals.LinkGoalFocus(ctx, userID, apimodel.LinkGoalFocusToInternal(request.Id, *request.Body))
	if err != nil {
		if isNotFound(err) {
			return generated.LinkGoalFocus404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.LinkGoalFocus200JSONResponse{Goal: apimodel.GoalFromInternal(goal)}, nil
}

func (api userAPI) UnlinkGoalFocus(ctx context.Context, request generated.UnlinkGoalFocusRequestObject) (generated.UnlinkGoalFocusResponseObject, error) {
	userID, ok := apimodel.UserIDFromContext(ctx)
	if !ok {
		return generated.UnlinkGoalFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	goal, err := api.goals.UnlinkGoalFocus(ctx, userID, apimodel.UnlinkGoalFocusToInternal(request.Id, request.FocusId))
	if err != nil {
		if isNotFound(err) {
			return generated.UnlinkGoalFocus404JSONResponse{NotFoundJSONResponse: notFound()}, nil
		}
		return nil, err
	}
	return generated.UnlinkGoalFocus200JSONResponse{Goal: apimodel.GoalFromInternal(goal)}, nil
}
