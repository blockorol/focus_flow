// Package postgres implements PostgreSQL connection lifecycle and storage repositories using pgx.
package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/blockorol/focus_flow/backend/internal/storage"
	"github.com/jackc/pgx/v5/pgxpool"
)

const StartupTimeout = 10 * time.Second

type Store struct {
	pool *pgxpool.Pool
	now  func() time.Time
}

var _ storage.Connection = (*Store)(nil)
var _ storage.FocusStore = (*Store)(nil)
var _ storage.GoalStore = (*Store)(nil)

func Open(ctx context.Context, databaseURL string) (*Store, error) {
	connection, err := open(ctx, databaseURL, func(ctx context.Context, value string) (storage.Connection, error) {
		pool, err := pgxpool.New(ctx, value)
		if err != nil {
			return nil, err
		}
		return &Store{pool: pool, now: time.Now}, nil
	})
	if err != nil {
		return nil, err
	}
	return connection.(*Store), nil
}

func open(ctx context.Context, databaseURL string, factory func(context.Context, string) (storage.Connection, error)) (storage.Connection, error) {
	ctx, cancel := context.WithTimeout(ctx, StartupTimeout)
	defer cancel()
	connection, err := factory(ctx, databaseURL)
	if err != nil {
		return nil, errors.New("database connection configuration is invalid")
	}
	if err := connection.Ping(ctx); err != nil {
		connection.Close()
		return nil, errors.New("database startup ping failed; check connectivity and database configuration")
	}
	return connection, nil
}

func (store *Store) Ping(ctx context.Context) error {
	return store.pool.Ping(ctx)
}

func (store *Store) Close() {
	store.pool.Close()
}
