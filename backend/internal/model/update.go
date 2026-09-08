package model

type NullableUpdate[T any] struct {
	Set   bool
	Value *T
}
