package handlers

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type fakeMealLogStore struct {
	logs map[string][]contracts.MealLog
}

func (f *fakeMealLogStore) Put(_ context.Context, userID string, mealLog contracts.MealLog) error {
	if f.logs == nil {
		f.logs = map[string][]contracts.MealLog{}
	}
	f.logs[userID] = append(f.logs[userID], mealLog)
	return nil
}

func (f *fakeMealLogStore) List(_ context.Context, userID string, start, end time.Time) ([]contracts.MealLog, error) {
	var result []contracts.MealLog
	for _, mealLog := range f.logs[userID] {
		loggedAt, err := time.Parse(time.RFC3339Nano, mealLog.LoggedAt)
		if err != nil {
			continue
		}
		if !loggedAt.Before(start) && loggedAt.Before(end) {
			result = append(result, mealLog)
		}
	}
	return result, nil
}

func TestMealLogHandlerScalesStoredNutritionBeforePersisting(t *testing.T) {
	store := &fakeMealLogStore{}
	handler := MealLogHandler{
		Store: store,
		Menu:  &fakeMenuStore{items: []contracts.MenuItem{handlerMenuItem("meal-1")}},
		Now:   func() time.Time { return time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC) },
	}

	request := authenticatedRequest("POST", `{"menuItemId":"meal-1","servingQuantity":2}`, "user-1")
	request.RawPath = "/meal-logs"
	got, err := handler.Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("log meal: %v", err)
	}
	if got.StatusCode != 201 {
		t.Fatalf("status = %d, want 201", got.StatusCode)
	}
	if len(store.logs["user-1"]) != 1 {
		t.Fatalf("stored logs = %+v, want one log", store.logs)
	}
	mealLog := store.logs["user-1"][0]
	wantNutrition := contracts.Nutrition{EnergyKcal: 1000, ProteinG: 60, TotalFatG: 20, CarbohydrateG: 100, SugarG: 10}
	if mealLog.NutritionTotal != wantNutrition {
		t.Fatalf("nutrition total = %+v, want %+v", mealLog.NutritionTotal, wantNutrition)
	}
	if mealLog.ServingQuantity != 2 || mealLog.MenuItemID != "meal-1" {
		t.Fatalf("meal log = %+v, want meal-1 with two servings", mealLog)
	}
}

func TestProgressHandlerReturnsDailyAndWeeklyTotalsWithConfiguredMacros(t *testing.T) {
	fat, carbs, sugar := 70.0, 250.0, 50.0
	goal := contracts.Goal{Mode: "custom", CaloriesKcal: 2200, ProteinG: 140, MoreOptions: &contracts.MacroTargets{TotalFatG: &fat, CarbohydrateG: &carbs, SugarG: &sugar}}
	store := &fakeMealLogStore{logs: map[string][]contracts.MealLog{
		"user-1": {
			mealLogForTest("log-old", "2026-07-10T12:00:00Z", 300, 20, 8, 30, 4),
			mealLogForTest("log-week", "2026-07-14T08:00:00Z", 300, 20, 8, 30, 4),
			mealLogForTest("log-today", "2026-07-15T08:00:00Z", 500, 30, 10, 50, 5),
			mealLogForTest("log-next", "2026-07-20T08:00:00Z", 900, 50, 20, 90, 9),
		},
		"user-2": {mealLogForTest("log-other", "2026-07-15T09:00:00Z", 999, 99, 99, 99, 99)},
	}}
	goals := &fakeGoalStore{goals: map[string]contracts.Goal{"user-1": goal}}
	now := func() time.Time { return time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC) }
	handler := ProgressHandler{Goals: goals, Logs: store, Now: now}

	for _, test := range []struct {
		name        string
		query       string
		wantEnergy  float64
		wantProtein float64
		wantFat     float64
		wantStart   string
		wantEnd     string
	}{
		{name: "daily", query: "period=daily", wantEnergy: 500, wantProtein: 30, wantFat: 10, wantStart: "2026-07-15", wantEnd: "2026-07-15"},
		{name: "weekly", query: "period=weekly", wantEnergy: 800, wantProtein: 50, wantFat: 18, wantStart: "2026-07-13", wantEnd: "2026-07-19"},
	} {
		t.Run(test.name, func(t *testing.T) {
			request := menuRequest("GET", "/progress", "user-1")
			request.RawQueryString = test.query
			got, err := handler.Handle(context.Background(), request)
			if err != nil {
				t.Fatalf("get progress: %v", err)
			}
			if got.StatusCode != 200 {
				t.Fatalf("status = %d, want 200", got.StatusCode)
			}
			var progress contracts.Progress
			if err := json.Unmarshal([]byte(got.Body), &progress); err != nil {
				t.Fatalf("decode progress: %v", err)
			}
			if progress.Consumed.EnergyKcal != test.wantEnergy || progress.StartDate != test.wantStart || progress.EndDate != test.wantEnd {
				t.Fatalf("progress window = %+v, want energy %.0f from %s to %s", progress, test.wantEnergy, test.wantStart, test.wantEnd)
			}
			if progress.Consumed.ProteinG != test.wantProtein || progress.Consumed.TotalFatG == nil || *progress.Consumed.TotalFatG != test.wantFat {
				t.Fatalf("consumed progress = %+v, want configured macros", progress.Consumed)
			}
			goalCalories := 2200.0
			goalProtein := 140.0
			if test.name == "weekly" {
				goalCalories *= 7
				goalProtein *= 7
			}
			if progress.Remaining.EnergyKcal != goalCalories-test.wantEnergy || progress.Remaining.ProteinG != goalProtein-test.wantProtein {
				t.Fatalf("remaining progress = %+v", progress.Remaining)
			}
		})
	}
}

func TestProgressHandlerOmitsOptionalMacrosWithoutGoalTargets(t *testing.T) {
	store := &fakeMealLogStore{logs: map[string][]contracts.MealLog{"user-1": {mealLogForTest("log-1", "2026-07-15T08:00:00Z", 500, 30, 10, 50, 5)}}}
	handler := ProgressHandler{
		Goals: &fakeGoalStore{goals: map[string]contracts.Goal{"user-1": {Mode: "custom", CaloriesKcal: 2200, ProteinG: 140}}},
		Logs:  store,
		Now:   func() time.Time { return time.Date(2026, 7, 15, 12, 0, 0, 0, time.UTC) },
	}
	request := menuRequest("GET", "/progress", "user-1")
	got, err := handler.Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("get progress: %v", err)
	}
	var progress contracts.Progress
	if err := json.Unmarshal([]byte(got.Body), &progress); err != nil {
		t.Fatalf("decode progress: %v", err)
	}
	if progress.Consumed.TotalFatG != nil || progress.Remaining.TotalFatG != nil {
		t.Fatalf("optional macros should be omitted: %+v", progress)
	}
}

func mealLogForTest(id, loggedAt string, energy, protein, fat, carbs, sugar float64) contracts.MealLog {
	return contracts.MealLog{
		ID: id, MenuItemID: "meal-1", LoggedAt: loggedAt, ServingQuantity: 1,
		NutritionTotal: contracts.Nutrition{EnergyKcal: energy, ProteinG: protein, TotalFatG: fat, CarbohydrateG: carbs, SugarG: sugar},
	}
}
