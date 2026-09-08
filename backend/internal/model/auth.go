package model

import "time"

type User struct {
	ID       UserID
	Username string
}

type AuthSession struct {
	User      User
	ExpiresAt time.Time
}

type LoginCredentials struct {
	Username string
	Password string
}
