// Package config loads runtime configuration required by the backend server.
package config

import (
	"errors"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/blockorol/focus_flow/backend/internal/auth"
	core "github.com/blockorol/focus_flow/backend/internal/model"
)

const defaultSessionTTL = 2 * time.Hour

type Config struct {
	Environment    string
	Port           int
	DatabaseURL    string
	AllowedOrigins []string
	Auth           AuthConfig
}

type AuthConfig struct {
	UserID      core.UserID
	Username    string
	Credential  auth.PasswordCredential
	TokenSecret []byte
	SessionTTL  time.Duration
}

func Load(getenv func(string) string) (Config, error) {
	c := Config{Environment: getenv("APP_ENV"), DatabaseURL: getenv("DATABASE_URL")}
	switch c.Environment {
	case "local", "test", "production":
	default:
		return Config{}, errors.New("APP_ENV must be local, test, or production")
	}
	port := getenv("PORT")
	if port == "" {
		port = "8080"
	}
	var err error
	c.Port, err = strconv.Atoi(port)
	if err != nil || c.Port < 1 || c.Port > 65535 {
		return Config{}, errors.New("PORT must be between 1 and 65535")
	}
	db, err := url.Parse(c.DatabaseURL)
	if err != nil || db == nil || (db.Scheme != "postgres" && db.Scheme != "postgresql") || db.Hostname() == "" {
		return Config{}, errors.New("DATABASE_URL must be a PostgreSQL connection URL")
	}
	for _, value := range strings.Split(getenv("CORS_ALLOWED_ORIGINS"), ",") {
		origin := strings.TrimSpace(value)
		u, err := url.Parse(origin)
		if err != nil || u == nil || (u.Scheme != "http" && u.Scheme != "https") || u.Hostname() == "" || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
			return Config{}, errors.New("CORS_ALLOWED_ORIGINS must contain explicit HTTP origins without paths")
		}
		if c.Environment == "production" && u.Scheme != "https" {
			return Config{}, errors.New("production CORS origins must use HTTPS")
		}
		c.AllowedOrigins = append(c.AllowedOrigins, origin)
	}
	authConfig, err := loadAuth(getenv)
	if err != nil {
		return Config{}, err
	}
	c.Auth = authConfig
	return c, nil
}

func loadAuth(getenv func(string) string) (AuthConfig, error) {
	userIDValue := strings.TrimSpace(getenv("APP_USER_ID"))
	userID, err := uuid.Parse(userIDValue)
	if err != nil || userID == uuid.Nil {
		return AuthConfig{}, errors.New("APP_USER_ID must be a non-empty UUID")
	}
	username := strings.TrimSpace(getenv("APP_USERNAME"))
	if username == "" {
		return AuthConfig{}, errors.New("APP_USERNAME must not be empty")
	}
	credential, err := auth.NewPasswordCredential(getenv("APP_PASSWORD"))
	if err != nil {
		return AuthConfig{}, errors.New("APP_PASSWORD must not be empty")
	}
	secret := []byte(getenv("APP_TOKEN_SECRET"))
	if len(secret) < 32 {
		return AuthConfig{}, errors.New("APP_TOKEN_SECRET must be at least 32 bytes")
	}
	return AuthConfig{UserID: userID, Username: username, Credential: credential, TokenSecret: append([]byte(nil), secret...), SessionTTL: defaultSessionTTL}, nil
}
