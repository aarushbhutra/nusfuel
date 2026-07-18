package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/jackc/pgx/v5/pgconn"
)

var ErrEmailTaken = errors.New("email is already registered")

type PostgresUserStore struct{ db *sql.DB }

func NewPostgresUserStore(db *sql.DB) *PostgresUserStore { return &PostgresUserStore{db: db} }

func (s *PostgresUserStore) Create(ctx context.Context, email, passwordHash string) (auth.User, error) {
	user := auth.User{ID: newID("user"), Email: strings.ToLower(strings.TrimSpace(email)), PasswordHash: passwordHash}
	_, err := s.db.ExecContext(ctx, `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`, user.ID, user.Email, user.PasswordHash)
	if isUniqueViolation(err) {
		return auth.User{}, ErrEmailTaken
	}
	if err != nil {
		return auth.User{}, fmt.Errorf("create user: %w", err)
	}
	return user, nil
}

func (s *PostgresUserStore) GetByEmail(ctx context.Context, email string) (auth.User, bool, error) {
	var user auth.User
	err := s.db.QueryRowContext(ctx, `SELECT id, email, password_hash FROM users WHERE email = $1`, strings.ToLower(strings.TrimSpace(email))).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err == sql.ErrNoRows {
		return auth.User{}, false, nil
	}
	if err != nil {
		return auth.User{}, false, fmt.Errorf("get user: %w", err)
	}
	return user, true, nil
}

func newID(prefix string) string {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		panic("generate ID: " + err.Error())
	}
	return prefix + "-" + hex.EncodeToString(value)
}

func isUniqueViolation(err error) bool {
	var postgresError *pgconn.PgError
	return errors.As(err, &postgresError) && postgresError.Code == "23505"
}
