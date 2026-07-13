package domain

import (
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

const (
	PresetCutting     = "cutting"
	PresetMaintenance = "maintenance"
	PresetGaining     = "gaining"
)

// ponytail: placeholder presets, replace here when exact NUSFuel defaults are chosen.
var presetGoals = map[string]contracts.Goal{
	PresetCutting:     {Mode: "preset", Preset: PresetCutting, CaloriesKcal: 1800, ProteinG: 120},
	PresetMaintenance: {Mode: "preset", Preset: PresetMaintenance, CaloriesKcal: 2200, ProteinG: 140},
	PresetGaining:     {Mode: "preset", Preset: PresetGaining, CaloriesKcal: 2600, ProteinG: 160},
}

type RecommendationRequest struct {
	Goal              contracts.Goal
	Consumed          contracts.Nutrition
	ExcludedAllergens []string
	PreferredStall    string
	RecentMenuItemIDs []string
	Limit             int
}

func ScaleNutrition(n contracts.Nutrition, servings float64) (contracts.Nutrition, error) {
	if !validPositive(servings) {
		return contracts.Nutrition{}, fmt.Errorf("servings must be greater than zero")
	}
	return contracts.Nutrition{
		EnergyKcal:    n.EnergyKcal * servings,
		ProteinG:      n.ProteinG * servings,
		TotalFatG:     n.TotalFatG * servings,
		CarbohydrateG: n.CarbohydrateG * servings,
		SugarG:        n.SugarG * servings,
	}, nil
}

func AggregateNutrition(logs []contracts.MealLog) (contracts.Nutrition, error) {
	var total contracts.Nutrition
	for _, log := range logs {
		if err := log.Validate(); err != nil {
			return contracts.Nutrition{}, fmt.Errorf("invalid meal log: %w", err)
		}
		total.EnergyKcal += log.NutritionTotal.EnergyKcal
		total.ProteinG += log.NutritionTotal.ProteinG
		total.TotalFatG += log.NutritionTotal.TotalFatG
		total.CarbohydrateG += log.NutritionTotal.CarbohydrateG
		total.SugarG += log.NutritionTotal.SugarG
	}
	return total, nil
}

func PresetGoal(preset string) (contracts.Goal, error) {
	goal, ok := presetGoals[preset]
	if !ok {
		return contracts.Goal{}, fmt.Errorf("unknown preset %q", preset)
	}
	return goal, nil
}

func ValidateGoal(goal contracts.Goal) error {
	if goal.Mode == "preset" {
		if _, ok := presetGoals[goal.Preset]; !ok {
			return fmt.Errorf("unknown preset %q", goal.Preset)
		}
	}
	if goal.Mode == "custom" && goal.Preset != "" {
		return fmt.Errorf("custom goal must not include preset")
	}
	return goal.Validate()
}

func ValidateTechnoEdgeMenuItem(item contracts.MenuItem) error {
	if err := item.Validate(); err != nil {
		return err
	}
	if !strings.HasPrefix(normalize(item.Stall), "techno edge") {
		return fmt.Errorf("stall must be Techno Edge")
	}
	if !item.Allergens.Incomplete && len(item.Allergens.Contains) == 0 && len(item.Allergens.MayContain) == 0 && len(item.Allergens.Unknown) == 0 {
		return fmt.Errorf("allergen status must be provided or marked incomplete")
	}
	return nil
}

func FilterAllergens(items []contracts.MenuItem, excluded []string) []contracts.MenuItem {
	if len(excluded) == 0 {
		return append([]contracts.MenuItem(nil), items...)
	}

	blocked := make(map[string]bool, len(excluded))
	for _, allergen := range excluded {
		blocked[normalize(allergen)] = true
	}

	var kept []contracts.MenuItem
	for _, item := range items {
		if item.Allergens.Incomplete {
			continue
		}
		if hasBlockedAllergen(item.Allergens.Contains, blocked) || hasBlockedAllergen(item.Allergens.MayContain, blocked) {
			continue
		}
		kept = append(kept, item)
	}
	return kept
}

func RankRecommendations(items []contracts.MenuItem, request RecommendationRequest) []contracts.MenuItem {
	ranked := FilterAllergens(items, request.ExcludedAllergens)
	recent := make(map[string]bool, len(request.RecentMenuItemIDs))
	for _, id := range request.RecentMenuItemIDs {
		recent[id] = true
	}

	sort.SliceStable(ranked, func(i, j int) bool {
		a, b := ranked[i], ranked[j]
		remaining := remainingNutrition(request.Goal, request.Consumed)

		if diff := compareFloat(fitDistance(a.Nutrition, remaining), fitDistance(b.Nutrition, remaining)); diff != 0 {
			return diff < 0
		}
		if diff := compareFloat(macroDistance(a.Nutrition, remaining, request.Goal.MoreOptions), macroDistance(b.Nutrition, remaining, request.Goal.MoreOptions)); diff != 0 {
			return diff < 0
		}
		if diff := compareBool(stallMatches(a.Stall, request.PreferredStall), stallMatches(b.Stall, request.PreferredStall)); diff != 0 {
			return diff > 0
		}
		if diff := compareBool(recent[a.ID], recent[b.ID]); diff != 0 {
			return diff < 0
		}
		return a.ID < b.ID
	})

	if request.Limit > 0 && len(ranked) > request.Limit {
		ranked = ranked[:request.Limit]
	}
	return ranked
}

func validPositive(value float64) bool {
	return value > 0 && !math.IsNaN(value) && !math.IsInf(value, 0)
}

func hasBlockedAllergen(values []string, blocked map[string]bool) bool {
	for _, value := range values {
		normalized := normalize(value)
		if normalized == "" {
			continue
		}
		for allergen := range blocked {
			if strings.Contains(normalized, allergen) || strings.Contains(allergen, normalized) {
				return true
			}
		}
	}
	return false
}

func normalize(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func remainingNutrition(goal contracts.Goal, consumed contracts.Nutrition) contracts.Nutrition {
	remaining := contracts.Nutrition{
		EnergyKcal: goal.CaloriesKcal - consumed.EnergyKcal,
		ProteinG:   goal.ProteinG - consumed.ProteinG,
	}
	if goal.MoreOptions != nil {
		if goal.MoreOptions.TotalFatG != nil {
			remaining.TotalFatG = *goal.MoreOptions.TotalFatG - consumed.TotalFatG
		}
		if goal.MoreOptions.CarbohydrateG != nil {
			remaining.CarbohydrateG = *goal.MoreOptions.CarbohydrateG - consumed.CarbohydrateG
		}
		if goal.MoreOptions.SugarG != nil {
			remaining.SugarG = *goal.MoreOptions.SugarG - consumed.SugarG
		}
	}
	return remaining
}

func fitDistance(n contracts.Nutrition, remaining contracts.Nutrition) float64 {
	return math.Abs(n.EnergyKcal-remaining.EnergyKcal)/10 + math.Abs(n.ProteinG-remaining.ProteinG)
}

func macroDistance(n contracts.Nutrition, remaining contracts.Nutrition, macros *contracts.MacroTargets) float64 {
	if macros == nil {
		return 0
	}
	var distance float64
	if macros.TotalFatG != nil {
		distance += math.Abs(n.TotalFatG - remaining.TotalFatG)
	}
	if macros.CarbohydrateG != nil {
		distance += math.Abs(n.CarbohydrateG - remaining.CarbohydrateG)
	}
	if macros.SugarG != nil {
		distance += math.Abs(n.SugarG - remaining.SugarG)
	}
	return distance
}

func stallMatches(stall string, preferred string) bool {
	return preferred != "" && strings.Contains(normalize(stall), normalize(preferred))
}

func compareFloat(a float64, b float64) int {
	switch {
	case a < b:
		return -1
	case a > b:
		return 1
	default:
		return 0
	}
}

func compareBool(a bool, b bool) int {
	switch {
	case a == b:
		return 0
	case a:
		return 1
	default:
		return -1
	}
}
