package config

import (
	"fmt"
	"os"
	"strings"
)

const (
	DeepSeekAnthropicBaseURL = "https://api.deepseek.com/anthropic"
	DeepSeekV4FlashModel     = "deepseek-v4-flash"
)

type DeepSeekConfig struct {
	APIKey  string
	BaseURL string
	Model   string
}

func LoadDeepSeekConfig() (DeepSeekConfig, error) {
	apiKey := strings.TrimSpace(os.Getenv("DEEPSEEK_API_KEY"))
	if apiKey == "" {
		return DeepSeekConfig{}, fmt.Errorf("DEEPSEEK_API_KEY is required")
	}

	return DeepSeekConfig{
		APIKey:  apiKey,
		BaseURL: DeepSeekAnthropicBaseURL,
		Model:   DeepSeekV4FlashModel,
	}, nil
}
