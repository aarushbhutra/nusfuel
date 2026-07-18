package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const tokenLifetime = 7 * 24 * time.Hour

type Claims struct {
	Subject   string `json:"sub"`
	Email     string `json:"email"`
	ExpiresAt int64  `json:"exp"`
}

type TokenManager struct {
	secret []byte
	now    func() time.Time
}

func NewTokenManager(secret string) (TokenManager, error) {
	if len(secret) < 32 {
		return TokenManager{}, fmt.Errorf("JWT_SECRET must be at least 32 bytes")
	}
	return TokenManager{secret: []byte(secret), now: time.Now}, nil
}

func (m TokenManager) Issue(userID, email string) (string, error) {
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(email) == "" {
		return "", fmt.Errorf("token subject and email are required")
	}
	now := m.clock()().UTC()
	return m.sign(Claims{Subject: userID, Email: email, ExpiresAt: now.Add(tokenLifetime).Unix()})
}

func (m TokenManager) Validate(token string) (Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return Claims{}, fmt.Errorf("invalid token")
	}
	if !hmac.Equal(m.signature(parts[0]+"."+parts[1]), decode(parts[2])) {
		return Claims{}, fmt.Errorf("invalid token")
	}
	var header struct {
		Algorithm string `json:"alg"`
	}
	if err := json.Unmarshal(decode(parts[0]), &header); err != nil || header.Algorithm != "HS256" {
		return Claims{}, fmt.Errorf("invalid token")
	}
	var claims Claims
	if err := json.Unmarshal(decode(parts[1]), &claims); err != nil || strings.TrimSpace(claims.Subject) == "" || strings.TrimSpace(claims.Email) == "" || claims.ExpiresAt <= m.clock()().Unix() {
		return Claims{}, fmt.Errorf("invalid token")
	}
	return claims, nil
}

func (m TokenManager) sign(claims Claims) (string, error) {
	header, err := json.Marshal(struct {
		Algorithm string `json:"alg"`
		Type      string `json:"typ"`
	}{Algorithm: "HS256", Type: "JWT"})
	if err != nil {
		return "", err
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	unsigned := encode(header) + "." + encode(payload)
	return unsigned + "." + encode(m.signature(unsigned)), nil
}

func (m TokenManager) signature(value string) []byte {
	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write([]byte(value))
	return mac.Sum(nil)
}

func (m TokenManager) clock() func() time.Time {
	if m.now != nil {
		return m.now
	}
	return time.Now
}

func encode(value []byte) string {
	return base64.RawURLEncoding.EncodeToString(value)
}

func decode(value string) []byte {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil
	}
	return decoded
}
