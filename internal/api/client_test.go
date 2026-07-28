package api

import (
	"context"
	"testing"
	"time"
)

// TestClientConfig validates that the client can be created with valid configuration
func TestClientConfig(t *testing.T) {
	cfg := ClientConfig{
		Endpoint:       "https://example.com/api",
		AuthToken:      "test-token",
		APIKey:         "test-key",
		GraphToken:     "test-graph",
		ConversationID: "test-conversation",
	}

	client := NewClient(cfg)
	if client == nil {
		t.Fatal("NewClient() returned nil")
	}

	if client.endpoint != cfg.Endpoint {
		t.Errorf("endpoint = %q, want %q", client.endpoint, cfg.Endpoint)
	}

	if client.authToken != cfg.AuthToken {
		t.Errorf("authToken = %q, want %q", client.authToken, cfg.AuthToken)
	}
}

// TestClientConfig_Defaults validates default values are set correctly
func TestClientConfig_Defaults(t *testing.T) {
	cfg := ClientConfig{
		Endpoint:  "https://example.com/api",
		AuthToken: "test-token",
		APIKey:    "test-key",
	}

	client := NewClient(cfg)
	if client == nil {
		t.Fatal("NewClient() returned nil")
	}

	// Check default UserAgent is set
	expectedUA := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
	if client.userAgent != expectedUA {
		t.Errorf("userAgent = %q, want %q", client.userAgent, expectedUA)
	}

	// Check default Referer is set
	expectedReferer := "https://ncsgpt.ncs.com.sg/"
	if client.referer != expectedReferer {
		t.Errorf("referer = %q, want %q", client.referer, expectedReferer)
	}
}

// TestClient_SendRequest_InvalidURL validates error handling for invalid endpoint
func TestClient_SendRequest_InvalidURL(t *testing.T) {
	cfg := ClientConfig{
		Endpoint:       "://invalid-url",
		AuthToken:      "test-token",
		APIKey:         "test-key",
		ConversationID: "test-conversation",
	}

	client := NewClient(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.SendRequest(ctx, "test message", "test-session")
	if err == nil {
		t.Error("SendRequest() expected error for invalid URL, got nil")
	}
}
