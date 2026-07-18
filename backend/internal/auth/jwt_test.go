package auth

import (
	"strings"
	"testing"
	"time"
)

func TestTokenManagerIssuesAndValidatesToken(t *testing.T) {
	now := time.Date(2026, 7, 19, 0, 0, 0, 0, time.UTC)
	manager := TokenManager{secret: []byte(strings.Repeat("a", 32)), now: func() time.Time { return now }}
	token, err := manager.Issue("user-1", "student@example.test")
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	claims, err := manager.Validate(token)
	if err != nil {
		t.Fatalf("validate token: %v", err)
	}
	if claims.Subject != "user-1" || claims.Email != "student@example.test" {
		t.Fatalf("claims = %+v", claims)
	}
}

func TestTokenManagerRejectsTamperedAndExpiredTokens(t *testing.T) {
	now := time.Date(2026, 7, 19, 0, 0, 0, 0, time.UTC)
	manager := TokenManager{secret: []byte(strings.Repeat("a", 32)), now: func() time.Time { return now }}
	token, err := manager.sign(Claims{Subject: "user-1", Email: "student@example.test", ExpiresAt: now.Add(-time.Second).Unix()})
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}
	if _, err := manager.Validate(token); err == nil {
		t.Fatal("expected expired token to fail")
	}
	if _, err := manager.Validate(token + "x"); err == nil {
		t.Fatal("expected tampered token to fail")
	}
}
