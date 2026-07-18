package auth

import "testing"

func TestPasswordHashRoundTrip(t *testing.T) {
	hash, err := HashPassword("safe-password-1")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	if !CheckPassword(hash, "safe-password-1") || CheckPassword(hash, "wrong-password") {
		t.Fatal("password comparison did not preserve the credential")
	}
}

func TestPasswordValidation(t *testing.T) {
	if _, err := HashPassword("short"); err == nil {
		t.Fatal("expected short password to fail")
	}
}
