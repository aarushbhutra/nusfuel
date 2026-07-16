package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/ai"
	"github.com/aarushbhutra/nusfuel/backend/internal/config"
	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestAPIHandlerSearchesOnlyStoredMealsWithValidatedDeepSeekFilters(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]string{{
				"type": "text",
				"text": `{"keywords":["chicken"],"excludedAllergens":["Peanuts"],"preferredStall":"Western"}`,
			}},
		})
	}))
	defer server.Close()

	api := NewAPIHandlerWithDeepSeek(
		&fakeGoalStore{},
		&fakeMenuStore{items: []contracts.MenuItem{
			{ID: "safe", Name: "Grilled Chicken", Stall: "Western"},
			{ID: "peanut", Name: "Chicken Rice", Stall: "Western", Allergens: contracts.Allergens{Contains: []string{"Peanuts"}}},
		}},
		ai.NewDeepSeekExtractor(config.DeepSeekConfig{APIKey: "test-key", BaseURL: server.URL, Model: config.DeepSeekV4FlashModel}, server.Client()),
	)
	request := menuRequest("GET", "/search", "user-1")
	request.RawQueryString = "query=chicken+without+peanuts+at+Western"

	got, err := api.Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("search meals: %v", err)
	}
	if got.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", got.StatusCode)
	}

	var result NaturalLanguageSearchResponse
	if err := json.Unmarshal([]byte(got.Body), &result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if result.UsedFallback || len(result.Items) != 1 || result.Items[0].ID != "safe" {
		t.Fatalf("result = %+v, want only the stored safe meal", result)
	}
}
