package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/aarushbhutra/nusfuel/backend/internal/ai"
	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/aarushbhutra/nusfuel/backend/internal/config"
	"github.com/aarushbhutra/nusfuel/backend/internal/handlers"
	"github.com/aarushbhutra/nusfuel/backend/internal/logging"
	"github.com/aarushbhutra/nusfuel/backend/internal/seed"
	"github.com/aarushbhutra/nusfuel/backend/internal/store"
)

func main() {
	logging.Configure()
	appConfig, err := config.LoadAppConfig()
	if err != nil {
		fatal("configuration", err)
	}
	db, err := store.OpenPostgres(context.Background(), appConfig.DatabaseURL)
	if err != nil {
		fatal("postgres", err)
	}
	defer db.Close()
	menuItems, err := seed.LoadTechnoEdgeDir(appConfig.MenuSeedDir)
	if err != nil {
		fatal("menu seed", err)
	}
	menuStore, err := store.NewSeedMenuStore(menuItems)
	if err != nil {
		fatal("menu store", err)
	}

	tokens, err := auth.NewTokenManager(appConfig.JWTSecret)
	if err != nil {
		fatal("authentication", err)
	}
	goals := store.NewPostgresGoalStore(db)
	mealLogs := store.NewPostgresMealLogStore(db)
	users := store.NewPostgresUserStore(db)
	extractor := ai.NewDeepSeekExtractor(config.LoadOptionalDeepSeekConfig(), nil)
	api := handlers.NewAPIHandlerWithDeepSeek(goals, menuStore, extractor, mealLogs)
	handler := handlers.NewHTTPHandler(api, handlers.AuthHandler{Users: users, Tokens: tokens}, tokens, db.PingContext)
	slog.Info("NUSFuel API listening", "port", appConfig.Port)
	if err := http.ListenAndServe(":"+appConfig.Port, handler); err != nil {
		fatal("http server", err)
	}
}

func fatal(component string, err error) {
	slog.Error("NUSFuel API stopped", "component", component, "error", err)
	os.Exit(1)
}
