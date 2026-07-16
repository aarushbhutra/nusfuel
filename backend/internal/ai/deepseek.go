package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
	"unicode"

	"github.com/aarushbhutra/nusfuel/backend/internal/config"
	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

const (
	maxQueryLength  = 500
	maxFilterValues = 5
	maxKeywordBytes = 64
	maxResponseSize = 64 << 10
)

type HTTPClient interface {
	Do(*http.Request) (*http.Response, error)
}

type Filters struct {
	Keywords          []string `json:"keywords"`
	ExcludedAllergens []string `json:"excludedAllergens"`
	PreferredStall    string   `json:"preferredStall"`
}

type SearchResult struct {
	Items        []contracts.MenuItem
	Filters      Filters
	UsedFallback bool
}

type DeepSeekExtractor struct {
	config config.DeepSeekConfig
	client HTTPClient
}

func NewDeepSeekExtractor(deepSeekConfig config.DeepSeekConfig, client HTTPClient) DeepSeekExtractor {
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	return DeepSeekExtractor{config: deepSeekConfig, client: client}
}

func (e DeepSeekExtractor) Search(ctx context.Context, query string, items []contracts.MenuItem) SearchResult {
	catalog := newFilterCatalog(items)
	filters, err := e.Extract(ctx, query, catalog)
	if err != nil {
		filters = fallbackFilters(query, items)
	}
	return SearchResult{
		Items:        filterMenuItems(items, filters),
		Filters:      filters,
		UsedFallback: err != nil,
	}
}

func (e DeepSeekExtractor) Extract(ctx context.Context, query string, catalog filterCatalog) (Filters, error) {
	query = strings.TrimSpace(query)
	if query == "" || len(query) > maxQueryLength {
		return Filters{}, fmt.Errorf("meal request must be between 1 and %d characters", maxQueryLength)
	}
	if strings.TrimSpace(e.config.APIKey) == "" || strings.TrimSpace(e.config.BaseURL) == "" || strings.TrimSpace(e.config.Model) == "" {
		return Filters{}, fmt.Errorf("DeepSeek configuration is incomplete")
	}

	body, err := json.Marshal(messageRequest{
		Model:       e.config.Model,
		MaxTokens:   256,
		Temperature: 0,
		System:      catalog.prompt(),
		Messages:    []message{{Role: "user", Content: query}},
	})
	if err != nil {
		return Filters{}, fmt.Errorf("encode DeepSeek request: %w", err)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(e.config.BaseURL, "/")+"/v1/messages", strings.NewReader(string(body)))
	if err != nil {
		return Filters{}, fmt.Errorf("create DeepSeek request: %w", err)
	}
	request.Header.Set("content-type", "application/json")
	request.Header.Set("x-api-key", e.config.APIKey)
	request.Header.Set("anthropic-version", "2023-06-01")

	response, err := e.client.Do(request)
	if err != nil {
		return Filters{}, fmt.Errorf("call DeepSeek: %w", err)
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(response.Body, maxResponseSize))
	if err != nil {
		return Filters{}, fmt.Errorf("read DeepSeek response: %w", err)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return Filters{}, fmt.Errorf("DeepSeek returned status %d", response.StatusCode)
	}

	var decoded messageResponse
	if err := json.Unmarshal(responseBody, &decoded); err != nil {
		return Filters{}, fmt.Errorf("decode DeepSeek response: %w", err)
	}
	text := decoded.text()
	if text == "" {
		return Filters{}, fmt.Errorf("DeepSeek returned no text")
	}
	return parseFilters(text, catalog)
}

type messageRequest struct {
	Model       string    `json:"model"`
	MaxTokens   int       `json:"max_tokens"`
	Temperature float64   `json:"temperature"`
	System      string    `json:"system"`
	Messages    []message `json:"messages"`
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type messageResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

func (r messageResponse) text() string {
	parts := make([]string, 0, len(r.Content))
	for _, block := range r.Content {
		if block.Type == "text" && strings.TrimSpace(block.Text) != "" {
			parts = append(parts, block.Text)
		}
	}
	return strings.Join(parts, "")
}

type filterCatalog struct {
	stalls    map[string]string
	allergens map[string]string
}

func newFilterCatalog(items []contracts.MenuItem) filterCatalog {
	catalog := filterCatalog{stalls: map[string]string{}, allergens: map[string]string{}}
	for _, item := range items {
		catalog.addStall(item.Stall)
		for _, allergen := range append(append([]string{}, item.Allergens.Contains...), append(item.Allergens.MayContain, item.Allergens.Unknown...)...) {
			catalog.addAllergen(allergen)
		}
	}
	return catalog
}

func (c filterCatalog) addStall(value string) {
	if value = strings.TrimSpace(value); value != "" {
		c.stalls[normalized(value)] = value
	}
}

func (c filterCatalog) addAllergen(value string) {
	if value = strings.TrimSpace(value); value != "" {
		c.allergens[normalized(value)] = value
	}
}

func (c filterCatalog) prompt() string {
	stalls := sortedValues(c.stalls)
	allergens := sortedValues(c.allergens)
	return "Return only JSON with keys keywords, excludedAllergens, preferredStall. " +
		"keywords is at most five meal-name words. excludedAllergens and preferredStall must use only the supplied values. " +
		"Do not infer dietary claims, ingredients, nutrition, allergens, meal IDs, or meal facts. " +
		"Stalls: " + strings.Join(stalls, ", ") + ". Allergens: " + strings.Join(allergens, ", ") + "."
}

func sortedValues(values map[string]string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		result = append(result, value)
	}
	sort.Strings(result)
	return result
}

func parseFilters(text string, catalog filterCatalog) (Filters, error) {
	var filters Filters
	decoder := json.NewDecoder(strings.NewReader(text))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&filters); err != nil {
		return Filters{}, fmt.Errorf("decode filters: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return Filters{}, fmt.Errorf("filters must be one JSON object")
	}
	return filters.validate(catalog)
}

func (f Filters) validate(catalog filterCatalog) (Filters, error) {
	if len(f.Keywords) > maxFilterValues || len(f.ExcludedAllergens) > maxFilterValues {
		return Filters{}, fmt.Errorf("too many filter values")
	}
	keywords, err := validateValues(f.Keywords, maxKeywordBytes, nil)
	if err != nil {
		return Filters{}, err
	}
	allergens, err := validateValues(f.ExcludedAllergens, maxKeywordBytes, catalog.allergens)
	if err != nil {
		return Filters{}, err
	}
	stall := strings.TrimSpace(f.PreferredStall)
	if stall != "" {
		var found bool
		if stall, found = catalog.stalls[normalized(stall)]; !found {
			return Filters{}, fmt.Errorf("unsupported stall filter")
		}
	}
	return Filters{Keywords: keywords, ExcludedAllergens: allergens, PreferredStall: stall}, nil
}

func validateValues(values []string, maxLength int, allowed map[string]string) ([]string, error) {
	result := make([]string, 0, len(values))
	seen := map[string]bool{}
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" || len(value) > maxLength {
			return nil, fmt.Errorf("invalid filter value")
		}
		key := normalized(value)
		if seen[key] {
			return nil, fmt.Errorf("duplicate filter value")
		}
		seen[key] = true
		if allowed != nil {
			var found bool
			if value, found = allowed[key]; !found {
				return nil, fmt.Errorf("unsupported allergen filter")
			}
		}
		result = append(result, value)
	}
	return result, nil
}

func filterMenuItems(items []contracts.MenuItem, filters Filters) []contracts.MenuItem {
	filtered := domain.FilterAllergens(items, filters.ExcludedAllergens)
	result := make([]contracts.MenuItem, 0, len(filtered))
	for _, item := range filtered {
		if filters.PreferredStall != "" && !strings.EqualFold(item.Stall, filters.PreferredStall) {
			continue
		}
		if !matchesKeywords(item, filters.Keywords) {
			continue
		}
		result = append(result, item)
	}
	return result
}

func matchesKeywords(item contracts.MenuItem, keywords []string) bool {
	haystack := normalized(item.Name + " " + item.Stall)
	for _, keyword := range keywords {
		if !strings.Contains(haystack, normalized(keyword)) {
			return false
		}
	}
	return true
}

func fallbackFilters(query string, items []contracts.MenuItem) Filters {
	filters := Filters{}
	for _, token := range strings.FieldsFunc(query, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsNumber(r) }) {
		if len(token) < 3 || len(filters.Keywords) == maxFilterValues || !queryTokenMatches(token, items) {
			continue
		}
		filters.Keywords = append(filters.Keywords, token)
	}
	return filters
}

func queryTokenMatches(token string, items []contracts.MenuItem) bool {
	for _, item := range items {
		if strings.Contains(normalized(item.Name+" "+item.Stall), normalized(token)) {
			return true
		}
	}
	return false
}

func normalized(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
