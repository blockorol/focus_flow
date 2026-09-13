package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/blockorol/focus_flow/backend/internal/api"
	"github.com/blockorol/focus_flow/backend/internal/auth"
	"github.com/blockorol/focus_flow/backend/internal/config"
	core "github.com/blockorol/focus_flow/backend/internal/model"
	"github.com/blockorol/focus_flow/backend/internal/storage/postgres"
)

func run(ctx context.Context) error {
	c, err := config.Load(os.Getenv)
	if err != nil {
		return err
	}
	database, err := postgres.Open(ctx, c.DatabaseURL)
	if err != nil {
		return err
	}
	defer database.Close()
	authService, err := auth.NewService(
		auth.NewConfiguredUserVerifier(core.User{ID: c.Auth.UserID, Username: c.Auth.Username}, c.Auth.Credential),
		c.Auth.TokenSecret,
		c.Auth.SessionTTL,
	)
	if err != nil {
		return err
	}
	listener, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", c.Port))
	if err != nil {
		return fmt.Errorf("listen on configured port: %w", err)
	}
	log.Printf("API listening on port %d; database startup ping succeeded", c.Port)
	return api.Serve(ctx, listener, api.NewHandler(c.AllowedOrigins, authService, api.CookieConfigForEnvironment(c.Environment)))
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}
