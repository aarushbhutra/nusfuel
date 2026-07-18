package handlers

import (
	"context"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/aarushbhutra/nusfuel/backend/internal/logging"
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
	requestID := strings.TrimSpace(request.Header.Get("x-request-id"))
	if requestID == "" {
		requestID = logging.NewRequestID()
	}
	writer.Header().Set("x-request-id", requestID)
	request = request.WithContext(logging.WithRequest(request.Context(), requestID, request.URL.Path))
	trackedWriter := &statusWriter{ResponseWriter: writer}
	started := time.Now()
	defer func() {
		status := trackedWriter.status
		if status == 0 {
			status = http.StatusOK
		}
		if status == http.StatusBadRequest {
			logging.Warn(request.Context(), "request validation failed", "status", status)
		} else if status == http.StatusUnauthorized {
			logging.Warn(request.Context(), "authentication failed", "status", status)
		} else if status >= http.StatusInternalServerError {
			logging.Error(request.Context(), "request failed", "status", status)
		}
		logging.Info(request.Context(), "request completed", "method", request.Method, "status", status, "duration_ms", time.Since(started).Milliseconds())
	}()
	writer = trackedWriter
	writer.Header().Set("access-control-allow-origin", "*")
	writer.Header().Set("access-control-allow-headers", "authorization, content-type, x-request-id")
	writer.Header().Set("access-control-allow-methods", "GET, POST, PUT, OPTIONS")
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

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *statusWriter) Write(body []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(body)
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
