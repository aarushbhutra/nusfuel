package handlers

import (
	"context"
	"strings"
)

type APIHandler struct {
	Goals GoalHandler
	Menu  MenuHandler
}

func NewAPIHandler(goals GoalStore, menu MenuStore) APIHandler {
	return APIHandler{
		Goals: GoalHandler{Store: goals},
		Menu:  MenuHandler{Store: menu},
	}
}

func (h APIHandler) Handle(ctx context.Context, request Request) (Response, error) {
	switch {
	case request.RawPath == "/goals":
		return h.Goals.Handle(ctx, request)
	case request.RawPath == "/menu" || strings.HasPrefix(request.RawPath, "/menu/"):
		return h.Menu.Handle(ctx, request)
	default:
		return response(404, map[string]string{"error": "not found"})
	}
}
