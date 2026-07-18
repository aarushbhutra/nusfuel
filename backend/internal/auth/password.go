package auth

import (
	"context"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
}

type UserStore interface {
	Create(context.Context, string, string) (User, error)
	GetByEmail(context.Context, string) (User, bool, error)
}

func NormalizeEmail(email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if len(email) < 3 || len(email) > 254 || !strings.Contains(email, "@") {
		return "", fmt.Errorf("enter a valid email address")
	}
	return email, nil
}

func HashPassword(password string) (string, error) {
	if len(password) < 8 || len(password) > 72 {
		return "", fmt.Errorf("password must be between 8 and 72 characters")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}

func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
