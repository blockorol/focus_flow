// Package model is reserved for handwritten API boundary models.
//
// API models are frontend-facing request/response support shapes used around
// the generated OpenAPI code. They must not be mixed with internal business
// models or PostgreSQL row models. Endpoint-specific API models should be split
// into focused files or subpackages when API endpoints are implemented.
package model
