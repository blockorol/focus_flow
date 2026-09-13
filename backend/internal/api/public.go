package api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	apimodel "github.com/blockorol/focus_flow/backend/internal/api/model"
	"github.com/blockorol/focus_flow/backend/internal/auth"
)

func (api publicAPI) Login(ctx context.Context, request generated.LoginRequestObject) (generated.LoginResponseObject, error) {
	if request.Body == nil {
		return generated.Login401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	issued, err := api.authService.Login(ctx, apimodel.LoginToInternal(*request.Body))
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			return generated.Login401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
		}
		return nil, err
	}
	cookie := api.sessionCookie(issued.Token, issued.Session.ExpiresAt)
	return generated.Login200JSONResponse{
		Body:    generated.AuthResponse{Session: apimodel.SessionFromInternal(issued.Session)},
		Headers: generated.Login200ResponseHeaders{SetCookie: &cookie},
	}, nil
}

func (api publicAPI) Logout(context.Context, generated.LogoutRequestObject) (generated.LogoutResponseObject, error) {
	cookie := api.expiredSessionCookie()
	return generated.Logout204Response{Headers: generated.Logout204ResponseHeaders{SetCookie: &cookie}}, nil
}

func (api publicAPI) RefreshSession(ctx context.Context, _ generated.RefreshSessionRequestObject) (generated.RefreshSessionResponseObject, error) {
	session, ok := apimodel.SessionFromContext(ctx)
	if !ok {
		return generated.RefreshSession401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
	}
	issued, err := api.authService.Refresh(session)
	if err != nil {
		if isAuthFailure(err) {
			return generated.RefreshSession401JSONResponse{UnauthorizedJSONResponse: unauthorized()}, nil
		}
		return nil, err
	}
	cookie := api.sessionCookie(issued.Token, issued.Session.ExpiresAt)
	return generated.RefreshSession200JSONResponse{
		Body:    generated.AuthResponse{Session: apimodel.SessionFromInternal(issued.Session)},
		Headers: generated.RefreshSession200ResponseHeaders{SetCookie: &cookie},
	}, nil
}

func (api publicAPI) sessionCookie(token string, expiresAt time.Time) string {
	return (&http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   api.cookies.Secure,
		SameSite: api.cookies.SameSite,
	}).String()
}

func (api publicAPI) expiredSessionCookie() string {
	return (&http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0).UTC(),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   api.cookies.Secure,
		SameSite: api.cookies.SameSite,
	}).String()
}
