-- +goose Up
CREATE TABLE focus_object (
  id UUID PRIMARY KEY,
  parent_id UUID NULL REFERENCES focus_object(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NULL,
  feedback TEXT NULL,
  color TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NULL,
  CONSTRAINT focus_object_name_not_empty CHECK (length(btrim(name)) > 0),
  CONSTRAINT focus_object_status_check CHECK (status IN ('idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled')),
  CONSTRAINT focus_object_not_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX focus_object_parent_id_id_idx ON focus_object (parent_id, id);
CREATE INDEX focus_object_created_at_id_idx ON focus_object (created_at, id);

CREATE TABLE focus_goal (
  id UUID PRIMARY KEY,
  focus_object_id UUID NOT NULL REFERENCES focus_object(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status_override TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NULL,
  CONSTRAINT focus_goal_type_check CHECK (type IN ('primary', 'secondary')),
  CONSTRAINT focus_goal_description_not_empty CHECK (length(btrim(description)) > 0),
  CONSTRAINT focus_goal_status_override_check CHECK (status_override IS NULL OR status_override IN ('idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'))
);

CREATE INDEX focus_goal_focus_object_id_id_idx ON focus_goal (focus_object_id, id);

CREATE TABLE focus_goal_link (
  goal_id UUID NOT NULL REFERENCES focus_goal(id) ON DELETE CASCADE,
  focus_object_id UUID NOT NULL REFERENCES focus_object(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, focus_object_id)
);

CREATE INDEX focus_goal_link_goal_id_idx ON focus_goal_link (goal_id);
CREATE INDEX focus_goal_link_focus_object_id_idx ON focus_goal_link (focus_object_id);

CREATE TABLE focus_specification (
  id UUID PRIMARY KEY,
  focus_object_id UUID NOT NULL REFERENCES focus_object(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT focus_specification_type_not_empty CHECK (length(btrim(type)) > 0),
  CONSTRAINT focus_specification_schema_version_positive CHECK (schema_version > 0)
);

CREATE INDEX focus_specification_focus_object_id_id_idx ON focus_specification (focus_object_id, id);
CREATE INDEX focus_specification_type_idx ON focus_specification (type);

CREATE TABLE focus_event (
  id UUID PRIMARY KEY,
  focus_object_id UUID NULL REFERENCES focus_object(id) ON DELETE SET NULL,
  goal_id UUID NULL REFERENCES focus_goal(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT focus_event_type_not_empty CHECK (length(btrim(type)) > 0),
  CONSTRAINT focus_event_source_not_empty CHECK (length(btrim(source)) > 0)
);

CREATE INDEX focus_event_focus_object_id_created_at_idx ON focus_event (focus_object_id, created_at, id);
CREATE INDEX focus_event_goal_id_created_at_idx ON focus_event (goal_id, created_at, id);
CREATE INDEX focus_event_type_created_at_idx ON focus_event (type, created_at, id);

-- +goose Down
DROP TABLE focus_event;
DROP TABLE focus_specification;
DROP TABLE focus_goal_link;
DROP TABLE focus_goal;
DROP INDEX focus_object_created_at_id_idx;
DROP INDEX focus_object_parent_id_id_idx;
DROP TABLE focus_object;
