package main

import (
	"context"
	"log"
	"net/http"

	"github.com/aarushbhutra/nusfuel/backend/internal/ai"
	"github.com/aarushbhutra/nusfuel/backend/internal/auth"
	"github.com/aarushbhutra/nusfuel/backend/internal/config"
	"github.com/aarushbhutra/nusfuel/backend/internal/handlers"
	"github.com/aarushbhutra/nusfuel/backend/internal/seed"
	"github.com/aarushbhutra/nusfuel/backend/internal/store"
)

func main() {
	appConfig, err := config.LoadAppConfig()
	if err != nil {
		log.Fatal(err)
	}
	db, err := store.OpenPostgres(context.Background(), appConfig.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	menuItems, err := seed.LoadTechnoEdgeDir(appConfig.MenuSeedDir)
	if err != nil {
		log.Fatalf("load menu seed data: %v", err)
	}
	menuStore, err := store.NewSeedMenuStore(menuItems)
	if err != nil {
		log.Fatalf("create menu store: %v", err)
	}

	tokens, err := auth.NewTokenManager(appConfig.JWTSecret)
	if err != nil {
		log.Fatal(err)
	}
	goals := store.NewPostgresGoalStore(db)
	mealLogs := store.NewPostgresMealLogStore(db)
	users := store.NewPostgresUserStore(db)
	extractor := ai.NewDeepSeekExtractor(config.LoadOptionalDeepSeekConfig(), nil)
	api := handlers.NewAPIHandlerWithDeepSeek(goals, menuStore, extractor, mealLogs)
	handler := handlers.NewHTTPHandler(api, handlers.AuthHandler{Users: users, Tokens: tokens}, tokens, db.PingContext)
	log.Printf("NUSFuel API listening on :%s", appConfig.Port)
	log.Fatal(http.ListenAndServe(":"+appConfig.Port, handler))
}
