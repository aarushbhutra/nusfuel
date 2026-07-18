package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/aarushbhutra/nusfuel/backend/internal/store"
)

type AuthHandler struct {
	Users  auth.UserStore
	Tokens auth.TokenManager
}

type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenResponse struct {
	AccessToken string `json:"accessToken"`
}

func (h AuthHandler) Register(ctx context.Context, body string) (Response, error) {
	input, err := decodeCredentials(body)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	email, err := auth.NormalizeEmail(input.Email)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	hash, err := auth.HashPassword(input.Password)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	user, err := h.Users.Create(ctx, email, hash)
	if err == store.ErrEmailTaken {
		return response(409, map[string]string{"error": "email is already registered"})
	}
	if err != nil {
		logPostgresFailure(ctx, "create user", err)
		return response(500, map[string]string{"error": "internal server error"})
	}
	token, err := h.Tokens.Issue(user.ID, user.Email)
	if err != nil {
		return Response{}, err
	}
	return response(201, tokenResponse{AccessToken: token})
}

func (h AuthHandler) Login(ctx context.Context, body string) (Response, error) {
	input, err := decodeCredentials(body)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	email, err := auth.NormalizeEmail(input.Email)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	user, found, err := h.Users.GetByEmail(ctx, email)
	if err != nil {
		logPostgresFailure(ctx, "get user", err)
		return response(500, map[string]string{"error": "internal server error"})
	}
	if !found || !auth.CheckPassword(user.PasswordHash, input.Password) {
		return response(401, map[string]string{"error": "invalid email or password"})
	}
	token, err := h.Tokens.Issue(user.ID, user.Email)
	if err != nil {
		return Response{}, err
	}
	return response(200, tokenResponse{AccessToken: token})
}

func decodeCredentials(body string) (credentials, error) {
	var input credentials
	decoder := json.NewDecoder(strings.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		return credentials{}, fmt.Errorf("invalid credentials: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return credentials{}, fmt.Errorf("invalid credentials")
	}
	return input, nil
}
