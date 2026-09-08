-- +goose Up
CREATE TABLE foundation_migration_probe (
    id integer PRIMARY KEY
);

-- +goose Down
DROP TABLE foundation_migration_probe;
