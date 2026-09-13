package auth

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func TestConfiguredUserVerifier(t *testing.T) {
	credential, err := NewPasswordCredential("correct horse")
	if err != nil {
		t.Fatal(err)
	}
	user := core.User{ID: uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"), Username: "local"}
	verifier := NewConfiguredUserVerifier(user, credential)

	got, err := verifier.Verify(context.Background(), core.LoginCredentials{Username: "local", Password: "correct horse"})
	if err != nil {
		t.Fatal(err)
	}
	if got != user {
		t.Fatalf("user mismatch: %#v", got)
	}

	for _, credentials := range []core.LoginCredentials{{Username: "other", Password: "correct horse"}, {Username: "local", Password: "wrong"}} {
		_, err := verifier.Verify(context.Background(), credentials)
		if !errors.Is(err, ErrInvalidCredentials) {
			t.Fatalf("expected invalid credentials, got %v", err)
		}
	}
}

func TestServiceIssuesVerifiesAndRefreshesToken(t *testing.T) {
	service := newTestService(t)
	issued, err := service.Login(context.Background(), core.LoginCredentials{Username: "local", Password: "secret"})
	if err != nil {
		t.Fatal(err)
	}
	if issued.Token == "" || !strings.Contains(issued.Token, ".") {
		t.Fatalf("token was not issued: %#v", issued)
	}
	if issued.Session.ExpiresAt.Sub(service.now()) != 2*time.Hour {
		t.Fatalf("unexpected expiration: %s", issued.Session.ExpiresAt)
	}

	session, err := service.VerifyToken(issued.Token)
	if err != nil {
		t.Fatal(err)
	}
	if session.User.Username != "local" {
		t.Fatalf("session was not decoded: %#v", session)
	}

	service.now = func() time.Time { return session.ExpiresAt.Add(-time.Minute) }
	refreshed, err := service.Refresh(session)
	if err != nil {
		t.Fatal(err)
	}
	if refreshed.Token == issued.Token || !refreshed.Session.ExpiresAt.After(session.ExpiresAt) {
		t.Fatalf("session was not refreshed: old=%#v new=%#v", issued, refreshed)
	}
}

func TestServiceRejectsInvalidAndExpiredTokens(t *testing.T) {
	service := newTestService(t)
	issued, err := service.Login(context.Background(), core.LoginCredentials{Username: "local", Password: "secret"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.VerifyToken(issued.Token + "x"); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("expected invalid token, got %v", err)
	}
	service.now = func() time.Time { return issued.Session.ExpiresAt }
	if _, err := service.VerifyToken(issued.Token); !errors.Is(err, ErrExpiredToken) {
		t.Fatalf("expected expired token, got %v", err)
	}
}

func TestServiceConfigValidation(t *testing.T) {
	credential, err := NewPasswordCredential("secret")
	if err != nil {
		t.Fatal(err)
	}
	verifier := NewConfiguredUserVerifier(core.User{ID: uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"), Username: "local"}, credential)
	if _, err := NewService(nil, []byte(strings.Repeat("a", 32)), time.Hour); err == nil {
		t.Fatal("missing verifier should fail")
	}
	if _, err := NewService(verifier, []byte("short"), time.Hour); err == nil {
		t.Fatal("short secret should fail")
	}
	if _, err := NewService(verifier, []byte(strings.Repeat("a", 32)), 0); err == nil {
		t.Fatal("non-positive ttl should fail")
	}
}

func newTestService(t *testing.T) Service {
	t.Helper()
	credential := passwordCredentialWithSalt("secret", []byte("0123456789abcdef"))
	user := core.User{ID: uuid.MustParse("018f6f1f-9a7b-7000-8000-000000000001"), Username: "local"}
	service, err := NewService(NewConfiguredUserVerifier(user, credential), []byte(strings.Repeat("s", 32)), 2*time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	service.now = func() time.Time { return time.Date(2026, 9, 13, 12, 0, 0, 0, time.UTC) }
	return service
}
