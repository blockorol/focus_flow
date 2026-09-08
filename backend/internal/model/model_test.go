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

func TestFocusIsAggregateRoot(t *testing.T) {
	childID := FocusID(uuid.New())
	goalID := GoalID(uuid.New())
	specID := SpecificationID(uuid.New())
	focus := Focus{
		Children:       []Focus{{ID: childID}},
		Goals:          []Goal{{ID: goalID}},
		Specifications: []Specification{{ID: specID}},
	}
	if focus.Children[0].ID != childID || focus.Goals[0].ID != goalID || focus.Specifications[0].ID != specID {
		t.Fatal("Focus should hold nested aggregate data for service responses")
	}
}
