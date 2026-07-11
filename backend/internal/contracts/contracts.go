package contracts

import "fmt"

type Nutrition struct {
	EnergyKcal    float64 `json:"energyKcal"`
	ProteinG      float64 `json:"proteinG"`
	TotalFatG     float64 `json:"totalFatG"`
	CarbohydrateG float64 `json:"carbohydrateG"`
	SugarG        float64 `json:"sugarG"`
}

func (n Nutrition) Validate() error {
	if n.EnergyKcal <= 0 {
		return fmt.Errorf("energyKcal must be greater than zero")
	}
	if n.ProteinG < 0 || n.TotalFatG < 0 || n.CarbohydrateG < 0 || n.SugarG < 0 {
		return fmt.Errorf("nutrition values must not be negative")
	}
	return nil
}

type Serving struct {
	Quantity float64 `json:"quantity"`
	Unit     string  `json:"unit"`
}

func (s Serving) Validate() error {
	if s.Quantity <= 0 {
		return fmt.Errorf("serving quantity must be greater than zero")
	}
	if s.Unit == "" {
		return fmt.Errorf("serving unit is required")
	}
	return nil
}

type Allergens struct {
	Contains   []string `json:"contains"`
	MayContain []string `json:"mayContain"`
	Unknown    []string `json:"unknown"`
	Incomplete bool     `json:"incomplete"`
}

type Source struct {
	Name         string `json:"name"`
	URL          string `json:"url,omitempty"`
	LastVerified string `json:"lastVerified"`
	Confidence   string `json:"confidence"`
}

func (s Source) Validate() error {
	if s.Name == "" {
		return fmt.Errorf("source name is required")
	}
	if s.LastVerified == "" {
		return fmt.Errorf("source lastVerified is required")
	}
	if s.Confidence == "" {
		return fmt.Errorf("source confidence is required")
	}
	return nil
}

type MenuItem struct {
	ID        string    `json:"id"`
	Stall     string    `json:"stall"`
	Name      string    `json:"name"`
	Serving   Serving   `json:"serving"`
	Nutrition Nutrition `json:"nutrition"`
	Allergens Allergens `json:"allergens"`
	Source    Source    `json:"source"`
}

func (m MenuItem) Validate() error {
	if m.ID == "" || m.Stall == "" || m.Name == "" {
		return fmt.Errorf("menu item id, stall, and name are required")
	}
	if err := m.Serving.Validate(); err != nil {
		return err
	}
	if err := m.Nutrition.Validate(); err != nil {
		return err
	}
	return m.Source.Validate()
}

type MacroTargets struct {
	TotalFatG     *float64 `json:"totalFatG,omitempty"`
	CarbohydrateG *float64 `json:"carbohydrateG,omitempty"`
	SugarG        *float64 `json:"sugarG,omitempty"`
}

func (m MacroTargets) Validate() error {
	for name, value := range map[string]*float64{
		"totalFatG":     m.TotalFatG,
		"carbohydrateG": m.CarbohydrateG,
		"sugarG":        m.SugarG,
	} {
		if value != nil && *value < 0 {
			return fmt.Errorf("%s must not be negative", name)
		}
	}
	return nil
}

type Goal struct {
	Mode         string        `json:"mode"`
	Preset       string        `json:"preset,omitempty"`
	CaloriesKcal float64       `json:"caloriesKcal"`
	ProteinG     float64       `json:"proteinG"`
	MoreOptions  *MacroTargets `json:"moreOptions,omitempty"`
}

func (g Goal) Validate() error {
	if g.Mode != "preset" && g.Mode != "custom" {
		return fmt.Errorf("mode must be preset or custom")
	}
	if g.Mode == "preset" && g.Preset == "" {
		return fmt.Errorf("preset is required for preset goals")
	}
	if g.CaloriesKcal <= 0 || g.ProteinG <= 0 {
		return fmt.Errorf("caloriesKcal and proteinG must be greater than zero")
	}
	if g.MoreOptions != nil {
		return g.MoreOptions.Validate()
	}
	return nil
}

type MealLog struct {
	ID              string    `json:"id"`
	MenuItemID      string    `json:"menuItemId"`
	LoggedAt        string    `json:"loggedAt"`
	ServingQuantity float64   `json:"servingQuantity"`
	NutritionTotal  Nutrition `json:"nutritionTotal"`
}

func (m MealLog) Validate() error {
	if m.ID == "" || m.MenuItemID == "" || m.LoggedAt == "" {
		return fmt.Errorf("meal log id, menuItemId, and loggedAt are required")
	}
	if m.ServingQuantity <= 0 {
		return fmt.Errorf("servingQuantity must be greater than zero")
	}
	return m.NutritionTotal.Validate()
}

type Recommendation struct {
	Rank             int       `json:"rank"`
	MenuItemID       string    `json:"menuItemId"`
	FitReason        string    `json:"fitReason"`
	NutritionImpact  Nutrition `json:"nutritionImpact"`
	AllergenWarnings []string  `json:"allergenWarnings"`
}

func (r Recommendation) Validate() error {
	if r.Rank <= 0 {
		return fmt.Errorf("rank must be greater than zero")
	}
	if r.MenuItemID == "" || r.FitReason == "" {
		return fmt.Errorf("menuItemId and fitReason are required")
	}
	return r.NutritionImpact.Validate()
}
