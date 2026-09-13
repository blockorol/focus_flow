package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage"
)

func (store *Store) ListFlows(ctx context.Context, _ core.UserID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	rows, err := store.pool.Query(ctx, `
SELECT id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at
FROM focus_object
WHERE parent_id IS NULL AND ($1::uuid IS NULL OR id > $1)
ORDER BY id
LIMIT $2`, cursorUUID(page.Cursor), pageLimit(page)+1)
	if err != nil {
		return core.Page[core.Focus]{}, err
	}
	items, err := scanFocusRows(rows)
	if err != nil {
		return core.Page[core.Focus]{}, err
	}
	for i := range items {
		if err := store.attachFocusAggregate(ctx, &items[i], query.IncludeGoals, query.IncludeSpecs, query.DescendantDepth); err != nil {
			return core.Page[core.Focus]{}, err
		}
	}
	return focusPageFromItems(items, pageLimit(page)), nil
}

func (store *Store) CreateFlow(ctx context.Context, userID core.UserID, input core.CreateFocus) (core.Focus, error) {
	input.ParentID = nil
	return store.CreateFocus(ctx, userID, input)
}

func (store *Store) CreateFocus(ctx context.Context, _ core.UserID, input core.CreateFocus) (core.Focus, error) {
	id := newID()
	now := store.now().UTC()
	status := core.FocusStatusPlanned
	if input.Status != nil {
		status = *input.Status
	}
	row := focusObjectRow{ID: id, ParentID: uuidPtr(input.ParentID), Name: input.Name, Status: string(status), Tags: append([]string(nil), input.Tags...), Description: input.Description, Feedback: input.Feedback, Color: input.Color, CreatedAt: now, UpdatedAt: now, FinishedAt: finishedAtForStatus(status, now)}
	if row.Tags == nil {
		row.Tags = []string{}
	}
	if err := store.pool.QueryRow(ctx, `
INSERT INTO focus_object (id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at)
VALUES ($1, $2, $3, $4, COALESCE($5::text[], '{}'), $6, $7, $8, $9, $9, $10)
RETURNING id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at`, row.ID, row.ParentID, row.Name, row.Status, row.Tags, row.Description, row.Feedback, row.Color, row.CreatedAt, row.FinishedAt).Scan(&row.ID, &row.ParentID, &row.Name, &row.Status, &row.Tags, &row.Description, &row.Feedback, &row.Color, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
		return core.Focus{}, mapNotFound(err)
	}
	if err := store.insertEvent(ctx, &row.ID, nil, "focus.created", "api"); err != nil {
		return core.Focus{}, err
	}
	return focusFromRow(row), nil
}

func (store *Store) GetFocus(ctx context.Context, _ core.UserID, query core.FocusQuery) (core.Focus, error) {
	focus, err := store.getFocusBase(ctx, query.ID)
	if err != nil {
		return core.Focus{}, err
	}
	if err := store.attachFocusAggregate(ctx, &focus, query.IncludeGoals, query.IncludeSpecs, query.DescendantDepth); err != nil {
		return core.Focus{}, err
	}
	return focus, nil
}

func (store *Store) UpdateFocus(ctx context.Context, _ core.UserID, input core.UpdateFocus) (core.Focus, error) {
	current, err := store.getFocusBase(ctx, input.ID)
	if err != nil {
		return core.Focus{}, err
	}
	if input.ParentID.Set {
		if input.ParentID.Value != nil {
			if err := store.ensureCanMoveFocus(ctx, input.ID, *input.ParentID.Value); err != nil {
				return core.Focus{}, err
			}
		}
		current.ParentID = input.ParentID.Value
	}
	if input.Name != nil {
		current.Name = *input.Name
	}
	if input.Status != nil {
		current.Status = *input.Status
		current.FinishedAt = finishedAtForStatus(current.Status, store.now().UTC())
	}
	if input.Tags != nil {
		current.Tags = append([]string(nil), (*input.Tags)...)
	}
	if input.Description.Set {
		current.Description = input.Description.Value
	}
	if input.Feedback.Set {
		current.Feedback = input.Feedback.Value
	}
	if input.Color.Set {
		current.Color = input.Color.Value
	}
	current.UpdatedAt = store.now().UTC()
	row := focusObjectRow{ID: current.ID, ParentID: uuidPtr(current.ParentID), Name: current.Name, Status: string(current.Status), Tags: current.Tags, Description: current.Description, Feedback: current.Feedback, Color: current.Color, CreatedAt: current.CreatedAt, UpdatedAt: current.UpdatedAt, FinishedAt: current.FinishedAt}
	if err := store.pool.QueryRow(ctx, `
UPDATE focus_object
SET parent_id = $2, name = $3, status = $4, tags = COALESCE($5::text[], '{}'), description = $6, feedback = $7, color = $8, updated_at = $9, finished_at = $10
WHERE id = $1
RETURNING id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at`, row.ID, row.ParentID, row.Name, row.Status, row.Tags, row.Description, row.Feedback, row.Color, row.UpdatedAt, row.FinishedAt).Scan(&row.ID, &row.ParentID, &row.Name, &row.Status, &row.Tags, &row.Description, &row.Feedback, &row.Color, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
		return core.Focus{}, mapNotFound(err)
	}
	if err := store.insertEvent(ctx, &row.ID, nil, "focus.updated", "api"); err != nil {
		return core.Focus{}, err
	}
	return focusFromRow(row), nil
}

func (store *Store) DeleteFocus(ctx context.Context, _ core.UserID, id core.FocusID) error {
	if _, err := store.getFocusBase(ctx, id); err != nil {
		return err
	}
	focusID := uuid.UUID(id)
	if err := store.insertEvent(ctx, &focusID, nil, "focus.deleted", "api"); err != nil {
		return err
	}
	command, err := store.pool.Exec(ctx, `DELETE FROM focus_object WHERE id = $1`, focusID)
	if err != nil {
		return err
	}
	if command.RowsAffected() == 0 {
		return storage.ErrNotFound
	}
	return nil
}

func (store *Store) ListFocusChildren(ctx context.Context, _ core.UserID, parentID core.FocusID, page core.PageRequest, query core.FocusQuery) (core.Page[core.Focus], error) {
	if _, err := store.getFocusBase(ctx, parentID); err != nil {
		return core.Page[core.Focus]{}, err
	}
	rows, err := store.pool.Query(ctx, `
SELECT id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at
FROM focus_object
WHERE parent_id = $1 AND ($2::uuid IS NULL OR id > $2)
ORDER BY id
LIMIT $3`, uuid.UUID(parentID), cursorUUID(page.Cursor), pageLimit(page)+1)
	if err != nil {
		return core.Page[core.Focus]{}, err
	}
	items, err := scanFocusRows(rows)
	if err != nil {
		return core.Page[core.Focus]{}, err
	}
	for i := range items {
		if err := store.attachFocusAggregate(ctx, &items[i], query.IncludeGoals, query.IncludeSpecs, query.DescendantDepth); err != nil {
			return core.Page[core.Focus]{}, err
		}
	}
	return focusPageFromItems(items, pageLimit(page)), nil
}

func (store *Store) getFocusBase(ctx context.Context, id core.FocusID) (core.Focus, error) {
	row := focusObjectRow{}
	err := store.pool.QueryRow(ctx, `
SELECT id, parent_id, name, status, tags, description, feedback, color, created_at, updated_at, finished_at
FROM focus_object
WHERE id = $1`, uuid.UUID(id)).Scan(&row.ID, &row.ParentID, &row.Name, &row.Status, &row.Tags, &row.Description, &row.Feedback, &row.Color, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt)
	if err != nil {
		return core.Focus{}, mapNotFound(err)
	}
	return focusFromRow(row), nil
}

func (store *Store) attachFocusAggregate(ctx context.Context, focus *core.Focus, includeGoals bool, includeSpecs bool, depth int) error {
	if includeGoals {
		goals, err := store.ListFocusGoals(ctx, core.UserID{}, focus.ID, core.PageRequest{Limit: 100})
		if err != nil {
			return err
		}
		focus.Goals = goals.Items
	}
	if includeSpecs {
		specs, err := store.listSpecifications(ctx, focus.ID)
		if err != nil {
			return err
		}
		focus.Specifications = specs
	}
	if depth > 0 {
		children, err := store.ListFocusChildren(ctx, core.UserID{}, focus.ID, core.PageRequest{Limit: 100}, core.FocusQuery{IncludeGoals: includeGoals, IncludeSpecs: includeSpecs, DescendantDepth: depth - 1})
		if err != nil {
			return err
		}
		focus.Children = children.Items
	}
	return nil
}

func (store *Store) ensureCanMoveFocus(ctx context.Context, id core.FocusID, parentID core.FocusID) error {
	if id == parentID {
		return storage.ErrInvalidHierarchy
	}
	var found bool
	err := store.pool.QueryRow(ctx, `
WITH RECURSIVE descendants AS (
  SELECT id FROM focus_object WHERE parent_id = $1
  UNION ALL
  SELECT child.id FROM focus_object child INNER JOIN descendants d ON child.parent_id = d.id
)
SELECT EXISTS(SELECT 1 FROM descendants WHERE id = $2)`, uuid.UUID(id), uuid.UUID(parentID)).Scan(&found)
	if err != nil {
		return err
	}
	if found {
		return storage.ErrInvalidHierarchy
	}
	if _, err := store.getFocusBase(ctx, parentID); err != nil {
		return err
	}
	return nil
}

func scanFocusRows(rows pgx.Rows) ([]core.Focus, error) {
	defer rows.Close()
	items := []core.Focus{}
	for rows.Next() {
		row := focusObjectRow{}
		if err := rows.Scan(&row.ID, &row.ParentID, &row.Name, &row.Status, &row.Tags, &row.Description, &row.Feedback, &row.Color, &row.CreatedAt, &row.UpdatedAt, &row.FinishedAt); err != nil {
			return nil, err
		}
		items = append(items, focusFromRow(row))
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func mapNotFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return storage.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		return storage.ErrNotFound
	}
	return err
}
