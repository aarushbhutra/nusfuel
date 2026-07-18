package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type AppConfig struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	MenuSeedDir string
}

func LoadAppConfig() (AppConfig, error) {
	config := AppConfig{
		DatabaseURL: strings.TrimSpace(os.Getenv("DATABASE_URL")),
		JWTSecret:   strings.TrimSpace(os.Getenv("JWT_SECRET")),
		Port:        strings.TrimSpace(os.Getenv("PORT")),
		MenuSeedDir: strings.TrimSpace(os.Getenv("MENU_SEED_DIR")),
	}
	if config.DatabaseURL == "" {
		return AppConfig{}, fmt.Errorf("DATABASE_URL is required")
	}
	if config.JWTSecret == "" {
		return AppConfig{}, fmt.Errorf("JWT_SECRET is required")
	}
	if config.Port == "" {
		config.Port = "8080"
	}
	if config.MenuSeedDir == "" {
		for _, candidate := range []string{"data/techno-edge", "../data/techno-edge"} {
			if info, err := os.Stat(filepath.Clean(candidate)); err == nil && info.IsDir() {
				config.MenuSeedDir = candidate
				break
			}
		}
	}
	if config.MenuSeedDir == "" {
		return AppConfig{}, fmt.Errorf("MENU_SEED_DIR could not be resolved")
	}
	return config, nil
}

func LoadOptionalDeepSeekConfig() DeepSeekConfig {
	return DeepSeekConfig{APIKey: strings.TrimSpace(os.Getenv("DEEPSEEK_API_KEY")), BaseURL: DeepSeekAnthropicBaseURL, Model: DeepSeekV4FlashModel}
}
