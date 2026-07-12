package handlers

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type fakeMenuStore struct {
	items []contracts.MenuItem
}

func (f *fakeMenuStore) List(_ context.Context) ([]contracts.MenuItem, error) {
	return append([]contracts.MenuItem(nil), f.items...), nil
}

func (f *fakeMenuStore) Get(_ context.Context, id string) (contracts.MenuItem, bool, error) {
	for _, item := range f.items {
		if item.ID == id {
			return item, true, nil
		}
	}
	return contracts.MenuItem{}, false, nil
}

func TestMenuHandlerRequiresAuthentication(t *testing.T) {
	got, err := (MenuHandler{Store: &fakeMenuStore{}}).Handle(context.Background(), Request{
		RawPath:        "/menu",
		RequestContext: requestContext{HTTP: httpContext{Method: "GET"}},
	})
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", got.StatusCode)
	}
}

func TestMenuHandlerListsStoredItemsWithNutritionAndMetadata(t *testing.T) {
	item := handlerMenuItem("meal-1")
	got, err := (MenuHandler{Store: &fakeMenuStore{items: []contracts.MenuItem{item}}}).Handle(
		context.Background(),
		menuRequest("GET", "/menu", "user-1"),
	)
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", got.StatusCode)
	}

	var items []contracts.MenuItem
	if err := json.Unmarshal([]byte(got.Body), &items); err != nil {
		t.Fatalf("decode list response: %v", err)
	}
	if len(items) != 1 {
		t.Fatalf("items = %+v, want one item", items)
	}
	returned := items[0]
	if returned.ID != item.ID || returned.Stall != item.Stall || returned.Name != item.Name {
		t.Fatalf("returned item identity = %+v, want %+v", returned, item)
	}
	if returned.Nutrition != item.Nutrition {
		t.Fatalf("nutrition = %+v, want %+v", returned.Nutrition, item.Nutrition)
	}
	if !returned.Allergens.Incomplete || len(returned.Allergens.Unknown) == 0 {
		t.Fatalf("incomplete allergens were not preserved: %+v", returned.Allergens)
	}
	if returned.Source.Name != item.Source.Name || returned.Source.Confidence != item.Source.Confidence {
		t.Fatalf("source metadata = %+v, want %+v", returned.Source, item.Source)
	}
}

func TestMenuHandlerReturnsMealDetail(t *testing.T) {
	item := handlerMenuItem("meal-1")
	got, err := (MenuHandler{Store: &fakeMenuStore{items: []contracts.MenuItem{item}}}).Handle(
		context.Background(),
		menuRequest("GET", "/menu/meal-1", "user-1"),
	)
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", got.StatusCode)
	}

	var returned contracts.MenuItem
	if err := json.Unmarshal([]byte(got.Body), &returned); err != nil {
		t.Fatalf("decode detail response: %v", err)
	}
	if returned.ID != item.ID || returned.Nutrition != item.Nutrition || returned.Source != item.Source {
		t.Fatalf("detail = %+v, want %+v", returned, item)
	}
}

func TestMenuHandlerReturnsNotFoundForUnknownMeal(t *testing.T) {
	got, err := (MenuHandler{Store: &fakeMenuStore{}}).Handle(
		context.Background(),
		menuRequest("GET", "/menu/missing", "user-1"),
	)
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", got.StatusCode)
	}
}

func TestMenuHandlerOnlyAllowsGET(t *testing.T) {
	got, err := (MenuHandler{Store: &fakeMenuStore{}}).Handle(
		context.Background(),
		menuRequest("POST", "/menu", "user-1"),
	)
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 405 || got.Headers["allow"] != "GET" {
		t.Fatalf("response = %+v, want 405 with Allow GET", got)
	}
}

func menuRequest(method, path, userID string) Request {
	return Request{
		RawPath: path,
		RequestContext: requestContext{
			HTTP: httpContext{Method: method},
			Authorizer: authorizerContext{JWT: jwtContext{Claims: map[string]string{
				"sub": userID,
			}}},
		},
	}
}

func handlerMenuItem(id string) contracts.MenuItem {
	return contracts.MenuItem{
		ID:    id,
		Stall: "Techno Edge 1 Western",
		Name:  "Chicken rice",
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
			Unknown:    []string{"not provided"},
			Incomplete: true,
		},
		Source: contracts.Source{
			Name:         "Techno Edge menu",
			URL:          "https://example.test/menu.pdf",
			LastVerified: "2026-07-12",
			Confidence:   "official_pdf",
		},
	}
}
