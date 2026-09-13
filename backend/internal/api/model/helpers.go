package model

import (
	"strings"
	"time"

	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func uuidPtrToGenerated(value *core.FocusID) *generated.UUID {
	if value == nil {
		return nil
	}
	converted := generated.UUID(*value)
	return &converted
}

func timePtrToGenerated(value *time.Time) *generated.Timestamp {
	if value == nil {
		return nil
	}
	converted := generated.Timestamp(*value)
	return &converted
}

func goalStatusOverridePtrToGenerated(value *core.FocusStatus) *generated.GoalStatusOverride {
	if value == nil {
		return nil
	}
	converted := generated.GoalStatusOverride(*value)
	return &converted
}

func generatedPtrToFocusID(value *generated.UUID) *core.FocusID {
	if value == nil {
		return nil
	}
	converted := core.FocusID(*value)
	return &converted
}

func focusStatusPtrToInternal(value *generated.FocusStatus) *core.FocusStatus {
	if value == nil {
		return nil
	}
	converted := core.FocusStatus(*value)
	return &converted
}

func createGoalStatusOverridePtrToInternal(value *generated.CreateGoalRequestStatusOverride) *core.FocusStatus {
	if value == nil {
		return nil
	}
	converted := core.FocusStatus(*value)
	return &converted
}

func goalTypePtrToInternal(value *generated.GoalType) *core.GoalType {
	if value == nil {
		return nil
	}
	converted := core.GoalType(*value)
	return &converted
}

func nullableStringValue(value *string) core.NullableUpdate[string] {
	return core.NullableUpdate[string]{Set: value != nil, Value: value}
}

func nullableFocusStatusValue(value *generated.FocusStatus) core.NullableUpdate[core.FocusStatus] {
	return core.NullableUpdate[core.FocusStatus]{Set: value != nil, Value: focusStatusPtrToInternal(value)}
}

func sliceFromPtr[T any](value *[]T) []T {
	if value == nil {
		return nil
	}
	return append([]T(nil), (*value)...)
}

func generatedIDsToFocusIDs(values []generated.UUID) []core.FocusID {
	ids := make([]core.FocusID, 0, len(values))
	for _, value := range values {
		ids = append(ids, core.FocusID(value))
	}
	return ids
}

func focusIDsPtr(values *[]generated.UUID) *[]core.FocusID {
	if values == nil {
		return nil
	}
	ids := generatedIDsToFocusIDs(*values)
	return &ids
}

func splitInclude(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
