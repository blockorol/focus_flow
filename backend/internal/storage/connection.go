// Package storage defines backend storage boundaries.
package storage

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("not found")

type Connection interface {
	Ping(context.Context) error
	Close()
}
