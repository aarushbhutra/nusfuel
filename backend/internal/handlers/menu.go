package handlers

import (
	"context"
	"net/url"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type MenuStore interface {
	List(context.Context) ([]contracts.MenuItem, error)
	Get(context.Context, string) (contracts.MenuItem, bool, error)
}

type MenuHandler struct {
	Store MenuStore
}

func (h MenuHandler) Handle(ctx context.Context, request Request) (Response, error) {
	if strings.TrimSpace(request.RequestContext.Authorizer.JWT.Claims["sub"]) == "" {
		return response(401, map[string]string{"error": "unauthorized"})
	}
	if strings.ToUpper(request.RequestContext.HTTP.Method) != "GET" {
		result, err := response(405, map[string]string{"error": "method not allowed"})
		result.Headers["allow"] = "GET"
		return result, err
	}

	itemID, isMenuPath := menuItemPath(request.RawPath)
	if !isMenuPath {
		return response(404, map[string]string{"error": "not found"})
	}
	if itemID == "" {
		items, err := h.Store.List(ctx)
		if err != nil {
			return response(500, map[string]string{"error": "internal server error"})
		}
		if items == nil {
			items = []contracts.MenuItem{}
		}
		return response(200, items)
	}

	item, found, err := h.Store.Get(ctx, itemID)
	if err != nil {
		return response(500, map[string]string{"error": "internal server error"})
	}
	if !found {
		return response(404, map[string]string{"error": "menu item not found"})
	}
	return response(200, item)
}

func menuItemPath(rawPath string) (string, bool) {
	if rawPath == "/menu" {
		return "", true
	}
	if !strings.HasPrefix(rawPath, "/menu/") {
		return "", false
	}

	rawID := strings.TrimPrefix(rawPath, "/menu/")
	if rawID == "" || strings.Contains(rawID, "/") {
		return "", false
	}
	itemID, err := url.PathUnescape(rawID)
	if err != nil || strings.TrimSpace(itemID) == "" || strings.Contains(itemID, "/") {
		return "", false
	}
	return itemID, true
}
