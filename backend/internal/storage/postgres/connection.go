// Package postgres implements PostgreSQL connection lifecycle using pgx.
package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/blockorol/focus_flow/backend/internal/storage"
	"github.com/jackc/pgx/v5/pgxpool"
)

const StartupTimeout = 10 * time.Second

func Open(ctx context.Context, databaseURL string) (storage.Connection, error) {
	return open(ctx, databaseURL, func(ctx context.Context, value string) (storage.Connection, error) {
		return pgxpool.New(ctx, value)
	})
}

func open(ctx context.Context, databaseURL string, factory func(context.Context, string) (storage.Connection, error)) (storage.Connection, error) {
	ctx, cancel := context.WithTimeout(ctx, StartupTimeout)
	defer cancel()
	pool, err := factory(ctx, databaseURL)
	if err != nil {
		return nil, errors.New("database connection configuration is invalid")
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, errors.New("database startup ping failed; check connectivity and database configuration")
	}
	return pool, nil
}
