// Package config loads the environment required by the foundation server.
package config

import (
	"errors"
	"net/url"
	"strconv"
	"strings"
)

type Config struct {
	Environment    string
	Port           int
	DatabaseURL    string
	AllowedOrigins []string
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
	return c, nil
}
