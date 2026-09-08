package model

import (
	"testing"

	"github.com/google/uuid"
)

func TestIDAliasesUseUUID(t *testing.T) {
	id := uuid.New()
	var userID UserID = id
	var focusID FocusID = id
	if userID != id || focusID != id {
		t.Fatal("ID aliases must preserve uuid.UUID values")
	}
}
