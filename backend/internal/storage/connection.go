// Package storage defines the boundaries implemented by database adapters.
// Domain repositories will be introduced with their Phase 1 use cases.
package storage

import "context"

type Connection interface {
	Ping(context.Context) error
	Close()
}
