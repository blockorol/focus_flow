package config

import (
	"strings"
	"testing"
)

func TestLoad(t *testing.T) {
	base := map[string]string{"APP_ENV": "local", "DATABASE_URL": "postgres://user:private-password@postgres:5432/focusflow?sslmode=disable", "CORS_ALLOWED_ORIGINS": "http://localhost:3000"}
	c, err := Load(func(key string) string { return base[key] })
	if err != nil || c.Port != 8080 || len(c.AllowedOrigins) != 1 {
		t.Fatalf("unexpected config: port=%d, err=%v", c.Port, err)
	}
	for _, test := range []struct{ key, value string }{
		{"APP_ENV", ""}, {"PORT", "0"}, {"PORT", "65536"}, {"PORT", "abc"},
		{"DATABASE_URL", ""}, {"DATABASE_URL", "postgres://user:private-password@"},
		{"CORS_ALLOWED_ORIGINS", "*"}, {"CORS_ALLOWED_ORIGINS", ""},
		{"CORS_ALLOWED_ORIGINS", "http://localhost:3000/path"},
		{"CORS_ALLOWED_ORIGINS", "http://user:password@localhost:3000"},
		{"APP_ENV", "production"},
	} {
		t.Run(test.key+"/"+test.value, func(t *testing.T) {
			_, err := Load(func(key string) string {
				if key == test.key {
					return test.value
				}
				return base[key]
			})
			if err == nil {
				t.Fatal("expected invalid configuration to fail")
			}
			if strings.Contains(err.Error(), "private-password") {
				t.Fatal("error exposed credentials")
			}
		})
	}
}
