package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/store"
)

type fakeUserStore struct{ users map[string]auth.User }

type failingGoalStore struct{}

func (failingGoalStore) Get(context.Context, string) (contracts.Goal, bool, error) {
	return contracts.Goal{}, false, errors.New("database connection details")
}

func (failingGoalStore) Put(context.Context, string, contracts.Goal) error {
	return errors.New("database connection details")
}

func (s *fakeUserStore) Create(_ context.Context, email, passwordHash string) (auth.User, error) {
	if _, exists := s.users[email]; exists {
		return auth.User{}, store.ErrEmailTaken
	}
	user := auth.User{ID: "user-1", Email: email, PasswordHash: passwordHash}
	s.users[email] = user
	return user, nil
}

func (s *fakeUserStore) GetByEmail(_ context.Context, email string) (auth.User, bool, error) {
	user, found := s.users[email]
	return user, found, nil
}

func TestHTTPHandlerRegistersAndAuthenticatesAPIRequests(t *testing.T) {
	tokens, err := auth.NewTokenManager(strings.Repeat("a", 32))
	if err != nil {
		t.Fatalf("new token manager: %v", err)
	}
	api := NewAPIHandler(&fakeGoalStore{goals: map[string]contracts.Goal{}}, &fakeMenuStore{items: []contracts.MenuItem{handlerMenuItem("meal-1")}})
	handler := NewHTTPHandler(api, AuthHandler{Users: &fakeUserStore{users: map[string]auth.User{}}, Tokens: tokens}, tokens, nil)
	register := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(`{"email":"student@example.test","password":"safe-password-1"}`))
	registered := httptest.NewRecorder()
	handler.ServeHTTP(registered, register)
	if registered.Code != http.StatusCreated {
		t.Fatalf("register status = %d, body = %s", registered.Code, registered.Body.String())
	}
	var result tokenResponse
	if err := json.Unmarshal(registered.Body.Bytes(), &result); err != nil {
		t.Fatalf("decode registration response: %v", err)
	}
	menu := httptest.NewRequest(http.MethodGet, "/menu", nil)
	menu.Header.Set("authorization", "Bearer "+result.AccessToken)
	menuResponse := httptest.NewRecorder()
	handler.ServeHTTP(menuResponse, menu)
	if menuResponse.Code != http.StatusOK {
		t.Fatalf("menu status = %d, body = %s", menuResponse.Code, menuResponse.Body.String())
	}
	unauthorized := httptest.NewRecorder()
	handler.ServeHTTP(unauthorized, httptest.NewRequest(http.MethodGet, "/menu", nil))
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("unauthorized status = %d", unauthorized.Code)
	}
}

func TestHTTPHandlerHealthIsPublic(t *testing.T) {
	tokens, _ := auth.NewTokenManager(strings.Repeat("a", 32))
	handler := NewHTTPHandler(APIHandler{}, AuthHandler{}, tokens, nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/health", nil))
	if response.Code != http.StatusOK || response.Body.String() != `{"status":"ok"}` {
		t.Fatalf("health response = %d %s", response.Code, response.Body.String())
	}
}

func TestHTTPHandlerAllowsBrowserPreflightForGoalSave(t *testing.T) {
	tokens, _ := auth.NewTokenManager(strings.Repeat("a", 32))
	handler := NewHTTPHandler(APIHandler{}, AuthHandler{}, tokens, nil)
	request := httptest.NewRequest(http.MethodOptions, "/goals", nil)
	request.Header.Set("origin", "http://localhost:8081")
	request.Header.Set("access-control-request-method", http.MethodPut)
	request.Header.Set("access-control-request-headers", "authorization, content-type")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("preflight status = %d", response.Code)
	}
	if response.Header().Get("access-control-allow-methods") != "GET, POST, PUT, OPTIONS" {
		t.Fatalf("allowed methods = %q", response.Header().Get("access-control-allow-methods"))
	}
}

func TestHTTPHandlerLogsRequestIDAndHidesInternalErrors(t *testing.T) {
	previousLogger := slog.Default()
	var logs bytes.Buffer
	slog.SetDefault(slog.New(slog.NewJSONHandler(&logs, nil)))
	t.Cleanup(func() { slog.SetDefault(previousLogger) })

	tokens, err := auth.NewTokenManager(strings.Repeat("a", 32))
	if err != nil {
		t.Fatalf("new token manager: %v", err)
	}
	token, err := tokens.Issue("user-1", "student@example.test")
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	handler := NewHTTPHandler(APIHandler{Goals: GoalHandler{Store: failingGoalStore{}}}, AuthHandler{}, tokens, nil)
	request := httptest.NewRequest(http.MethodGet, "/goals", nil)
	request.Header.Set("authorization", "Bearer "+token)
	request.Header.Set("x-request-id", "request-123")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusInternalServerError || response.Body.String() != `{"error":"internal server error"}` {
		t.Fatalf("response = %d %s", response.Code, response.Body.String())
	}
	if response.Header().Get("x-request-id") != "request-123" {
		t.Fatalf("request ID = %q", response.Header().Get("x-request-id"))
	}
	if strings.Contains(response.Body.String(), "database connection details") {
		t.Fatal("internal error leaked to API response")
	}
	if !strings.Contains(logs.String(), `"request_id":"request-123"`) || !strings.Contains(logs.String(), `"route":"/goals"`) || !strings.Contains(logs.String(), `"msg":"PostgreSQL operation failed"`) || !strings.Contains(logs.String(), `"msg":"request failed"`) {
		t.Fatalf("structured request logs = %s", logs.String())
	}
}
