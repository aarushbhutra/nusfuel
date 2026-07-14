package handlers

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

type RecommendationHandler struct {
	Goals GoalStore
	Menu  MenuStore
	Logs  MealLogStore
	Now   func() time.Time
}

func (h RecommendationHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if request.RawPath != "/recommendations" {
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

	period, allergens, preferredStall, err := recommendationQuery(request.RawQueryString)
	if err != nil {
		return response(400, map[string]string{"error": err.Error()})
	}
	goal, found, err := h.Goals.Get(ctx, userID)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	if !found {
		return response(404, map[string]string{"error": "goal not found"})
	}

	now := time.Now().UTC()
	if h.Now != nil {
		now = h.Now().UTC()
	}
	start, end := progressWindow(period, now)
	logs, err := h.Logs.List(ctx, userID, start, end)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	consumed, err := domain.AggregateNutrition(logs)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	if period == "weekly" {
		goal = scaleGoal(goal, 7)
	}
	items, err := h.Menu.List(ctx)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}

	recent := make([]string, 0, len(logs))
	for _, log := range logs {
		recent = append(recent, log.MenuItemID)
	}
	ranked := domain.RankRecommendations(items, domain.RecommendationRequest{
		Goal:              goal,
		Consumed:          consumed,
		ExcludedAllergens: allergens,
		PreferredStall:    preferredStall,
		RecentMenuItemIDs: recent,
		Limit:             3,
	})
	recommendations := make([]contracts.Recommendation, 0, len(ranked))
	for index, item := range ranked {
		recommendation := contracts.Recommendation{
			Rank:            index + 1,
			MenuItemID:      item.ID,
			FitReason:       fmt.Sprintf("Best fit for remaining %s target", period),
			NutritionImpact: item.Nutrition,
		}
		if item.Allergens.Incomplete {
			recommendation.AllergenWarnings = []string{"Allergen data incomplete: check with the stall before ordering."}
		}
		recommendations = append(recommendations, recommendation)
	}
	return response(200, recommendations)
}

func recommendationQuery(rawQuery string) (string, []string, string, error) {
	period, err := progressPeriod(rawQuery)
	if err != nil {
		return "", nil, "", err
	}
	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "", nil, "", fmt.Errorf("invalid recommendation query")
	}
	allergens := make([]string, 0, len(values["allergen"]))
	for _, allergen := range values["allergen"] {
		if allergen = strings.TrimSpace(allergen); allergen != "" {
			allergens = append(allergens, allergen)
		}
	}
	return period, allergens, strings.TrimSpace(values.Get("stall")), nil
}
