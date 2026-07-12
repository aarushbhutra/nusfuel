package store

import (
	"context"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestSeedMenuStoreListsValidatedTechnoEdgeItemsInStableOrder(t *testing.T) {
	items := []contracts.MenuItem{
		testMenuItem("b", "Techno Edge 2 Chinese", "B Dish"),
		testMenuItem("a", "Techno Edge 1 Western", "A Dish"),
	}

	menu, err := NewSeedMenuStore(items)
	if err != nil {
		t.Fatalf("create menu store: %v", err)
	}

	items[0].Name = "mutated after construction"
	got, err := menu.List(context.Background())
	if err != nil {
		t.Fatalf("list menu: %v", err)
	}
	if len(got) != 2 || got[0].ID != "a" || got[1].ID != "b" {
		t.Fatalf("menu items = %+v, want a then b", got)
	}
	if got[1].Name != "B Dish" {
		t.Fatalf("store retained caller mutation: %+v", got[1])
	}
	if got[0].Allergens.Contains == nil || got[0].Allergens.MayContain == nil || got[0].Allergens.Unknown == nil {
		t.Fatalf("allergen lists should be JSON arrays, got %+v", got[0].Allergens)
	}
}

func TestSeedMenuStoreGetsStoredItemByID(t *testing.T) {
	menu, err := NewSeedMenuStore([]contracts.MenuItem{
		testMenuItem("meal-1", "Techno Edge 1 Western", "Chicken rice"),
	})
	if err != nil {
		t.Fatalf("create menu store: %v", err)
	}

	got, found, err := menu.Get(context.Background(), "meal-1")
	if err != nil {
		t.Fatalf("get menu item: %v", err)
	}
	if !found || got.ID != "meal-1" || got.Name != "Chicken rice" {
		t.Fatalf("item = %+v, found = %v", got, found)
	}

	_, found, err = menu.Get(context.Background(), "missing")
	if err != nil {
		t.Fatalf("get missing menu item: %v", err)
	}
	if found {
		t.Fatal("missing menu item should not be found")
	}
}

func TestSeedMenuStoreRejectsNonTechnoEdgeAndDuplicateItems(t *testing.T) {
	_, err := NewSeedMenuStore([]contracts.MenuItem{
		testMenuItem("meal-1", "Other Canteen Stall", "Dish"),
	})
	if err == nil {
		t.Fatal("non-Techno Edge item should be rejected")
	}

	_, err = NewSeedMenuStore([]contracts.MenuItem{
		testMenuItem("meal-1", "Techno Edge 1 Western", "Dish 1"),
		testMenuItem("meal-1", "Techno Edge 1 Western", "Dish 2"),
	})
	if err == nil {
		t.Fatal("duplicate item ID should be rejected")
	}
}

func testMenuItem(id, stall, name string) contracts.MenuItem {
	return contracts.MenuItem{
		ID:    id,
		Stall: stall,
		Name:  name,
		Serving: contracts.Serving{
			Quantity: 1,
			Unit:     "serving",
		},
		Nutrition: contracts.Nutrition{
			EnergyKcal:    500,
			ProteinG:      30,
			TotalFatG:     10,
			CarbohydrateG: 50,
			SugarG:        5,
		},
		Allergens: contracts.Allergens{
			Contains: []string{"soy"},
		},
		Source: contracts.Source{
			Name:         "Techno Edge menu",
			LastVerified: "2026-07-12",
			Confidence:   "official_pdf",
		},
	}
}
