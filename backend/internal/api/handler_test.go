package api

import (
	"bytes"
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
		{"allowed preflight", "http://localhost:3000", "OPTIONS", "PATCH", "content-type, authorization", 204, true},
		{"disallowed origin", "https://other.test", "OPTIONS", "POST", "", 403, false},
		{"unsupported method", "http://localhost:3000", "OPTIONS", "PUT", "", 403, true},
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

func TestMockAPIEndpoints(t *testing.T) {
	handler := NewHandler([]string{"http://localhost:3000"})
	focusID := "018f6f1f-9a7b-7000-8000-000000000100"
	goalID := "018f6f1f-9a7b-7000-8000-000000000200"
	childID := "018f6f1f-9a7b-7000-8000-000000000101"

	tests := []struct {
		name   string
		method string
		path   string
		body   string
		status int
	}{
		{"login", "POST", "/v1/auth/login", `{"username":"demo","password":"demo"}`, 200},
		{"refresh", "POST", "/v1/auth/refresh", ``, 200},
		{"me", "GET", "/v1/auth/me", ``, 200},
		{"list flows", "GET", "/v1/flows?include=goals,children&depth=1", ``, 200},
		{"create flow", "POST", "/v1/flows", `{"name":"Root"}`, 201},
		{"create focus", "POST", "/v1/focuses", `{"parentId":"` + focusID + `","name":"Child"}`, 201},
		{"get focus", "GET", "/v1/focuses/" + focusID + "?include=goals,children&depth=1", ``, 200},
		{"update focus", "PATCH", "/v1/focuses/" + focusID, `{"name":"Updated","clearFields":["description"]}`, 200},
		{"delete focus", "DELETE", "/v1/focuses/" + focusID, ``, 204},
		{"list children", "GET", "/v1/focuses/" + focusID + "/children?limit=10", ``, 200},
		{"list goals", "GET", "/v1/focuses/" + focusID + "/goals", ``, 200},
		{"create goal", "POST", "/v1/focuses/" + focusID + "/goals", `{"type":"primary","description":"Finish children"}`, 201},
		{"get goal", "GET", "/v1/goals/" + goalID, ``, 200},
		{"update goal", "PATCH", "/v1/goals/" + goalID, `{"clearFields":["statusOverride"]}`, 200},
		{"link goal", "POST", "/v1/goals/" + goalID + "/focuses", `{"focusId":"` + childID + `"}`, 200},
		{"unlink goal", "DELETE", "/v1/goals/" + goalID + "/focuses/" + childID, ``, 200},
		{"delete goal", "DELETE", "/v1/goals/" + goalID, ``, 204},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := httptest.NewRequest(test.method, test.path, bytes.NewBufferString(test.body))
			if test.body != "" {
				r.Header.Set("Content-Type", "application/json")
			}
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, r)
			if w.Code != test.status {
				t.Fatalf("status: %d body: %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestFocusAPIResponseDoesNotExposeSpecificationsBeforeContractExists(t *testing.T) {
	w := httptest.NewRecorder()
	NewHandler(nil).ServeHTTP(w, httptest.NewRequest("GET", "/v1/focuses/018f6f1f-9a7b-7000-8000-000000000100", nil))
	if w.Code != 200 {
		t.Fatalf("status: %d", w.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	focus, ok := body["focus"].(map[string]any)
	if !ok {
		t.Fatalf("focus response was not an object: %#v", body)
	}
	if _, ok := focus["specifications"]; ok {
		t.Fatal("specifications must not be exposed before typed API specifications are added")
	}
}

func TestUserAPIRequiresUserIDContext(t *testing.T) {
	response, err := userAPI{}.GetCurrentSession(context.Background(), generated.GetCurrentSessionRequestObject{})
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := response.(generated.GetCurrentSession401JSONResponse); !ok {
		t.Fatalf("expected unauthorized response, got %T", response)
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
