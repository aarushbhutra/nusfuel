package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

type GoalStore interface {
	Get(context.Context, string) (contracts.Goal, bool, error)
	Put(context.Context, string, contracts.Goal) error
}

type Request struct {
	RawPath        string         `json:"rawPath"`
	Body           string         `json:"body"`
	RequestContext requestContext `json:"requestContext"`
}

type requestContext struct {
	HTTP       httpContext       `json:"http"`
	Authorizer authorizerContext `json:"authorizer"`
}

type httpContext struct {
	Method string `json:"method"`
}

type authorizerContext struct {
	JWT jwtContext `json:"jwt"`
}

type jwtContext struct {
	Claims map[string]string `json:"claims"`
}

type Response struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

type GoalHandler struct {
	Store GoalStore
}

func (h GoalHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if request.RawPath != "/goals" {
		return response(404, map[string]string{"error": "not found"})
	}

	userID := strings.TrimSpace(request.RequestContext.Authorizer.JWT.Claims["sub"])
	if userID == "" {
		return response(401, map[string]string{"error": "unauthorized"})
	}

	switch strings.ToUpper(request.RequestContext.HTTP.Method) {
	case "GET":
		goal, found, err := h.Store.Get(ctx, userID)
		if err != nil {
			return response(500, map[string]string{"error": "internal server error"})
		}
		if !found {
			return response(404, map[string]string{"error": "goal not found"})
		}
		return response(200, goal)
	case "PUT":
		goal, err := decodeGoal(request.Body)
		if err != nil {
			return response(400, map[string]string{"error": err.Error()})
		}
		if err := domain.ValidateGoal(goal); err != nil {
			return response(400, map[string]string{"error": err.Error()})
		}
		if err := h.Store.Put(ctx, userID, goal); err != nil {
			return response(500, map[string]string{"error": "internal server error"})
		}
		return response(200, goal)
	default:
		result, err := response(405, map[string]string{"error": "method not allowed"})
		result.Headers["allow"] = "GET, PUT"
		return result, err
	}
}

func decodeGoal(body string) (contracts.Goal, error) {
	var goal contracts.Goal
	decoder := json.NewDecoder(strings.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&goal); err != nil {
		return contracts.Goal{}, fmt.Errorf("invalid goal: %w", err)
	}

	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return contracts.Goal{}, fmt.Errorf("invalid goal: multiple JSON values")
		}
		return contracts.Goal{}, fmt.Errorf("invalid goal: %w", err)
	}
	return goal, nil
}

func response(status int, value any) (Response, error) {
	body, err := json.Marshal(value)
	if err != nil {
		return Response{}, err
	}
	return Response{
		StatusCode: status,
		Headers:    map[string]string{"content-type": "application/json"},
		Body:       string(body),
	}, nil
}
