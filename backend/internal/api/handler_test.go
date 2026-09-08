package api

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
)

func TestHealthMatchesContract(t *testing.T) {
	w := httptest.NewRecorder()
	NewHandler([]string{"http://localhost:3000"}).ServeHTTP(w, httptest.NewRequest("GET", "/v1/health", nil))
	if w.Code != 200 || w.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("unexpected response: %d %v", w.Code, w.Header())
	}
	var body any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	spec, err := generated.GetSpec()
	if err != nil {
		t.Fatal(err)
	}
	if err := spec.Validate(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := spec.Components.Schemas["HealthResponse"].Value.VisitJSON(body); err != nil {
		t.Fatal(err)
	}
}

func TestCORS(t *testing.T) {
	for _, test := range []struct {
		name, origin, method, requestedMethod, headers string
		status                                         int
		allow                                          bool
	}{
		{"allowed actual", "http://localhost:3000", "GET", "", "", 200, true},
		{"disallowed actual", "https://other.test", "GET", "", "", 200, false},
		{"allowed preflight", "http://localhost:3000", "OPTIONS", "GET", "content-type", 204, true},
		{"disallowed origin", "https://other.test", "OPTIONS", "GET", "", 403, false},
		{"unsupported method", "http://localhost:3000", "OPTIONS", "DELETE", "", 403, true},
		{"unsupported header", "http://localhost:3000", "OPTIONS", "GET", "x-unknown", 403, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			r := httptest.NewRequest(test.method, "/v1/health", nil)
			r.Header.Set("Origin", test.origin)
			r.Header.Set("Access-Control-Request-Method", test.requestedMethod)
			r.Header.Set("Access-Control-Request-Headers", test.headers)
			w := httptest.NewRecorder()
			NewHandler([]string{"http://localhost:3000"}).ServeHTTP(w, r)
			if w.Code != test.status {
				t.Fatalf("status: %d", w.Code)
			}
			if test.allow {
				if w.Header().Get("Access-Control-Allow-Origin") != test.origin || w.Header().Get("Access-Control-Allow-Credentials") != "true" {
					t.Fatal("credentialed origin headers missing")
				}
			} else if w.Header().Get("Access-Control-Allow-Origin") != "" {
				t.Fatal("unexpected CORS permission")
			}
		})
	}
}

func TestServerShutdown(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- Serve(ctx, listener, NewHandler(nil)) }()
	client := &http.Client{Timeout: 3 * time.Second}
	response, err := client.Get("http://" + listener.Addr().String() + "/v1/health")
	if err != nil {
		t.Fatal(err)
	}
	_ = response.Body.Close()
	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("shutdown timed out")
	}
}
