package model

import "time"

type User struct {
	ID       UserID
	Username string
}

type Session struct {
	User      User
	ExpiresAt time.Time
}

type LoginCredentials struct {
	Username string
	Password string
}
