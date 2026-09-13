// Package auth contains authentication primitives that are independent from HTTP transport.
package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"

	core "github.com/blockorol/focus_flow/backend/internal/model"
)

const passwordSaltSize = 16

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
	ErrExpiredToken       = errors.New("expired token")
)

type PasswordCredential struct {
	salt []byte
	hash []byte
}

func NewPasswordCredential(password string) (PasswordCredential, error) {
	if password == "" {
		return PasswordCredential{}, errors.New("password must not be empty")
	}
	salt := make([]byte, passwordSaltSize)
	if _, err := rand.Read(salt); err != nil {
		return PasswordCredential{}, fmt.Errorf("generate password salt: %w", err)
	}
	return passwordCredentialWithSalt(password, salt), nil
}

func passwordCredentialWithSalt(password string, salt []byte) PasswordCredential {
	copiedSalt := append([]byte(nil), salt...)
	return PasswordCredential{salt: copiedSalt, hash: hashPassword(password, copiedSalt)}
}

func (credential PasswordCredential) Verify(password string) bool {
	if password == "" || len(credential.salt) == 0 || len(credential.hash) == 0 {
		return false
	}
	candidate := hashPassword(password, credential.salt)
	return subtle.ConstantTimeCompare(candidate, credential.hash) == 1
}

func hashPassword(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
}

type CredentialVerifier interface {
	Verify(ctx context.Context, credentials core.LoginCredentials) (core.User, error)
}

type ConfiguredUserVerifier struct {
	user       core.User
	credential PasswordCredential
}

func NewConfiguredUserVerifier(user core.User, credential PasswordCredential) ConfiguredUserVerifier {
	return ConfiguredUserVerifier{user: user, credential: credential}
}

func (verifier ConfiguredUserVerifier) Verify(_ context.Context, credentials core.LoginCredentials) (core.User, error) {
	if credentials.Username != verifier.user.Username || !verifier.credential.Verify(credentials.Password) {
		return core.User{}, ErrInvalidCredentials
	}
	return verifier.user, nil
}

type IssuedSession struct {
	Token   string
	Session core.Session
}

type Service struct {
	verifier CredentialVerifier
	secret   []byte
	ttl      time.Duration
	now      func() time.Time
}

func NewService(verifier CredentialVerifier, secret []byte, ttl time.Duration) (Service, error) {
	if verifier == nil {
		return Service{}, errors.New("auth verifier is required")
	}
	if len(secret) < 32 {
		return Service{}, errors.New("auth token secret must be at least 32 bytes")
	}
	if ttl <= 0 {
		return Service{}, errors.New("auth token ttl must be positive")
	}
	return Service{verifier: verifier, secret: append([]byte(nil), secret...), ttl: ttl, now: time.Now}, nil
}

func (service Service) Login(ctx context.Context, credentials core.LoginCredentials) (IssuedSession, error) {
	user, err := service.verifier.Verify(ctx, credentials)
	if err != nil {
		return IssuedSession{}, err
	}
	return service.issue(user)
}

func (service Service) Refresh(session core.Session) (IssuedSession, error) {
	if session.User.ID == uuid.Nil || session.User.Username == "" {
		return IssuedSession{}, ErrInvalidToken
	}
	if !service.now().Before(session.ExpiresAt) {
		return IssuedSession{}, ErrExpiredToken
	}
	return service.issue(session.User)
}

func (service Service) VerifyToken(token string) (core.Session, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return core.Session{}, ErrInvalidToken
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return core.Session{}, ErrInvalidToken
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return core.Session{}, ErrInvalidToken
	}
	if !service.validSignature(payload, signature) {
		return core.Session{}, ErrInvalidToken
	}
	var claims tokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return core.Session{}, ErrInvalidToken
	}
	userID, err := claims.userID()
	if err != nil || claims.Username == "" || claims.ExpiresAt <= 0 {
		return core.Session{}, ErrInvalidToken
	}
	expiresAt := time.Unix(claims.ExpiresAt, 0).UTC()
	if !service.now().Before(expiresAt) {
		return core.Session{}, ErrExpiredToken
	}
	return core.Session{User: core.User{ID: userID, Username: claims.Username}, ExpiresAt: expiresAt}, nil
}

func (service Service) issue(user core.User) (IssuedSession, error) {
	now := service.now().UTC()
	session := core.Session{User: user, ExpiresAt: now.Add(service.ttl)}
	claims := tokenClaims{Subject: user.ID.String(), Username: user.Username, IssuedAt: now.Unix(), ExpiresAt: session.ExpiresAt.Unix()}
	payload, err := json.Marshal(claims)
	if err != nil {
		return IssuedSession{}, fmt.Errorf("encode token claims: %w", err)
	}
	signature := service.sign(payload)
	token := base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString(signature)
	return IssuedSession{Token: token, Session: session}, nil
}

func (service Service) sign(payload []byte) []byte {
	mac := hmac.New(sha256.New, service.secret)
	mac.Write(payload)
	return mac.Sum(nil)
}

func (service Service) validSignature(payload, signature []byte) bool {
	expected := service.sign(payload)
	return hmac.Equal(signature, expected)
}

type tokenClaims struct {
	Subject   string `json:"sub"`
	Username  string `json:"username"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
}

func (claims tokenClaims) userID() (core.UserID, error) {
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return core.UserID{}, err
	}
	return id, nil
}
