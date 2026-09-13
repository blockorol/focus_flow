package api

import (
	"context"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	apimodel "github.com/blockorol/focus_flow/backend/internal/api/model"
)

func (publicAPI) Login(context.Context, generated.LoginRequestObject) (generated.LoginResponseObject, error) {
	return generated.Login200JSONResponse{Session: apimodel.SessionFromInternal(mockSession())}, nil
}

func (publicAPI) Logout(context.Context, generated.LogoutRequestObject) (generated.LogoutResponseObject, error) {
	return generated.Logout204Response{}, nil
}

func (publicAPI) RefreshSession(context.Context, generated.RefreshSessionRequestObject) (generated.RefreshSessionResponseObject, error) {
	return generated.RefreshSession200JSONResponse{Session: apimodel.SessionFromInternal(mockSession())}, nil
}
