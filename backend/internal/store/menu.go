package store

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

type SeedMenuStore struct {
	itemsByID map[string]contracts.MenuItem
	items     []contracts.MenuItem
}

func NewSeedMenuStore(items []contracts.MenuItem) (*SeedMenuStore, error) {
	itemsByID := make(map[string]contracts.MenuItem, len(items))
	stored := make([]contracts.MenuItem, 0, len(items))
	for _, item := range items {
		if err := domain.ValidateTechnoEdgeMenuItem(item); err != nil {
			return nil, fmt.Errorf("menu item %q: %w", item.ID, err)
		}
		if _, exists := itemsByID[item.ID]; exists {
			return nil, fmt.Errorf("duplicate menu item ID %q", item.ID)
		}

		cloned := cloneMenuItem(item)
		itemsByID[item.ID] = cloned
		stored = append(stored, cloned)
	}

	sort.SliceStable(stored, func(i, j int) bool {
		if stored[i].Stall != stored[j].Stall {
			return stored[i].Stall < stored[j].Stall
		}
		if stored[i].Name != stored[j].Name {
			return stored[i].Name < stored[j].Name
		}
		return stored[i].ID < stored[j].ID
	})

	return &SeedMenuStore{itemsByID: itemsByID, items: stored}, nil
}

func (s *SeedMenuStore) List(_ context.Context) ([]contracts.MenuItem, error) {
	items := make([]contracts.MenuItem, 0, len(s.items))
	for _, item := range s.items {
		items = append(items, cloneMenuItem(item))
	}
	return items, nil
}

func (s *SeedMenuStore) Get(_ context.Context, id string) (contracts.MenuItem, bool, error) {
	item, found := s.itemsByID[strings.TrimSpace(id)]
	if !found {
		return contracts.MenuItem{}, false, nil
	}
	return cloneMenuItem(item), true, nil
}

func cloneMenuItem(item contracts.MenuItem) contracts.MenuItem {
	item.Allergens.Contains = cloneStrings(item.Allergens.Contains)
	item.Allergens.MayContain = cloneStrings(item.Allergens.MayContain)
	item.Allergens.Unknown = cloneStrings(item.Allergens.Unknown)
	return item
}

func cloneStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return append([]string{}, values...)
}
