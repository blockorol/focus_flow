package postgres

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

func (store *Store) ListFocusGoals(ctx context.Context, _ core.UserID, focusID core.FocusID, page core.PageRequest) (core.Page[core.Goal], error) {
	if _, err := store.getFocusBase(ctx, focusID); err != nil {
		return core.Page[core.Goal]{}, err
	}
	rows, err := store.pool.Query(ctx, `
SELECT id, focus_object_id, type, description, status_override, created_at, updated_at, finished_at
FROM focus_goal
WHERE focus_object_id = $1 AND ($2::uuid IS NULL OR id > $2)
ORDER BY id
LIMIT $3`, uuid.UUID(focusID), cursorUUID(page.Cursor), pageLimit(page)+1)
	if err != nil {
		return core.Page[core.Goal]{}, err
	}
	items, err := store.scanGoalRows(ctx, rows)
	if err != nil {
		return core.Page[core.Goal]{}, err
	}
	return goalPageFromItems(items, pageLimit(page)), nil
}

func (store *Store) CreateGoal(ctx context.Context, _ core.UserID, input core.CreateGoal) (core.Goal, error) {
	if _, err := store.getFocusBase(ctx, input.OwnerFocusID); err != nil {
		return core.Goal{}, err
	}
	tx, err := store.pool.Begin(ctx)
	if err != nil {
		return core.Goal{}, err
	}
	defer tx.Rollback(ctx)
	id := newID()
	now := store.now().UTC()
	row := focusGoalRow{ID: id, FocusObjectID: uuid.UUID(input.OwnerFocusID), Type: string(input.Type), Description: input.Description, StatusOverride: statusStringPtr(input.StatusOverride), CreatedAt: now, UpdatedAt: now}
	if err := tx.QueryRow(ctx, `
INSERT INTO focus_goal (id, focus_object_id, type, description, status_override, created_at, updated_at, finished_at)
VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
RETURNING id, focus_object_id, type, description, status_override, created_at, updated_at, finished_at`, row.ID, row.FocusObjectID, row.Type, row.Description, row.StatusOverride, row.CreatedAt, row.FinishedAt).Scan(&row.ID, &row.FocusObjectID, &row.Type, &row.Description, &row.StatusOverride, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
		return core.Goal{}, mapNotFound(err)
	}
	for _, focusID := range input.LinkedFocusIDs {
		if _, err := tx.Exec(ctx, `INSERT INTO focus_goal_link (goal_id, focus_object_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, row.ID, uuid.UUID(focusID)); err != nil {
			return core.Goal{}, mapNotFound(err)
		}
	}
	if err := insertEventTx(ctx, tx, nil, &row.ID, "goal.created", "api"); err != nil {
		return core.Goal{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return core.Goal{}, err
	}
	return store.GetGoal(ctx, core.UserID{}, core.GoalID(row.ID))
}

func (store *Store) GetGoal(ctx context.Context, _ core.UserID, id core.GoalID) (core.Goal, error) {
	row := focusGoalRow{}
	err := store.pool.QueryRow(ctx, `
SELECT id, focus_object_id, type, description, status_override, created_at, updated_at, finished_at
FROM focus_goal
WHERE id = $1`, uuid.UUID(id)).Scan(&row.ID, &row.FocusObjectID, &row.Type, &row.Description, &row.StatusOverride, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt)
	if err != nil {
		return core.Goal{}, mapNotFound(err)
	}
	return store.goalAggregate(ctx, goalFromRow(row))
}

func (store *Store) UpdateGoal(ctx context.Context, _ core.UserID, input core.UpdateGoal) (core.Goal, error) {
	current, err := store.GetGoal(ctx, core.UserID{}, input.ID)
	if err != nil {
		return core.Goal{}, err
	}
	if input.Type != nil {
		current.Type = *input.Type
	}
	if input.Description != nil {
		current.Description = *input.Description
	}
	if input.StatusOverride.Set {
		current.StatusOverride = input.StatusOverride.Value
	}
	if input.LinkedFocusIDs != nil {
		current.LinkedFocusIDs = append([]core.FocusID(nil), (*input.LinkedFocusIDs)...)
	}
	tx, err := store.pool.Begin(ctx)
	if err != nil {
		return core.Goal{}, err
	}
	defer tx.Rollback(ctx)
	now := store.now().UTC()
	row := focusGoalRow{ID: uuid.UUID(current.ID), FocusObjectID: uuid.UUID(current.OwnerFocusID), Type: string(current.Type), Description: current.Description, StatusOverride: statusStringPtr(current.StatusOverride), UpdatedAt: now, FinishedAt: current.FinishedAt}
	if err := tx.QueryRow(ctx, `
UPDATE focus_goal
SET type = $2, description = $3, status_override = $4, updated_at = $5, finished_at = $6
WHERE id = $1
RETURNING id, focus_object_id, type, description, status_override, created_at, updated_at, finished_at`, row.ID, row.Type, row.Description, row.StatusOverride, row.UpdatedAt, row.FinishedAt).Scan(&row.ID, &row.FocusObjectID, &row.Type, &row.Description, &row.StatusOverride, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
		return core.Goal{}, mapNotFound(err)
	}
	if input.LinkedFocusIDs != nil {
		if _, err := tx.Exec(ctx, `DELETE FROM focus_goal_link WHERE goal_id = $1`, row.ID); err != nil {
			return core.Goal{}, err
		}
		for _, focusID := range *input.LinkedFocusIDs {
			if _, err := tx.Exec(ctx, `INSERT INTO focus_goal_link (goal_id, focus_object_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, row.ID, uuid.UUID(focusID)); err != nil {
				return core.Goal{}, mapNotFound(err)
			}
		}
	}
	if err := insertEventTx(ctx, tx, nil, &row.ID, "goal.updated", "api"); err != nil {
		return core.Goal{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return core.Goal{}, err
	}
	return store.GetGoal(ctx, core.UserID{}, core.GoalID(row.ID))
}

func (store *Store) DeleteGoal(ctx context.Context, _ core.UserID, id core.GoalID) error {
	goalID := uuid.UUID(id)
	if _, err := store.GetGoal(ctx, core.UserID{}, id); err != nil {
		return err
	}
	if err := store.insertEvent(ctx, nil, &goalID, "goal.deleted", "api"); err != nil {
		return err
	}
	command, err := store.pool.Exec(ctx, `DELETE FROM focus_goal WHERE id = $1`, goalID)
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return storage.ErrNotFound
	}
	return nil
}

func (store *Store) LinkGoalFocus(ctx context.Context, _ core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	if _, err := store.getFocusBase(ctx, link.FocusID); err != nil {
		return core.Goal{}, err
	}
	if _, err := store.GetGoal(ctx, core.UserID{}, link.GoalID); err != nil {
		return core.Goal{}, err
	}
	goalID := uuid.UUID(link.GoalID)
	if _, err := store.pool.Exec(ctx, `INSERT INTO focus_goal_link (goal_id, focus_object_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, goalID, uuid.UUID(link.FocusID)); err != nil {
		return core.Goal{}, err
	}
	if err := store.insertEvent(ctx, nil, &goalID, "goal.link_added", "api"); err != nil {
		return core.Goal{}, err
	}
	return store.GetGoal(ctx, core.UserID{}, link.GoalID)
}

func (store *Store) UnlinkGoalFocus(ctx context.Context, _ core.UserID, link core.GoalFocusLink) (core.Goal, error) {
	goalID := uuid.UUID(link.GoalID)
	command, err := store.pool.Exec(ctx, `DELETE FROM focus_goal_link WHERE goal_id = $1 AND focus_object_id = $2`, goalID, uuid.UUID(link.FocusID))
	if err != nil {
		return core.Goal{}, err
	}
	if command.RowsAffected() == 0 {
		if _, err := store.GetGoal(ctx, core.UserID{}, link.GoalID); err != nil {
			return core.Goal{}, err
		}
	}
	if err := store.insertEvent(ctx, nil, &goalID, "goal.link_removed", "api"); err != nil {
		return core.Goal{}, err
	}
	return store.GetGoal(ctx, core.UserID{}, link.GoalID)
}

func (store *Store) scanGoalRows(ctx context.Context, rows pgx.Rows) ([]core.Goal, error) {
	defer rows.Close()
	items := []core.Goal{}
	for rows.Next() {
		row := focusGoalRow{}
		if err := rows.Scan(&row.ID, &row.FocusObjectID, &row.Type, &row.Description, &row.StatusOverride, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
			return nil, err
		}
		goal, err := store.goalAggregate(ctx, goalFromRow(row))
		if err != nil {
			return nil, err
		}
		items = append(items, goal)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (store *Store) goalAggregate(ctx context.Context, goal core.Goal) (core.Goal, error) {
	linkedRows, err := store.pool.Query(ctx, `
SELECT link.focus_object_id, focus.status
FROM focus_goal_link link
INNER JOIN focus_object focus ON focus.id = link.focus_object_id
WHERE link.goal_id = $1
ORDER BY link.focus_object_id`, uuid.UUID(goal.ID))
	if err != nil {
		return core.Goal{}, err
	}
	defer linkedRows.Close()
	goal.LinkedFocusIDs = []core.FocusID{}
	goal.Progress = core.GoalProgress{StatusCounts: map[core.FocusStatus]int{}}
	for linkedRows.Next() {
		var focusID uuid.UUID
		var status string
		if err := linkedRows.Scan(&focusID, &status); err != nil {
			return core.Goal{}, err
		}
		focusStatus := core.FocusStatus(status)
		goal.LinkedFocusIDs = append(goal.LinkedFocusIDs, core.FocusID(focusID))
		goal.Progress.LinkedCount++
		goal.Progress.StatusCounts[focusStatus]++
		if focusStatus == core.FocusStatusDone || focusStatus == core.FocusStatusCancelled {
			goal.Progress.TerminalCount++
		}
		if focusStatus == core.FocusStatusDone {
			goal.Progress.DoneCount++
		}
	}
	if err := linkedRows.Err(); err != nil {
		return core.Goal{}, err
	}
	return goal, nil
}

func (store *Store) listSpecifications(ctx context.Context, focusID core.FocusID) ([]core.Specification, error) {
	rows, err := store.pool.Query(ctx, `
SELECT id, focus_object_id, type, schema_version, data, created_at, updated_at
FROM focus_specification
WHERE focus_object_id = $1
ORDER BY id`, uuid.UUID(focusID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []core.Specification{}
	for rows.Next() {
		row := focusSpecificationRow{}
		if err := rows.Scan(&row.ID, &row.FocusObjectID, &row.Type, &row.SchemaVersion, &row.Data, &row.CreatedAt, &row.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, specificationFromRow(row))
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func (store *Store) insertEvent(ctx context.Context, focusID *uuid.UUID, goalID *uuid.UUID, eventType string, source string) error {
	_, err := store.pool.Exec(ctx, `
INSERT INTO focus_event (id, focus_object_id, goal_id, type, source, data, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)`, newID(), focusID, goalID, eventType, source, json.RawMessage(`{}`), store.now().UTC())
	return err
}

func insertEventTx(ctx context.Context, tx pgx.Tx, focusID *uuid.UUID, goalID *uuid.UUID, eventType string, source string) error {
	_, err := tx.Exec(ctx, `
INSERT INTO focus_event (id, focus_object_id, goal_id, type, source, data, created_at)
VALUES ($1, $2, $3, $4, $5, $6, now())`, newID(), focusID, goalID, eventType, source, json.RawMessage(`{}`))
	return err
}
