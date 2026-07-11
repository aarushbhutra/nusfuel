package seed

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadTechnoEdgeDirValidatesRealSeedFiles(t *testing.T) {
	items, err := LoadTechnoEdgeDir(filepath.Join("..", "..", "..", "data", "techno-edge"))
	if err != nil {
		t.Fatalf("load seed data: %v", err)
	}
	if len(items) == 0 {
		t.Fatal("expected seed menu items")
	}

	for _, item := range items {
		if err := item.Validate(); err != nil {
			t.Fatalf("%s should validate: %v", item.ID, err)
		}
		if item.Serving.Quantity != 1 {
			t.Fatalf("%s serving quantity = %v, want 1", item.ID, item.Serving.Quantity)
		}
		if item.Source.URL == "" || item.Source.Confidence == "" {
			t.Fatalf("%s missing source URL or confidence", item.ID)
		}
		if len(item.Allergens.Contains) == 0 && len(item.Allergens.Unknown) == 0 && !item.Allergens.Incomplete {
			t.Fatalf("%s missing allergen status", item.ID)
		}
	}
}

func TestLoadTechnoEdgeFileMarksMissingAllergensIncomplete(t *testing.T) {
	path := writeSeedFile(t, `{
		"source_url": "https://example.com/menu.pdf",
		"source_confidence": "official_pdf",
		"source_last_verified": "2026-07-12",
		"pdf": {"filename": "menu.pdf"},
		"canteen": {"name": "Techno Edge", "stall_number": 1, "food_type": "Test Stall"},
		"dishes": [{
			"number": 1,
			"name": "Rice",
			"energy_kcal": 100,
			"protein_g": 3,
			"total_fat_g": 1,
			"carbohydrate_g": 20,
			"sugar_g": 0
		}]
	}`)

	items, err := LoadTechnoEdgeFile(path)
	if err != nil {
		t.Fatalf("load seed file: %v", err)
	}
	if !items[0].Allergens.Incomplete || len(items[0].Allergens.Unknown) == 0 {
		t.Fatalf("missing allergens should be incomplete: %+v", items[0].Allergens)
	}
}

func TestLoadTechnoEdgeFileRejectsMissingConfidence(t *testing.T) {
	path := writeSeedFile(t, `{
		"source_url": "https://example.com/menu.pdf",
		"source_last_verified": "2026-07-12",
		"pdf": {"filename": "menu.pdf"},
		"canteen": {"name": "Techno Edge", "stall_number": 1, "food_type": "Test Stall"},
		"dishes": [{
			"number": 1,
			"name": "Rice",
			"energy_kcal": 100,
			"protein_g": 3,
			"total_fat_g": 1,
			"carbohydrate_g": 20,
			"sugar_g": 0,
			"allergens": []
		}]
	}`)

	_, err := LoadTechnoEdgeFile(path)
	if err == nil || !strings.Contains(err.Error(), "source_confidence") {
		t.Fatalf("expected source_confidence error, got %v", err)
	}
}

func writeSeedFile(t *testing.T, content string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "stall.json")
	if err := os.WriteFile(path, []byte(content), 0600); err != nil {
		t.Fatalf("write seed file: %v", err)
	}
	return path
}
