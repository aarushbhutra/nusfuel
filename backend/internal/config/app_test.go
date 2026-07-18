package config

import (
	"testing"
)

func TestLoadAppConfigUsesRailwayVariables(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://example")
	t.Setenv("JWT_SECRET", "12345678901234567890123456789012")
	t.Setenv("PORT", "9090")
	t.Setenv("MENU_SEED_DIR", "fixtures/menu")
	config, err := LoadAppConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.Port != "9090" || config.MenuSeedDir != "fixtures/menu" {
		t.Fatalf("config = %+v", config)
	}
}
