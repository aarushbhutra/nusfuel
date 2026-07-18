package handlers

import (
	"context"
	"io"
	"net/http"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
)

const maxRequestBodyBytes = 1 << 20

type HTTPHandler struct {
	API    APIHandler
	Auth   AuthHandler
	Tokens auth.TokenManager
	Health func(context.Context) error
}

func NewHTTPHandler(api APIHandler, authHandler AuthHandler, tokens auth.TokenManager, health func(context.Context) error) HTTPHandler {
	return HTTPHandler{API: api, Auth: authHandler, Tokens: tokens, Health: health}
}

func (h HTTPHandler) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("access-control-allow-origin", "*")
	writer.Header().Set("access-control-allow-headers", "authorization, content-type")
	if request.Method == http.MethodOptions {
		writer.WriteHeader(http.StatusNoContent)
		return
	}
	if request.URL.Path == "/health" {
		h.handleHealth(writer, request)
		return
	}
	if request.URL.Path == "/auth/register" || request.URL.Path == "/auth/login" {
		h.handleAuth(writer, request)
		return
	}
	claims, err := h.Tokens.Validate(bearerToken(request.Header.Get("authorization")))
	if err != nil {
		h.write(writer, Response{StatusCode: http.StatusUnauthorized, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"unauthorized"}`})
		return
	}
	body, err := io.ReadAll(io.LimitReader(request.Body, maxRequestBodyBytes))
	if err != nil {
		h.write(writer, Response{StatusCode: http.StatusBadRequest, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"invalid request body"}`})
		return
	}
	result, err := h.API.Handle(request.Context(), Request{RawPath: request.URL.Path, RawQueryString: request.URL.RawQuery, Body: string(body), RequestContext: requestContext{HTTP: httpContext{Method: request.Method}, Authorizer: authorizerContext{JWT: jwtContext{Claims: map[string]string{"sub": claims.Subject, "email": claims.Email}}}}})
	if err != nil {
		h.write(writer, Response{StatusCode: http.StatusInternalServerError, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"internal server error"}`})
		return
	}
	h.write(writer, result)
}

func (h HTTPHandler) handleHealth(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		h.write(writer, Response{StatusCode: http.StatusMethodNotAllowed, Headers: map[string]string{"allow": http.MethodGet, "content-type": "application/json"}, Body: `{"error":"method not allowed"}`})
		return
	}
	if h.Health != nil && h.Health(request.Context()) != nil {
		h.write(writer, Response{StatusCode: http.StatusServiceUnavailable, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"unhealthy"}`})
		return
	}
	h.write(writer, Response{StatusCode: http.StatusOK, Headers: map[string]string{"content-type": "application/json"}, Body: `{"status":"ok"}`})
}

func (h HTTPHandler) handleAuth(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		h.write(writer, Response{StatusCode: http.StatusMethodNotAllowed, Headers: map[string]string{"allow": http.MethodPost, "content-type": "application/json"}, Body: `{"error":"method not allowed"}`})
		return
	}
	body, err := io.ReadAll(io.LimitReader(request.Body, maxRequestBodyBytes))
	if err != nil {
		h.write(writer, Response{StatusCode: http.StatusBadRequest, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"invalid request body"}`})
		return
	}
	var result Response
	if request.URL.Path == "/auth/register" {
		result, err = h.Auth.Register(request.Context(), string(body))
	} else {
		result, err = h.Auth.Login(request.Context(), string(body))
	}
	if err != nil {
		h.write(writer, Response{StatusCode: http.StatusInternalServerError, Headers: map[string]string{"content-type": "application/json"}, Body: `{"error":"internal server error"}`})
		return
	}
	h.write(writer, result)
}

func (h HTTPHandler) write(writer http.ResponseWriter, result Response) {
	for key, value := range result.Headers {
		writer.Header().Set(key, value)
	}
	writer.WriteHeader(result.StatusCode)
	_, _ = writer.Write([]byte(result.Body))
}

func bearerToken(value string) string {
	parts := strings.Fields(value)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}
