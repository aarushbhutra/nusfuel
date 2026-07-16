package handlers

import (
	"context"
	"net/url"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/ai"
	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type NaturalLanguageSearchResponse struct {
	Items        []contracts.MenuItem `json:"items"`
	UsedFallback bool                 `json:"usedFallback"`
}

type NaturalLanguageSearchHandler struct {
	Menu      MenuStore
	Extractor ai.DeepSeekExtractor
}

func (h NaturalLanguageSearchHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if request.RawPath != "/search" {
		return response(404, map[string]string{"error": "not found"})
	}
	if authenticatedUserID(request) == "" {
		return response(401, map[string]string{"error": "unauthorized"})
	}
	if strings.ToUpper(request.RequestContext.HTTP.Method) != "GET" {
		result, err := response(405, map[string]string{"error": "method not allowed"})
		result.Headers["allow"] = "GET"
		return result, err
	}
	values, err := url.ParseQuery(request.RawQueryString)
	if err != nil {
		return response(400, map[string]string{"error": "invalid search query"})
	}
	query := strings.TrimSpace(values.Get("query"))
	if query == "" {
		return response(400, map[string]string{"error": "query is required"})
	}
	items, err := h.Menu.List(ctx)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	result := h.Extractor.Search(ctx, query, items)
	return response(200, NaturalLanguageSearchResponse{Items: result.Items, UsedFallback: result.UsedFallback})
}

func NewAPIHandlerWithDeepSeek(goals GoalStore, menu MenuStore, extractor ai.DeepSeekExtractor, mealLogStores ...MealLogStore) APIHandler {
	api := NewAPIHandler(goals, menu, mealLogStores...)
	api.Search = &NaturalLanguageSearchHandler{Menu: menu, Extractor: extractor}
	return api
}
