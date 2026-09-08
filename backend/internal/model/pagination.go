package model

type PageRequest struct {
	Limit  int
	Cursor *string
}

type Page[T any] struct {
	Items      []T
	Count      int
	NextCursor *string
	HasMore    bool
}
