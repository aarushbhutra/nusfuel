package contracts

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestExampleContractsValidate(t *testing.T) {
	examples := []struct {
		name string
		file string
		into interface {
			Validate() error
		}
	}{
		{name: "menu item", file: "menu-item.json", into: &MenuItem{}},
		{name: "goal", file: "goal.json", into: &Goal{}},
		{name: "meal log", file: "meal-log.json", into: &MealLog{}},
		{name: "recommendation", file: "recommendation.json", into: &Recommendation{}},
	}

	for _, example := range examples {
		t.Run(example.name, func(t *testing.T) {
			data, err := os.ReadFile(filepath.Join("..", "..", "..", "data", "examples", example.file))
			if err != nil {
				t.Fatalf("read example: %v", err)
			}
			if err := json.Unmarshal(data, example.into); err != nil {
				t.Fatalf("decode example: %v", err)
			}
			if err := example.into.Validate(); err != nil {
				t.Fatalf("validate example: %v", err)
			}
		})
	}
}

func TestGoalSupportsCustomCaloriesAndProtein(t *testing.T) {
	goal := Goal{
		Mode:         "custom",
		CaloriesKcal: 2400,
		ProteinG:     150,
	}

	if err := goal.Validate(); err != nil {
		t.Fatalf("custom goal should validate: %v", err)
	}
}
