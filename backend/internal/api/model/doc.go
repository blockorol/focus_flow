// Package model contains API boundary helpers for frontend-facing shapes.
//
// The public HTTP contract is defined in OpenAPI and generated into the
// generated package. This package may alias generated request/response models
// and map them to internal business models. It must not expose PostgreSQL row
// models or become a place for business rules.
package model
