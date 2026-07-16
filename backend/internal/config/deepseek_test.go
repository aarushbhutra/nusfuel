package config

import "testing"

func TestLoadDeepSeekConfigUsesAnthropicCompatibleV4Flash(t *testing.T) {
	t.Setenv("DEEPSEEK_API_KEY", "test-key")

	config, err := LoadDeepSeekConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.APIKey != "test-key" {
		t.Fatalf("API key = %q, want test key", config.APIKey)
	}
	if config.BaseURL != DeepSeekAnthropicBaseURL {
		t.Fatalf("base URL = %q, want %q", config.BaseURL, DeepSeekAnthropicBaseURL)
	}
	if config.Model != DeepSeekV4FlashModel {
		t.Fatalf("model = %q, want %q", config.Model, DeepSeekV4FlashModel)
	}
}

func TestLoadDeepSeekConfigRejectsMissingKey(t *testing.T) {
	t.Setenv("DEEPSEEK_API_KEY", "")

	if _, err := LoadDeepSeekConfig(); err == nil {
		t.Fatal("expected missing API key error")
	}
}
