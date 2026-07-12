package handlers

import (
	"context"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestAPIHandlerRoutesGoalsAndMenuRequests(t *testing.T) {
	api := NewAPIHandler(
		&fakeGoalStore{goals: map[string]contracts.Goal{
			"user-1": {Mode: "custom", CaloriesKcal: 2200, ProteinG: 140},
		}},
		&fakeMenuStore{items: []contracts.MenuItem{handlerMenuItem("meal-1")}},
	)

	goal, err := api.Handle(context.Background(), authenticatedRequest("GET", "", "user-1"))
	if err != nil {
		t.Fatalf("route goal request: %v", err)
	}
	if goal.StatusCode != 200 {
		t.Fatalf("goal status = %d, want 200", goal.StatusCode)
	}

	menu, err := api.Handle(context.Background(), menuRequest("GET", "/menu", "user-1"))
	if err != nil {
		t.Fatalf("route menu request: %v", err)
	}
	if menu.StatusCode != 200 {
		t.Fatalf("menu status = %d, want 200", menu.StatusCode)
	}
}

func TestAPIHandlerRejectsUnknownRoutes(t *testing.T) {
	api := NewAPIHandler(&fakeGoalStore{}, &fakeMenuStore{})
	got, err := api.Handle(context.Background(), menuRequest("GET", "/recommendations", "user-1"))
	if err != nil {
		t.Fatalf("route request: %v", err)
	}
	if got.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", got.StatusCode)
	}
}
