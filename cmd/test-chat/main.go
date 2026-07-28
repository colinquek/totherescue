package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/totherescue/internal/api"
	"github.com/totherescue/internal/config"
)

func main() {
	fmt.Println("MailSage API Client")
	fmt.Print("=========================\n")

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading config: %v\n", err)
		os.Exit(1)
	}

	if err := cfg.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "Validation error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Configuration loaded from .env.local:")
	fmt.Printf("   AUTH_TOKEN: %s...\n", truncate(cfg.AuthToken, 50))
	fmt.Printf("   API_KEY: %s...\n", truncate(cfg.APIKey, 50))
	fmt.Printf("   Conversation ID: %s\n\n", cfg.ConversationID)

	client := api.NewClient(api.ClientConfig{
		Endpoint:       cfg.APIEndpoint,
		AuthToken:      cfg.AuthToken,
		APIKey:         cfg.APIKey,
		GraphToken:     cfg.GraphToken,
		ConversationID: cfg.ConversationID,
	})

	fmt.Print("Sending test message to SomeGPT API...\n")
	fmt.Printf("Endpoint: %s\n", cfg.APIEndpoint)
	fmt.Printf("Message: \"Hello! This is a test message from the API client.\"\n\n")

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	startTime := time.Now()
	resp, err := client.SendRequest(ctx, "Hello! This is a test message from the API client.", "test-session")
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR\n")
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	_ = startTime // duration tracking available if needed

	if resp.Success {
		fmt.Print("SUCCESS!\n")
		fmt.Println("Response:")
		fmt.Println("─" + repeat("─", 79))

		if len(resp.Body) > 0 {
			fmt.Println(resp.Body)
		}

		fmt.Println("─" + repeat("─", 79))
		fmt.Printf("\nDuration: %dms\n", resp.ResponseTimeMs)
		fmt.Printf("Response size: %d bytes\n", len(resp.Body))
		fmt.Printf("Estimated tokens: %d\n", resp.Tokens)
	} else {
		fmt.Print("FAILED\n")
		fmt.Printf("Status: %d\n", resp.StatusCode)
		fmt.Printf("Response: %s\n", truncate(resp.Error, 500))

		if resp.TokenExpired {
			fmt.Println("\nToken expired! Get fresh tokens:")
			fmt.Print("   Run: go run cmd/extract-tokens/main.go\n")
			os.Exit(1)
		}
	}

	fmt.Println("\n\nNext Steps:")
	fmt.Println("   - If successful, you can now use this for load testing")
	fmt.Print("   - Run: go run cmd/run-queries/main.go\n")
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

func repeat(s string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += s
	}
	return result
}
