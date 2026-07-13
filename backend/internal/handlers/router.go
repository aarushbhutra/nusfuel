package handlers

import (
	"context"
	"strings"
)

type APIHandler struct {
	Goals    GoalHandler
	Menu     MenuHandler
	MealLogs *MealLogHandler
	Progress *ProgressHandler
}

func NewAPIHandler(goals GoalStore, menu MenuStore, mealLogStores ...MealLogStore) APIHandler {
	api := APIHandler{
		Goals: GoalHandler{Store: goals},
		Menu:  MenuHandler{Store: menu},
	}
	if len(mealLogStores) > 0 && mealLogStores[0] != nil {
		api.MealLogs = &MealLogHandler{Store: mealLogStores[0], Menu: menu}
		api.Progress = &ProgressHandler{Goals: goals, Logs: mealLogStores[0]}
	}
	return api
}

func (h APIHandler) Handle(ctx context.Context, request Request) (Response, error) {
	switch {
	case request.RawPath == "/goals":
		return h.Goals.Handle(ctx, request)
	case request.RawPath == "/menu" || strings.HasPrefix(request.RawPath, "/menu/"):
		return h.Menu.Handle(ctx, request)
	case request.RawPath == "/meal-logs":
		if h.MealLogs == nil {
			return response(500, map[string]string{"error": "internal server error"})
		}
		return h.MealLogs.Handle(ctx, request)
	case request.RawPath == "/progress":
		if h.Progress == nil {
			return response(500, map[string]string{"error": "internal server error"})
		}
		return h.Progress.Handle(ctx, request)
	default:
		return response(404, map[string]string{"error": "not found"})
	}
}
