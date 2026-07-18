package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/config"
	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/logging"
)

func TestDeepSeekExtractorAppliesOnlyValidatedFiltersToStoredMeals(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/anthropic/v1/messages" {
			t.Fatalf("request = %s %s, want POST /anthropic/v1/messages", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("x-api-key"); got != "test-key" {
			t.Fatalf("x-api-key = %q, want test-key", got)
		}

		var request struct {
			Model     string `json:"model"`
			MaxTokens int    `json:"max_tokens"`
			Messages  []struct {
				Content string `json:"content"`
			} `json:"messages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.Model != config.DeepSeekV4FlashModel || request.MaxTokens != 256 || len(request.Messages) != 1 || request.Messages[0].Content != "chicken without peanuts at Western" {
			t.Fatalf("request = %+v, want DeepSeek V4 Flash extraction request", request)
		}

		_ = json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]string{{
				"type": "text",
				"text": `{"keywords":["chicken"],"excludedAllergens":["Peanuts"],"preferredStall":"Western"}`,
			}},
		})
	}))
	defer server.Close()

	items := []contracts.MenuItem{
		{ID: "safe", Name: "Grilled Chicken", Stall: "Western"},
		{ID: "peanut", Name: "Chicken Rice", Stall: "Western", Allergens: contracts.Allergens{Contains: []string{"Peanuts"}}},
		{ID: "other-stall", Name: "Chicken Soup", Stall: "Asian Delights"},
	}
	extractor := NewDeepSeekExtractor(config.DeepSeekConfig{
		APIKey:  "test-key",
		BaseURL: server.URL + "/anthropic",
		Model:   config.DeepSeekV4FlashModel,
	}, server.Client())

	result := extractor.Search(context.Background(), "chicken without peanuts at Western", items)

	if result.UsedFallback {
		t.Fatal("valid DeepSeek output must not use the fallback")
	}
	if len(result.Items) != 1 || result.Items[0].ID != "safe" {
		t.Fatalf("items = %+v, want only the stored safe Western chicken meal", result.Items)
	}
}

func TestDeepSeekExtractorFallsBackWhenModelReturnsUnsupportedFilters(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"content": []map[string]string{{
				"type": "text",
				"text": `{"preferredStall":"Not A Stored Stall"}`,
			}},
		})
	}))
	defer server.Close()

	items := []contracts.MenuItem{{ID: "chicken", Name: "Chicken Rice", Stall: "Western"}}
	extractor := NewDeepSeekExtractor(config.DeepSeekConfig{
		APIKey:  "test-key",
		BaseURL: server.URL,
		Model:   config.DeepSeekV4FlashModel,
	}, server.Client())

	result := extractor.Search(context.Background(), "chicken", items)

	if !result.UsedFallback {
		t.Fatal("unsupported model output must use deterministic fallback")
	}
	if len(result.Items) != 1 || result.Items[0].ID != "chicken" {
		t.Fatalf("items = %+v, want only stored deterministic fallback results", result.Items)
	}
}

func TestDeepSeekExtractorLogsDeterministicFallback(t *testing.T) {
	previousLogger := slog.Default()
	var logs bytes.Buffer
	slog.SetDefault(slog.New(slog.NewJSONHandler(&logs, nil)))
	t.Cleanup(func() { slog.SetDefault(previousLogger) })

	result := NewDeepSeekExtractor(config.DeepSeekConfig{}, nil).Search(
		logging.WithRequest(context.Background(), "request-456", "/search"),
		"chicken",
		[]contracts.MenuItem{{ID: "chicken", Name: "Chicken Rice", Stall: "Western"}},
	)

	if !result.UsedFallback || !strings.Contains(logs.String(), `"request_id":"request-456"`) || !strings.Contains(logs.String(), `"route":"/search"`) || !strings.Contains(logs.String(), `"msg":"DeepSeek extraction failed; using deterministic search fallback"`) {
		t.Fatalf("fallback logs = %s", logs.String())
	}
}
