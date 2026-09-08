// Package api adapts the generated HTTP contract to application behavior.
package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
)

type handler struct{}

var _ generated.StrictServerInterface = handler{}

func (handler) GetHealth(context.Context, generated.GetHealthRequestObject) (generated.GetHealthResponseObject, error) {
	return generated.GetHealth200JSONResponse{Status: generated.Ok}, nil
}

func NewHandler(origins []string) http.Handler {
	api := generated.Handler(generated.NewStrictHandler(handler{}, nil))
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
			if !allowed[origin] || r.Header.Get("Access-Control-Request-Method") != http.MethodGet {
				http.Error(w, "CORS preflight is not allowed", http.StatusForbidden)
				return
			}
			for _, header := range strings.Split(r.Header.Get("Access-Control-Request-Headers"), ",") {
				switch strings.ToLower(strings.TrimSpace(header)) {
				case "", "accept", "content-type":
				default:
					http.Error(w, "CORS request header is not allowed", http.StatusForbidden)
					return
				}
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		api.ServeHTTP(w, r)
	})
}
