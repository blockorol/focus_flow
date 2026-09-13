package api

import (
	"context"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	apimodel "github.com/blockorol/focus_flow/backend/internal/api/model"
)

func (userAPI) GetCurrentSession(ctx context.Context, _ generated.GetCurrentSessionRequestObject) (generated.GetCurrentSessionResponseObject, error) {
	session, ok := apimodel.SessionFromContext(ctx)
	if !ok {
		return generated.GetCurrentSession401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	return generated.GetCurrentSession200JSONResponse{Session: apimodel.SessionFromInternal(session)}, nil
}

func (userAPI) ListFlows(ctx context.Context, request generated.ListFlowsRequestObject) (generated.ListFlowsResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.ListFlows401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	_ = apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor)
	_, _ = apimodel.QueryFromParams(generated.UUID(mockRootFocusID), request.Params.Include, request.Params.Depth)
	return generated.ListFlows200JSONResponse(apimodel.FocusPageFromInternal(mockFocusPage())), nil
}

func (userAPI) CreateFlow(ctx context.Context, request generated.CreateFlowRequestObject) (generated.CreateFlowResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.CreateFlow401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.CreateFlowToInternal(*request.Body)
	}
	return generated.CreateFlow201JSONResponse{Focus: apimodel.FocusFromInternal(mockFocus())}, nil
}

func (userAPI) CreateFocus(ctx context.Context, request generated.CreateFocusRequestObject) (generated.CreateFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.CreateFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.CreateFocusToInternal(*request.Body)
	}
	return generated.CreateFocus201JSONResponse{Focus: apimodel.FocusFromInternal(mockChildFocus())}, nil
}

func (userAPI) DeleteFocus(ctx context.Context, _ generated.DeleteFocusRequestObject) (generated.DeleteFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.DeleteFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	return generated.DeleteFocus204Response{}, nil
}

func (userAPI) GetFocus(ctx context.Context, request generated.GetFocusRequestObject) (generated.GetFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.GetFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	_, _ = apimodel.QueryFromParams(request.Id, request.Params.Include, request.Params.Depth)
	return generated.GetFocus200JSONResponse{Focus: apimodel.FocusFromInternal(mockFocus())}, nil
}

func (userAPI) UpdateFocus(ctx context.Context, request generated.UpdateFocusRequestObject) (generated.UpdateFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.UpdateFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.UpdateFocusToInternal(request.Id, *request.Body)
	}
	return generated.UpdateFocus200JSONResponse{Focus: apimodel.FocusFromInternal(mockFocus())}, nil
}

func (userAPI) ListFocusChildren(ctx context.Context, request generated.ListFocusChildrenRequestObject) (generated.ListFocusChildrenResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.ListFocusChildren401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	_ = apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor)
	_, _ = apimodel.QueryFromParams(request.Id, request.Params.Include, request.Params.Depth)
	return generated.ListFocusChildren200JSONResponse(apimodel.FocusPageFromInternal(mockFocusPage())), nil
}

func (userAPI) ListFocusGoals(ctx context.Context, request generated.ListFocusGoalsRequestObject) (generated.ListFocusGoalsResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.ListFocusGoals401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	_ = apimodel.PageRequestFromParams(request.Params.Limit, request.Params.Cursor)
	return generated.ListFocusGoals200JSONResponse(apimodel.GoalPageFromInternal(mockGoalPage())), nil
}

func (userAPI) CreateGoal(ctx context.Context, request generated.CreateGoalRequestObject) (generated.CreateGoalResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.CreateGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.CreateGoalToInternal(request.Id, *request.Body)
	}
	return generated.CreateGoal201JSONResponse{Goal: apimodel.GoalFromInternal(mockGoal())}, nil
}

func (userAPI) DeleteGoal(ctx context.Context, _ generated.DeleteGoalRequestObject) (generated.DeleteGoalResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.DeleteGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	return generated.DeleteGoal204Response{}, nil
}

func (userAPI) GetGoal(ctx context.Context, _ generated.GetGoalRequestObject) (generated.GetGoalResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.GetGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	return generated.GetGoal200JSONResponse{Goal: apimodel.GoalFromInternal(mockGoal())}, nil
}

func (userAPI) UpdateGoal(ctx context.Context, request generated.UpdateGoalRequestObject) (generated.UpdateGoalResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.UpdateGoal401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.UpdateGoalToInternal(request.Id, *request.Body)
	}
	return generated.UpdateGoal200JSONResponse{Goal: apimodel.GoalFromInternal(mockGoal())}, nil
}

func (userAPI) LinkGoalFocus(ctx context.Context, request generated.LinkGoalFocusRequestObject) (generated.LinkGoalFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.LinkGoalFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	if request.Body != nil {
		_ = apimodel.LinkGoalFocusToInternal(request.Id, *request.Body)
	}
	return generated.LinkGoalFocus200JSONResponse{Goal: apimodel.GoalFromInternal(mockGoal())}, nil
}

func (userAPI) UnlinkGoalFocus(ctx context.Context, request generated.UnlinkGoalFocusRequestObject) (generated.UnlinkGoalFocusResponseObject, error) {
	if _, ok := apimodel.UserIDFromContext(ctx); !ok {
		return generated.UnlinkGoalFocus401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	_ = apimodel.UnlinkGoalFocusToInternal(request.Id, request.FocusId)
	return generated.UnlinkGoalFocus200JSONResponse{Goal: apimodel.GoalFromInternal(mockGoal())}, nil
}
