package handlers

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestAPIHandlerReturnsRankedRecommendationsAndAllergenWarnings(t *testing.T) {
	incomplete := handlerMenuItem("incomplete-fit")
	incomplete.Nutrition = contracts.Nutrition{EnergyKcal: 500, ProteinG: 30}
	peanut := recommendationItem("peanut", 490, 30)
	peanut.Allergens.Contains = []string{"Peanuts"}
	safe := recommendationItem("safe", 450, 30)
	api := NewAPIHandler(
		&fakeGoalStore{goals: map[string]contracts.Goal{"user-1": {Mode: "custom", CaloriesKcal: 500, ProteinG: 30}}},
		&fakeMenuStore{items: []contracts.MenuItem{incomplete, peanut, safe, recommendationItem("fourth", 400, 25)}},
		&fakeMealLogStore{},
	)

	request := menuRequest("GET", "/recommendations", "user-1")
	got, err := api.Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("get recommendations: %v", err)
	}
	if got.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", got.StatusCode)
	}

	var recommendations []contracts.Recommendation
	if err := json.Unmarshal([]byte(got.Body), &recommendations); err != nil {
		t.Fatalf("decode recommendations: %v", err)
	}
	if len(recommendations) != 3 || recommendations[0].MenuItemID != "incomplete-fit" {
		t.Fatalf("recommendations = %+v, want top three stored items", recommendations)
	}
	if len(recommendations[0].AllergenWarnings) == 0 {
		t.Fatal("incomplete allergen data must produce a warning")
	}

	request.RawQueryString = "allergen=peanuts"
	got, err = api.Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("get filtered recommendations: %v", err)
	}
	if got.StatusCode != 200 {
		t.Fatalf("filtered status = %d, want 200", got.StatusCode)
	}
	if err := json.Unmarshal([]byte(got.Body), &recommendations); err != nil {
		t.Fatalf("decode filtered recommendations: %v", err)
	}
	for _, recommendation := range recommendations {
		if recommendation.MenuItemID == "peanut" || recommendation.MenuItemID == "incomplete-fit" {
			t.Fatalf("allergen filtering must happen before ranking: %+v", recommendations)
		}
	}
}

func TestRecommendationHandlerUsesRemainingDailyAndWeeklyTargets(t *testing.T) {
	handler := RecommendationHandler{
		Goals: &fakeGoalStore{goals: map[string]contracts.Goal{"user-1": {Mode: "custom", CaloriesKcal: 500, ProteinG: 30}}},
		Menu: &fakeMenuStore{items: []contracts.MenuItem{
			recommendationItem("daily-fit", 400, 20),
			recommendationItem("weekly-fit", 3400, 200),
		}},
		Logs: &fakeMealLogStore{logs: map[string][]contracts.MealLog{
			"user-1": {mealLogForTest("log-1", "2026-07-15T08:00:00Z", 100, 10, 0, 0, 0)},
		}},
		Now: func() time.Time { return time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC) },
	}

	for _, test := range []struct {
		query string
		want  string
	}{
		{query: "period=daily", want: "daily-fit"},
		{query: "period=weekly", want: "weekly-fit"},
	} {
		t.Run(test.query, func(t *testing.T) {
			request := menuRequest("GET", "/recommendations", "user-1")
			request.RawQueryString = test.query
			got, err := handler.Handle(context.Background(), request)
			if err != nil {
				t.Fatalf("get recommendations: %v", err)
			}
			var recommendations []contracts.Recommendation
			if err := json.Unmarshal([]byte(got.Body), &recommendations); err != nil {
				t.Fatalf("decode recommendations: %v", err)
			}
			if got.StatusCode != 200 || len(recommendations) == 0 || recommendations[0].MenuItemID != test.want {
				t.Fatalf("recommendations = %+v, want %s first", recommendations, test.want)
			}
		})
	}
}

func recommendationItem(id string, calories, protein float64) contracts.MenuItem {
	item := handlerMenuItem(id)
	item.Nutrition = contracts.Nutrition{EnergyKcal: calories, ProteinG: protein}
	item.Allergens = contracts.Allergens{Contains: []string{}}
	return item
}
