package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

type MealLogStore interface {
	Put(context.Context, string, contracts.MealLog) error
	List(context.Context, string, time.Time, time.Time) ([]contracts.MealLog, error)
}

type MealLogHandler struct {
	Store MealLogStore
	Menu  MenuStore
	Now   func() time.Time
}

type mealLogInput struct {
	MenuItemID      string  `json:"menuItemId"`
	ServingQuantity float64 `json:"servingQuantity"`
}

func (h MealLogHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if request.RawPath != "/meal-logs" {
		return response(404, map[string]string{"error": "not found"})
	}

	userID := authenticatedUserID(request)
	if userID == "" {
		return response(401, map[string]string{"error": "unauthorized"})
	}
	if strings.ToUpper(request.RequestContext.HTTP.Method) != "POST" {
		result, err := response(405, map[string]string{"error": "method not allowed"})
		result.Headers["allow"] = "POST"
		return result, err
	}

	input, err := decodeMealLogInput(request.Body)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	if strings.TrimSpace(input.MenuItemID) == "" {
		return response(400, map[string]string{"error": "menuItemId is required"})
	}
	item, found, err := h.Menu.Get(ctx, input.MenuItemID)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	if !found {
		return response(404, map[string]string{"error": "menu item not found"})
	}
	total, err := domain.ScaleNutrition(item.Nutrition, input.ServingQuantity)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}

	now := time.Now().UTC()
	if h.Now != nil {
		now = h.Now().UTC()
	}
	mealLog := contracts.MealLog{
		ID:              fmt.Sprintf("log-%d", now.UnixNano()),
		MenuItemID:      item.ID,
		LoggedAt:        now.Format(time.RFC3339),
		ServingQuantity: input.ServingQuantity,
		NutritionTotal:  total,
	}
	if err := h.Store.Put(ctx, userID, mealLog); err != nil {
		logPostgresFailure(ctx, "save meal log", err)
		return response(500, map[string]string{"error": "internal server error"})
	}
	return response(201, mealLog)
}

func decodeMealLogInput(body string) (mealLogInput, error) {
	var input mealLogInput
	decoder := json.NewDecoder(strings.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		return mealLogInput{}, fmt.Errorf("invalid meal log: %w", err)
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return mealLogInput{}, fmt.Errorf("invalid meal log: multiple JSON values")
		}
		return mealLogInput{}, fmt.Errorf("invalid meal log: %w", err)
	}
	return input, nil
}

type ProgressHandler struct {
	Goals GoalStore
	Logs  MealLogStore
	Now   func() time.Time
}

func (h ProgressHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if request.RawPath != "/progress" {
		return response(404, map[string]string{"error": "not found"})
	}

	userID := authenticatedUserID(request)
	if userID == "" {
		return response(401, map[string]string{"error": "unauthorized"})
	}
	if strings.ToUpper(request.RequestContext.HTTP.Method) != "GET" {
		result, err := response(405, map[string]string{"error": "method not allowed"})
		result.Headers["allow"] = "GET"
		return result, err
	}

	period, err := progressPeriod(request.RawQueryString)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	now := time.Now().UTC()
	if h.Now != nil {
		now = h.Now().UTC()
	}
	start, end := progressWindow(period, now)
	goal, found, err := h.Goals.Get(ctx, userID)
	if err != nil {
		logPostgresFailure(ctx, "get goal for progress", err)
		return response(500, map[string]string{"error": "internal server error"})
	}
	if !found {
		return response(404, map[string]string{"error": "goal not found"})
	}
	logs, err := h.Logs.List(ctx, userID, start, end)
	if err != nil {
		logPostgresFailure(ctx, "list meal logs for progress", err)
		return response(500, map[string]string{"error": "internal server error"})
	}
	consumed, err := domain.AggregateNutrition(logs)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}

	periodGoal := goal
	if period == "weekly" {
		periodGoal = scaleGoal(goal, 7)
	}
	return response(200, contracts.Progress{
		Period:    period,
		StartDate: start.Format("2006-01-02"),
		EndDate:   end.AddDate(0, 0, -1).Format("2006-01-02"),
		Goal:      periodGoal,
		Consumed:  progressNutrition(consumed, periodGoal, false),
		Remaining: progressNutrition(consumed, periodGoal, true),
	})
}

func progressPeriod(rawQuery string) (string, error) {
	period := "daily"
	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "", fmt.Errorf("invalid progress query")
	}
	if value := strings.TrimSpace(values.Get("period")); value != "" {
		period = strings.ToLower(value)
	}
	if period != "daily" && period != "weekly" {
		return "", fmt.Errorf("period must be daily or weekly")
	}
	return period, nil
}

func progressWindow(period string, now time.Time) (time.Time, time.Time) {
	now = now.UTC()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	if period == "weekly" {
		daysSinceMonday := (int(start.Weekday()) + 6) % 7
		start = start.AddDate(0, 0, -daysSinceMonday)
	}
	days := 1
	if period == "weekly" {
		days = 7
	}
	return start, start.AddDate(0, 0, days)
}

func progressNutrition(consumed contracts.Nutrition, goal contracts.Goal, remaining bool) contracts.ProgressNutrition {
	energy := consumed.EnergyKcal
	protein := consumed.ProteinG
	if remaining {
		energy = goal.CaloriesKcal - energy
		protein = goal.ProteinG - protein
	}
	result := contracts.ProgressNutrition{EnergyKcal: energy, ProteinG: protein}
	if goal.MoreOptions == nil {
		return result
	}
	result.TotalFatG = progressMacro(consumed.TotalFatG, goal.MoreOptions.TotalFatG, remaining)
	result.CarbohydrateG = progressMacro(consumed.CarbohydrateG, goal.MoreOptions.CarbohydrateG, remaining)
	result.SugarG = progressMacro(consumed.SugarG, goal.MoreOptions.SugarG, remaining)
	return result
}

func progressMacro(consumed float64, target *float64, remaining bool) *float64 {
	if target == nil {
		return nil
	}
	value := consumed
	if remaining {
		value = *target - consumed
	}
	return &value
}

func scaleGoal(goal contracts.Goal, multiplier float64) contracts.Goal {
	goal.CaloriesKcal *= multiplier
	goal.ProteinG *= multiplier
	if goal.MoreOptions != nil {
		moreOptions := *goal.MoreOptions
		moreOptions.TotalFatG = scaleTarget(moreOptions.TotalFatG, multiplier)
		moreOptions.CarbohydrateG = scaleTarget(moreOptions.CarbohydrateG, multiplier)
		moreOptions.SugarG = scaleTarget(moreOptions.SugarG, multiplier)
		goal.MoreOptions = &moreOptions
	}
	return goal
}

func scaleTarget(target *float64, multiplier float64) *float64 {
	if target == nil {
		return nil
	}
	scaled := *target * multiplier
	return &scaled
}

func authenticatedUserID(request Request) string {
	return strings.TrimSpace(request.RequestContext.Authorizer.JWT.Claims["sub"])
}
