// Package api adapts the generated HTTP contract to application behavior.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	apimodel "github.com/blockorol/focus_flow/backend/internal/api/model"
	"github.com/blockorol/focus_flow/backend/internal/auth"
	"github.com/blockorol/focus_flow/backend/internal/service"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

const sessionCookieName = "focusflow_session"

type handler struct {
	public publicAPI
	user   userAPI
}

type publicAPI struct {
	authService auth.Service
	cookies     CookieConfig
}

type userAPI struct {
	focuses service.FocusService
	goals   service.GoalService
}

type CookieConfig struct {
	Secure   bool
	SameSite http.SameSite
}

func CookieConfigForEnvironment(environment string) CookieConfig {
	if environment == "production" {
		return CookieConfig{Secure: true, SameSite: http.SameSiteNoneMode}
	}
	return CookieConfig{Secure: false, SameSite: http.SameSiteLaxMode}
}

var _ generated.StrictServerInterface = handler{}

func NewHandler(origins []string, authService auth.Service, focusService service.FocusService, goalService service.GoalService, cookies CookieConfig) http.Handler {
	apiHandler := handler{public: publicAPI{authService: authService, cookies: cookies}, user: userAPI{focuses: focusService, goals: goalService}}
	api := generated.Handler(generated.NewStrictHandler(apiHandler, []generated.StrictMiddlewareFunc{authMiddleware(authService)}))
	allowed := make(map[string]bool, len(origins))
	for _, origin := range origins {
		allowed[origin] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Origin")
		origin := r.Header.Get("Origin")
		preflight := r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != ""
		if preflight {
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
		}
		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		if preflight {
			if !allowed[origin] || !allowedMethod(r.Header.Get("Access-Control-Request-Method")) {
				http.Error(w, "CORS preflight is not allowed", http.StatusForbidden)
				return
			}
			for _, header := range strings.Split(r.Header.Get("Access-Control-Request-Headers"), ",") {
				switch strings.ToLower(strings.TrimSpace(header)) {
				case "", "accept", "authorization", "content-type":
				default:
					http.Error(w, "CORS request header is not allowed", http.StatusForbidden)
					return
				}
			}
			w.Header().Set("Access-Control-Allow-Methods", "DELETE, GET, PATCH, POST")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		api.ServeHTTP(w, r)
	})
}

func (h handler) Login(ctx context.Context, request generated.LoginRequestObject) (generated.LoginResponseObject, error) {
	return h.public.Login(ctx, request)
}

func (h handler) Logout(ctx context.Context, request generated.LogoutRequestObject) (generated.LogoutResponseObject, error) {
	return h.public.Logout(ctx, request)
}

func (h handler) RefreshSession(ctx context.Context, request generated.RefreshSessionRequestObject) (generated.RefreshSessionResponseObject, error) {
	return h.public.RefreshSession(ctx, request)
}

func (h handler) GetCurrentSession(ctx context.Context, request generated.GetCurrentSessionRequestObject) (generated.GetCurrentSessionResponseObject, error) {
	return h.user.GetCurrentSession(ctx, request)
}

func (h handler) ListFlows(ctx context.Context, request generated.ListFlowsRequestObject) (generated.ListFlowsResponseObject, error) {
	return h.user.ListFlows(ctx, request)
}

func (h handler) CreateFlow(ctx context.Context, request generated.CreateFlowRequestObject) (generated.CreateFlowResponseObject, error) {
	return h.user.CreateFlow(ctx, request)
}

func (h handler) CreateFocus(ctx context.Context, request generated.CreateFocusRequestObject) (generated.CreateFocusResponseObject, error) {
	return h.user.CreateFocus(ctx, request)
}

func (h handler) DeleteFocus(ctx context.Context, request generated.DeleteFocusRequestObject) (generated.DeleteFocusResponseObject, error) {
	return h.user.DeleteFocus(ctx, request)
}

func (h handler) GetFocus(ctx context.Context, request generated.GetFocusRequestObject) (generated.GetFocusResponseObject, error) {
	return h.user.GetFocus(ctx, request)
}

func (h handler) UpdateFocus(ctx context.Context, request generated.UpdateFocusRequestObject) (generated.UpdateFocusResponseObject, error) {
	return h.user.UpdateFocus(ctx, request)
}

func (h handler) ListFocusChildren(ctx context.Context, request generated.ListFocusChildrenRequestObject) (generated.ListFocusChildrenResponseObject, error) {
	return h.user.ListFocusChildren(ctx, request)
}

func (h handler) ListFocusGoals(ctx context.Context, request generated.ListFocusGoalsRequestObject) (generated.ListFocusGoalsResponseObject, error) {
	return h.user.ListFocusGoals(ctx, request)
}

func (h handler) CreateGoal(ctx context.Context, request generated.CreateGoalRequestObject) (generated.CreateGoalResponseObject, error) {
	return h.user.CreateGoal(ctx, request)
}

func (h handler) DeleteGoal(ctx context.Context, request generated.DeleteGoalRequestObject) (generated.DeleteGoalResponseObject, error) {
	return h.user.DeleteGoal(ctx, request)
}

func (h handler) GetGoal(ctx context.Context, request generated.GetGoalRequestObject) (generated.GetGoalResponseObject, error) {
	return h.user.GetGoal(ctx, request)
}

func (h handler) UpdateGoal(ctx context.Context, request generated.UpdateGoalRequestObject) (generated.UpdateGoalResponseObject, error) {
	return h.user.UpdateGoal(ctx, request)
}

func (h handler) LinkGoalFocus(ctx context.Context, request generated.LinkGoalFocusRequestObject) (generated.LinkGoalFocusResponseObject, error) {
	return h.user.LinkGoalFocus(ctx, request)
}

func (h handler) UnlinkGoalFocus(ctx context.Context, request generated.UnlinkGoalFocusRequestObject) (generated.UnlinkGoalFocusResponseObject, error) {
	return h.user.UnlinkGoalFocus(ctx, request)
}

func (handler) GetHealth(context.Context, generated.GetHealthRequestObject) (generated.GetHealthResponseObject, error) {
	return generated.GetHealth200JSONResponse{Status: generated.Ok}, nil
}

func allowedMethod(method string) bool {
	switch method {
	case http.MethodDelete, http.MethodGet, http.MethodPatch, http.MethodPost:
		return true
	default:
		return false
	}
}

func authMiddleware(authService auth.Service) generated.StrictMiddlewareFunc {
	return func(next generated.StrictHandlerFunc, operationID string) generated.StrictHandlerFunc {
		return func(ctx context.Context, w http.ResponseWriter, r *http.Request, request any) (any, error) {
			if !protectedOperation(operationID) {
				return next(ctx, w, r, request)
			}
			cookie, err := r.Cookie(sessionCookieName)
			if err != nil || cookie.Value == "" {
				writeUnauthorized(w)
				return nil, nil
			}
			session, err := authService.VerifyToken(cookie.Value)
			if err != nil {
				writeUnauthorized(w)
				return nil, nil
			}
			return next(apimodel.ContextWithSession(ctx, session), w, r, request)
		}
	}
}

func protectedOperation(operationID string) bool {
	switch operationID {
	case "GetHealth", "Login", "Logout":
		return false
	default:
		return true
	}
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(unauthorized())
}

func unauthorized() generated.UnauthorizedJSONResponse {
	return generated.UnauthorizedJSONResponse{Code: "unauthorized", Message: "Authentication is required."}
}

func notFound() generated.NotFoundJSONResponse {
	return generated.NotFoundJSONResponse{Code: "not_found", Message: "The requested resource was not found."}
}

func conflict() generated.ConflictJSONResponse {
	return generated.ConflictJSONResponse{Code: "conflict", Message: "The requested change conflicts with the current resource state."}
}

func isAuthFailure(err error) bool {
	return errors.Is(err, auth.ErrInvalidCredentials) || errors.Is(err, auth.ErrInvalidToken) || errors.Is(err, auth.ErrExpiredToken)
}

func isNotFound(err error) bool {
	return errors.Is(err, storage.ErrNotFound)
}

func isInvalidHierarchy(err error) bool {
	return errors.Is(err, storage.ErrInvalidHierarchy)
}
