package seed

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type stallFile struct {
	SourceURL          string `json:"source_url"`
	SourceConfidence   string `json:"source_confidence"`
	SourceLastVerified string `json:"source_last_verified"`
	PDF                struct {
		Filename string `json:"filename"`
	} `json:"pdf"`
	Canteen struct {
		Name        string      `json:"name"`
		StallNumber interface{} `json:"stall_number"`
		FoodType    string      `json:"food_type"`
	} `json:"canteen"`
	Dishes []dish `json:"dishes"`
}

type dish struct {
	Number        int      `json:"number"`
	Name          string   `json:"name"`
	EnergyKcal    *float64 `json:"energy_kcal"`
	ProteinG      *float64 `json:"protein_g"`
	TotalFatG     *float64 `json:"total_fat_g"`
	CarbohydrateG *float64 `json:"carbohydrate_g"`
	SugarG        *float64 `json:"sugar_g"`
	Allergens     []string `json:"allergens"`
}

func LoadTechnoEdgeDir(dir string) ([]contracts.MenuItem, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.EqualFold(filepath.Ext(entry.Name()), ".json") {
			files = append(files, filepath.Join(dir, entry.Name()))
		}
	}
	sort.Strings(files)
	if len(files) == 0 {
		return nil, fmt.Errorf("no seed json files in %s", dir)
	}

	var items []contracts.MenuItem
	for _, file := range files {
		fileItems, err := LoadTechnoEdgeFile(file)
		if err != nil {
			return nil, err
		}
		items = append(items, fileItems...)
	}
	return items, nil
}

func LoadTechnoEdgeFile(path string) ([]contracts.MenuItem, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var file stallFile
	if err := json.Unmarshal(data, &file); err != nil {
		return nil, fmt.Errorf("%s: decode seed json: %w", path, err)
	}
	if err := file.validate(path); err != nil {
		return nil, err
	}

	stall := file.stallName()
	source := contracts.Source{
		Name:         file.PDF.Filename,
		URL:          file.SourceURL,
		LastVerified: file.SourceLastVerified,
		Confidence:   file.SourceConfidence,
	}

	items := make([]contracts.MenuItem, 0, len(file.Dishes))
	fileSlug := slug(strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)))
	for i, dish := range file.Dishes {
		if err := dish.validate(path, i); err != nil {
			return nil, err
		}

		item := contracts.MenuItem{
			ID:    fmt.Sprintf("techno-edge-%s-%03d", fileSlug, dish.Number),
			Stall: stall,
			Name:  dish.Name,
			Serving: contracts.Serving{
				Quantity: 1,
				Unit:     "serving",
			},
			Nutrition: contracts.Nutrition{
				EnergyKcal:    *dish.EnergyKcal,
				ProteinG:      *dish.ProteinG,
				TotalFatG:     *dish.TotalFatG,
				CarbohydrateG: *dish.CarbohydrateG,
				SugarG:        *dish.SugarG,
			},
			Allergens: allergens(dish.Allergens),
			Source:    source,
		}
		if err := item.Validate(); err != nil {
			return nil, fmt.Errorf("%s dish %d: %w", path, i+1, err)
		}
		items = append(items, item)
	}
	return items, nil
}

func (f stallFile) validate(path string) error {
	if f.SourceURL == "" {
		return fmt.Errorf("%s: source_url is required", path)
	}
	if f.SourceConfidence == "" {
		return fmt.Errorf("%s: source_confidence is required", path)
	}
	if f.SourceLastVerified == "" {
		return fmt.Errorf("%s: source_last_verified is required", path)
	}
	if f.PDF.Filename == "" {
		return fmt.Errorf("%s: pdf.filename is required", path)
	}
	if !strings.Contains(strings.ToLower(f.Canteen.Name), "techno edge") {
		return fmt.Errorf("%s: canteen.name must be Techno Edge", path)
	}
	if f.Canteen.FoodType == "" {
		return fmt.Errorf("%s: canteen.food_type is required", path)
	}
	if len(f.Dishes) == 0 {
		return fmt.Errorf("%s: dishes are required", path)
	}
	return nil
}

func (f stallFile) stallName() string {
	stall := fmt.Sprint(f.Canteen.StallNumber)
	if n, ok := f.Canteen.StallNumber.(float64); ok {
		stall = strconv.Itoa(int(n))
	}
	return strings.TrimSpace("Techno Edge " + stall + " " + f.Canteen.FoodType)
}

func (d dish) validate(path string, index int) error {
	prefix := fmt.Sprintf("%s dish %d", path, index+1)
	if d.Number <= 0 {
		return fmt.Errorf("%s: number is required", prefix)
	}
	if d.Name == "" {
		return fmt.Errorf("%s: name is required", prefix)
	}
	if d.EnergyKcal == nil || d.ProteinG == nil || d.TotalFatG == nil || d.CarbohydrateG == nil || d.SugarG == nil {
		return fmt.Errorf("%s: all nutrition fields are required", prefix)
	}
	if *d.EnergyKcal <= 0 {
		return fmt.Errorf("%s: energy_kcal must be greater than zero", prefix)
	}
	if *d.ProteinG < 0 || *d.TotalFatG < 0 || *d.CarbohydrateG < 0 || *d.SugarG < 0 {
		return fmt.Errorf("%s: nutrition values must not be negative", prefix)
	}
	return nil
}

func allergens(values []string) contracts.Allergens {
	if len(values) == 0 {
		return contracts.Allergens{
			Unknown:    []string{"not provided"},
			Incomplete: true,
		}
	}
	return contracts.Allergens{Contains: values}
}

func slug(value string) string {
	var b strings.Builder
	lastHyphen := false
	for _, r := range strings.ToLower(value) {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			b.WriteRune(r)
			lastHyphen = false
			continue
		}
		if !lastHyphen {
			b.WriteByte('-')
			lastHyphen = true
		}
	}
	return strings.Trim(b.String(), "-")
}
