package model

import (
	"context"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

type userIDContextKey struct{}
type sessionContextKey struct{}

func ContextWithUserID(ctx context.Context, userID core.UserID) context.Context {
	return context.WithValue(ctx, userIDContextKey{}, userID)
}

func UserIDFromContext(ctx context.Context) (core.UserID, bool) {
	value, ok := ctx.Value(userIDContextKey{}).(core.UserID)
	return value, ok
}

func ContextWithSession(ctx context.Context, session core.Session) context.Context {
	ctx = context.WithValue(ctx, sessionContextKey{}, session)
	return ContextWithUserID(ctx, session.User.ID)
}

func SessionFromContext(ctx context.Context) (core.Session, bool) {
	value, ok := ctx.Value(sessionContextKey{}).(core.Session)
	return value, ok
}
