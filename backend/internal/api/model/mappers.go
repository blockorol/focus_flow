package model

import (
	"github.com/blockorol/focus_flow/backend/internal/api/generated"
	core "github.com/blockorol/focus_flow/backend/internal/model"
)

func FocusFromInternal(value core.Focus) generated.Focus {
	children := make([]generated.Focus, 0, len(value.Children))
	for _, child := range value.Children {
		children = append(children, FocusFromInternal(child))
	}
	goals := make([]generated.Goal, 0, len(value.Goals))
	for _, goal := range value.Goals {
		goals = append(goals, GoalFromInternal(goal))
	}
	return generated.Focus{
		Id:          generated.UUID(value.ID),
		ParentId:    uuidPtrToGenerated(value.ParentID),
		Name:        value.Name,
		Status:      generated.FocusStatus(value.Status),
		Tags:        append([]string(nil), value.Tags...),
		Description: value.Description,
		Feedback:    value.Feedback,
		Color:       value.Color,
		Goals:       goals,
		Children:    children,
		CreatedAt:   value.CreatedAt,
		UpdatedAt:   value.UpdatedAt,
		FinishedAt:  timePtrToGenerated(value.FinishedAt),
	}
}

func GoalFromInternal(value core.Goal) generated.Goal {
	linked := make([]generated.UUID, 0, len(value.LinkedFocusIDs))
	for _, id := range value.LinkedFocusIDs {
		linked = append(linked, generated.UUID(id))
	}
	return generated.Goal{
		Id:             generated.UUID(value.ID),
		OwnerFocusId:   generated.UUID(value.OwnerFocusID),
		Type:           generated.GoalType(value.Type),
		Description:    value.Description,
		StatusOverride: goalStatusOverridePtrToGenerated(value.StatusOverride),
		LinkedFocusIds: linked,
		Progress:       GoalProgressFromInternal(value.Progress),
		CreatedAt:      value.CreatedAt,
		UpdatedAt:      value.UpdatedAt,
		FinishedAt:     timePtrToGenerated(value.FinishedAt),
	}
}

func GoalProgressFromInternal(value core.GoalProgress) generated.GoalProgress {
	counts := make(map[string]int, len(value.StatusCounts))
	for status, count := range value.StatusCounts {
		counts[string(status)] = count
	}
	return generated.GoalProgress{
		LinkedCount:   value.LinkedCount,
		TerminalCount: value.TerminalCount,
		DoneCount:     value.DoneCount,
		StatusCounts:  counts,
	}
}

func UserFromInternal(value core.User) generated.User {
	return generated.User{Id: generated.UUID(value.ID), Username: value.Username}
}

func SessionFromInternal(value core.Session) generated.AuthSession {
	return generated.AuthSession{User: UserFromInternal(value.User), ExpiresAt: value.ExpiresAt}
}

func CreateFocusToInternal(value generated.CreateFocusRequest) core.CreateFocus {
	return core.CreateFocus{
		ParentID:    generatedPtrToFocusID(value.ParentId),
		Name:        value.Name,
		Status:      focusStatusPtrToInternal(value.Status),
		Tags:        sliceFromPtr(value.Tags),
		Description: value.Description,
		Feedback:    value.Feedback,
		Color:       value.Color,
	}
}

func CreateFlowToInternal(value generated.CreateFlowRequest) core.CreateFocus {
	return core.CreateFocus{
		Name:        value.Name,
		Status:      focusStatusPtrToInternal(value.Status),
		Tags:        sliceFromPtr(value.Tags),
		Description: value.Description,
		Feedback:    value.Feedback,
		Color:       value.Color,
	}
}

func UpdateFocusToInternal(id generated.UUID, value generated.UpdateFocusRequest) core.UpdateFocus {
	update := core.UpdateFocus{
		ID:          core.FocusID(id),
		Name:        value.Name,
		Status:      focusStatusPtrToInternal(value.Status),
		Tags:        value.Tags,
		Description: nullableStringValue(value.Description),
		Feedback:    nullableStringValue(value.Feedback),
		Color:       nullableStringValue(value.Color),
	}
	if value.ParentId != nil {
		update.ParentID = core.NullableUpdate[core.FocusID]{Set: true, Value: generatedPtrToFocusID(value.ParentId)}
	}
	for _, field := range sliceFromPtr(value.ClearFields) {
		switch field {
		case generated.ParentId:
			update.ParentID = core.NullableUpdate[core.FocusID]{Set: true}
		case generated.Description:
			update.Description = core.NullableUpdate[string]{Set: true}
		case generated.Feedback:
			update.Feedback = core.NullableUpdate[string]{Set: true}
		case generated.Color:
			update.Color = core.NullableUpdate[string]{Set: true}
		}
	}
	return update
}

func CreateGoalToInternal(ownerFocusID generated.UUID, value generated.CreateGoalRequest) core.CreateGoal {
	return core.CreateGoal{
		OwnerFocusID:   core.FocusID(ownerFocusID),
		Type:           core.GoalType(value.Type),
		Description:    value.Description,
		StatusOverride: createGoalStatusOverridePtrToInternal(value.StatusOverride),
		LinkedFocusIDs: generatedIDsToFocusIDs(sliceFromPtr(value.LinkedFocusIds)),
	}
}

func UpdateGoalToInternal(id generated.UUID, value generated.UpdateGoalRequest) core.UpdateGoal {
	update := core.UpdateGoal{
		ID:             core.GoalID(id),
		Type:           goalTypePtrToInternal(value.Type),
		Description:    value.Description,
		StatusOverride: nullableFocusStatusValue(value.StatusOverride),
		LinkedFocusIDs: focusIDsPtr(value.LinkedFocusIds),
	}
	for _, field := range sliceFromPtr(value.ClearFields) {
		if field == generated.StatusOverride {
			update.StatusOverride = core.NullableUpdate[core.FocusStatus]{Set: true}
		}
	}
	return update
}

func LoginToInternal(value generated.LoginRequest) core.LoginCredentials {
	return core.LoginCredentials{Username: value.Username, Password: value.Password}
}

func QueryFromParams(id generated.UUID, include *generated.Include, depth *generated.Depth) (core.FocusQuery, error) {
	query := core.FocusQuery{ID: core.FocusID(id)}
	if include != nil {
		for _, token := range splitInclude(string(*include)) {
			switch token {
			case "goals":
				query.IncludeGoals = true
			case "children":
				if query.DescendantDepth == 0 {
					query.DescendantDepth = 1
				}
			default:
				return core.FocusQuery{}, UnsupportedIncludeError(token)
			}
		}
	}
	if depth != nil {
		query.DescendantDepth = int(*depth)
	}
	return query, nil
}

func PageRequestFromParams(limit *generated.Limit, cursor *generated.Cursor) core.PageRequest {
	request := core.PageRequest{Limit: 50}
	if limit != nil {
		request.Limit = int(*limit)
	}
	if cursor != nil {
		value := string(*cursor)
		request.Cursor = &value
	}
	return request
}

func FocusPageFromInternal(value core.Page[core.Focus]) generated.FocusPage {
	items := make([]generated.Focus, 0, len(value.Items))
	for _, item := range value.Items {
		items = append(items, FocusFromInternal(item))
	}
	return generated.FocusPage{Items: items, Count: value.Count, NextCursor: value.NextCursor, HasMore: value.HasMore}
}

func GoalPageFromInternal(value core.Page[core.Goal]) generated.GoalPage {
	items := make([]generated.Goal, 0, len(value.Items))
	for _, item := range value.Items {
		items = append(items, GoalFromInternal(item))
	}
	return generated.GoalPage{Items: items, Count: value.Count, NextCursor: value.NextCursor, HasMore: value.HasMore}
}

func LinkGoalFocusToInternal(goalID generated.UUID, value generated.LinkGoalFocusRequest) core.GoalFocusLink {
	return core.GoalFocusLink{GoalID: core.GoalID(goalID), FocusID: core.FocusID(value.FocusId)}
}

func UnlinkGoalFocusToInternal(goalID generated.UUID, focusID generated.UUID) core.GoalFocusLink {
	return core.GoalFocusLink{GoalID: core.GoalID(goalID), FocusID: core.FocusID(focusID)}
}

type UnsupportedIncludeError string

func (err UnsupportedIncludeError) Error() string {
	return "unsupported include value " + string(err)
}
