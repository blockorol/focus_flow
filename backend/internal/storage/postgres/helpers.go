package postgres

import (
	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func newID() uuid.UUID {
	id, err := uuid.NewV7()
	if err == nil {
		return id
	}
	return uuid.New()
}

func pageLimit(request core.PageRequest) int {
	if request.Limit <= 0 || request.Limit > 100 {
		return 50
	}
	return request.Limit
}

func cursorUUID(cursor *string) *uuid.UUID {
	if cursor == nil || *cursor == "" {
		return nil
	}
	id, err := uuid.Parse(*cursor)
	if err != nil {
		return nil
	}
	return &id
}

func focusPageFromItems(items []core.Focus, limit int) core.Page[core.Focus] {
	page := core.Page[core.Focus]{Items: items, Count: len(items)}
	if len(items) > limit {
		page.Items = items[:limit]
		page.Count = len(page.Items)
		page.HasMore = true
		next := page.Items[len(page.Items)-1].ID.String()
		page.NextCursor = &next
	}
	return page
}

func goalPageFromItems(items []core.Goal, limit int) core.Page[core.Goal] {
	page := core.Page[core.Goal]{Items: items, Count: len(items)}
	if len(items) > limit {
		page.Items = items[:limit]
		page.Count = len(page.Items)
		page.HasMore = true
		next := page.Items[len(page.Items)-1].ID.String()
		page.NextCursor = &next
	}
	return page
}
