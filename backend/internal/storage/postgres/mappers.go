package postgres

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func focusFromRow(row focusObjectRow) core.Focus {
	return core.Focus{
		ID:          core.FocusID(row.ID),
		ParentID:    focusIDPtr(row.ParentID),
		Name:        row.Name,
		Status:      core.FocusStatus(row.Status),
		Tags:        append([]string(nil), row.Tags...),
		Description: row.Description,
		Feedback:    row.Feedback,
		Color:       row.Color,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
		FinishedAt:  row.FinishedAt,
	}
}

func goalFromRow(row focusGoalRow) core.Goal {
	return core.Goal{
		ID:             core.GoalID(row.ID),
		OwnerFocusID:   core.FocusID(row.FocusObjectID),
		Type:           core.GoalType(row.Type),
		Description:    row.Description,
		StatusOverride: focusStatusPtr(row.StatusOverride),
		CreatedAt:      row.CreatedAt,
		UpdatedAt:      row.UpdatedAt,
		FinishedAt:     row.FinishedAt,
	}
}

func specificationFromRow(row focusSpecificationRow) core.Specification {
	return core.Specification{
		ID:            core.SpecificationID(row.ID),
		FocusID:       core.FocusID(row.FocusObjectID),
		Type:          row.Type,
		SchemaVersion: row.SchemaVersion,
		Data:          append(json.RawMessage(nil), row.Data...),
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
}

func focusIDPtr(value *uuid.UUID) *core.FocusID {
	if value == nil {
		return nil
	}
	converted := core.FocusID(*value)
	return &converted
}

func uuidPtr(value *core.FocusID) *uuid.UUID {
	if value == nil {
		return nil
	}
	converted := uuid.UUID(*value)
	return &converted
}

func focusStatusPtr(value *string) *core.FocusStatus {
	if value == nil {
		return nil
	}
	converted := core.FocusStatus(*value)
	return &converted
}

func statusStringPtr(value *core.FocusStatus) *string {
	if value == nil {
		return nil
	}
	converted := string(*value)
	return &converted
}

func finishedAtForStatus(status core.FocusStatus, now time.Time) *time.Time {
	if status == core.FocusStatusDone || status == core.FocusStatusCancelled {
		finished := now
		return &finished
	}
	return nil
}
