package model

import (
	"context"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

type userIDContextKey struct{}

func ContextWithUserID(ctx context.Context, userID core.UserID) context.Context {
	return context.WithValue(ctx, userIDContextKey{}, userID)
}

func UserIDFromContext(ctx context.Context) (core.UserID, bool) {
	value, ok := ctx.Value(userIDContextKey{}).(core.UserID)
	return value, ok
}
