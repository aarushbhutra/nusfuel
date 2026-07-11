package domain

import (
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestScaleNutritionRejectsInvalidServings(t *testing.T) {
	_, err := ScaleNutrition(contracts.Nutrition{EnergyKcal: 100}, 0)
	if err == nil {
		t.Fatal("expected invalid serving error")
	}
}

func TestScaleNutritionScalesAllMacros(t *testing.T) {
	got, err := ScaleNutrition(contracts.Nutrition{
		EnergyKcal:    100,
		ProteinG:      10,
		TotalFatG:     5,
		CarbohydrateG: 20,
		SugarG:        2,
	}, 1.5)
	if err != nil {
		t.Fatalf("scale nutrition: %v", err)
	}

	want := contracts.Nutrition{
		EnergyKcal:    150,
		ProteinG:      15,
		TotalFatG:     7.5,
		CarbohydrateG: 30,
		SugarG:        3,
	}
	if got != want {
		t.Fatalf("scaled nutrition = %+v, want %+v", got, want)
	}
}

func TestPresetAndCustomGoalsValidate(t *testing.T) {
	preset, err := PresetGoal(PresetCutting)
	if err != nil {
		t.Fatalf("preset goal: %v", err)
	}
	if err := ValidateGoal(preset); err != nil {
		t.Fatalf("preset should validate: %v", err)
	}

	custom := contracts.Goal{
		Mode:         "custom",
		CaloriesKcal: 2400,
		ProteinG:     150,
	}
	if err := ValidateGoal(custom); err != nil {
		t.Fatalf("custom should validate: %v", err)
	}

	if _, err := PresetGoal("bulk"); err == nil {
		t.Fatal("unknown preset should fail")
	}
}

func TestFilterAllergensExcludesKnownAndIncompleteItems(t *testing.T) {
	items := []contracts.MenuItem{
		menuItem("safe", 400, 30, "Techno Edge 1 Western"),
		menuItem("peanut", 400, 30, "Techno Edge 2 Nasi Padang"),
		menuItem("unknown", 400, 30, "Techno Edge 3 Vegetarian"),
	}
	items[1].Allergens.Contains = []string{"Peanuts"}
	items[2].Allergens = contracts.Allergens{Unknown: []string{"not provided"}, Incomplete: true}

	got := FilterAllergens(items, []string{"peanuts"})
	if len(got) != 1 || got[0].ID != "safe" {
		t.Fatalf("filtered items = %+v, want only safe", got)
	}
}

func TestRankRecommendationsFollowsDomainOrder(t *testing.T) {
	target := contracts.Goal{Mode: "custom", CaloriesKcal: 500, ProteinG: 30}

	t.Run("calorie and protein fit before outlet", func(t *testing.T) {
		got := RankRecommendations([]contracts.MenuItem{
			menuItem("preferred-worse-fit", 700, 10, "Techno Edge 1 Western"),
			menuItem("better-fit", 500, 30, "Techno Edge 2 Nasi Padang"),
		}, RecommendationRequest{Goal: target, PreferredStall: "Western"})

		assertOrder(t, got, "better-fit", "preferred-worse-fit")
	})

	t.Run("optional macro fit breaks calorie protein ties", func(t *testing.T) {
		fat := 12.0
		got := RankRecommendations([]contracts.MenuItem{
			menuItemWithFat("high-fat", 500, 30, 30, "Techno Edge 1 Western"),
			menuItemWithFat("macro-fit", 500, 30, 12, "Techno Edge 2 Nasi Padang"),
		}, RecommendationRequest{
			Goal: contracts.Goal{
				Mode:         "custom",
				CaloriesKcal: 500,
				ProteinG:     30,
				MoreOptions:  &contracts.MacroTargets{TotalFatG: &fat},
			},
		})

		assertOrder(t, got, "macro-fit", "high-fat")
	})

	t.Run("outlet relevance breaks macro ties", func(t *testing.T) {
		got := RankRecommendations([]contracts.MenuItem{
			menuItem("other", 500, 30, "Techno Edge 2 Nasi Padang"),
			menuItem("preferred", 500, 30, "Techno Edge 1 Western"),
		}, RecommendationRequest{Goal: target, PreferredStall: "Western"})

		assertOrder(t, got, "preferred", "other")
	})

	t.Run("variety breaks outlet ties", func(t *testing.T) {
		got := RankRecommendations([]contracts.MenuItem{
			menuItem("recent", 500, 30, "Techno Edge 1 Western"),
			menuItem("fresh", 500, 30, "Techno Edge 1 Western"),
		}, RecommendationRequest{Goal: target, PreferredStall: "Western", RecentMenuItemIDs: []string{"recent"}})

		assertOrder(t, got, "fresh", "recent")
	})
}

func assertOrder(t *testing.T, got []contracts.MenuItem, ids ...string) {
	t.Helper()

	if len(got) < len(ids) {
		t.Fatalf("got %d items, want at least %d", len(got), len(ids))
	}
	for i, id := range ids {
		if got[i].ID != id {
			t.Fatalf("rank %d = %s, want %s", i+1, got[i].ID, id)
		}
	}
}

func menuItem(id string, calories float64, protein float64, stall string) contracts.MenuItem {
	return menuItemWithFat(id, calories, protein, 10, stall)
}

func menuItemWithFat(id string, calories float64, protein float64, fat float64, stall string) contracts.MenuItem {
	return contracts.MenuItem{
		ID:    id,
		Stall: stall,
		Name:  id,
		Serving: contracts.Serving{
			Quantity: 1,
			Unit:     "serving",
		},
		Nutrition: contracts.Nutrition{
			EnergyKcal: calories,
			ProteinG:   protein,
			TotalFatG:  fat,
		},
		Allergens: contracts.Allergens{Contains: []string{}},
		Source: contracts.Source{
			Name:         "test",
			LastVerified: "2026-07-12",
			Confidence:   "test",
		},
	}
}
