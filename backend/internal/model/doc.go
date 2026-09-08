// Package model contains internal FocusFlow business data shapes.
//
// These models are not API request/response models and are not PostgreSQL row
// models. They are the service/core layer vocabulary. API and storage packages
// may map to and from these models, but this package must not import API or
// PostgreSQL implementation packages.
package model
