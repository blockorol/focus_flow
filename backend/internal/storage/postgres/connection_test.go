package postgres

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/blockorol/focus_flow/backend/internal/storage"
)

type fakeConnection struct {
	failure  error
	closed   bool
	deadline bool
}

func (f *fakeConnection) Ping(ctx context.Context) error {
	_, f.deadline = ctx.Deadline()
	return f.failure
}
func (f *fakeConnection) Close() { f.closed = true }

func TestStartupLifecycle(t *testing.T) {
	for _, fail := range []bool{false, true} {
		pool := &fakeConnection{}
		if fail {
			pool.failure = errors.New("private-connection-details")
		}
		got, err := open(context.Background(), "unused", func(context.Context, string) (storage.Connection, error) { return pool, nil })
		if !pool.deadline {
			t.Fatal("startup ping must have a deadline")
		}
		if fail {
			if err == nil || !pool.closed || got != nil {
				t.Fatal("failed startup did not release its connection")
			}
			if strings.Contains(err.Error(), "private-connection-details") {
				t.Fatal("error exposed connection details")
			}
		} else {
			if err != nil || pool.closed || got != pool {
				t.Fatal("successful startup lost its connection")
			}
			got.Close()
		}
	}
}

func TestConfigurationFailureIsRedacted(t *testing.T) {
	_, err := open(context.Background(), "unused", func(context.Context, string) (storage.Connection, error) { return nil, errors.New("secret") })
	if err == nil || strings.Contains(err.Error(), "secret") {
		t.Fatal("expected a redacted configuration error")
	}
}
