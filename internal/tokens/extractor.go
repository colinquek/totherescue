package tokens

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

type ExtractedTokens struct {
	Authorization string
	XAPIKey       string
	APIEndpoint   string
	Timestamp     string
}

type Extractor struct {
	browserURL string
}

func NewExtractor() *Extractor {
	return &Extractor{
		browserURL: "https://ncsgpt.ncs.com.sg/",
	}
}

func (e *Extractor) Extract() (*ExtractedTokens, error) {
	l := launcher.New().Headless(false)

	url, err := l.Launch()
	if err != nil {
		return nil, fmt.Errorf("failed to launch browser: %w", err)
	}
	defer l.Cleanup()

	browser := rod.New().ControlURL(url).MustConnect()
	defer browser.Close()

	page, err := browser.Page(proto.TargetCreateTarget{})
	if err != nil {
		return nil, fmt.Errorf("failed to create page: %w", err)
	}

	var (
		mu              sync.Mutex
		extractedTokens *ExtractedTokens
		tokenFound      = make(chan struct{}, 1)
	)

	// Set up request hijacking
	router := page.HijackRequests()
	router.MustAdd("*/*", func(h *rod.Hijack) {
		req := h.Request
		u := req.URL().String()

		if strings.Contains(u, "/orchestrator/sk-chat/stream") && req.Method() == "POST" {
			authHeader := req.Header("authorization")
			apiKeyHeader := req.Header("x-api-key")

			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				mu.Lock()
				extractedTokens = &ExtractedTokens{
					Authorization: strings.TrimPrefix(authHeader, "Bearer "),
					XAPIKey:       "",
					Timestamp:     time.Now().UTC().Format(time.RFC3339),
				}

				if apiKeyHeader != "" && strings.HasPrefix(apiKeyHeader, "Bearer ") {
					extractedTokens.XAPIKey = strings.TrimPrefix(apiKeyHeader, "Bearer ")
				}
				mu.Unlock()

				fmt.Println("Found chat API request!")
				fmt.Println("   ✓ Authorization token captured")
				select {
				case tokenFound <- struct{}{}:
				default:
				}
			}
		}

		h.ContinueRequest(&proto.FetchContinueRequest{})
	})

	go router.Run()
	defer router.Stop()

	fmt.Println("Opening NCSGPT...")
	page = page.Timeout(5 * time.Minute)
	if err := page.Navigate(e.browserURL); err != nil {
		return nil, fmt.Errorf("failed to navigate: %w", err)
	}

	fmt.Println("\nNext Steps:")
	fmt.Println("   1. If not already logged in, login to SomeGPT")
	fmt.Println("   2. Navigate to any conversation")
	fmt.Println("   3. Send a message (e.g., \"test\")")
	fmt.Print("   4. I'll automatically capture the tokens...\n")

	maxWaitTime := 5 * time.Minute

	select {
	case <-tokenFound:
		// Tokens captured
	case <-time.After(maxWaitTime):
		return nil, fmt.Errorf("no tokens captured after 5 minutes")
	}

	mu.Lock()
	tokens := extractedTokens
	mu.Unlock()

	if tokens == nil {
		return nil, fmt.Errorf("no tokens captured after 5 minutes")
	}

	fmt.Print("\nTokens captured successfully!\n")
	fmt.Printf("   Authorization: %s...\n", truncate(tokens.Authorization, 50))
	fmt.Printf("   X-API-Key: %s...\n", truncate(tokens.XAPIKey, 50))
	fmt.Printf("   Timestamp: %s\n\n", tokens.Timestamp)

	return tokens, nil
}

func (e *Extractor) SaveToFile(tokens *ExtractedTokens, envPath string) error {
	envContent := fmt.Sprintf(`# SomeGPT API Tokens (Auto-extracted)
# Extracted: %s
# These tokens expire after ~1 hour

AUTH_TOKEN=%s
API_KEY=%s
# CONVERSATION_ID=leave blank to auto-generate, or paste your own
PAUSE_MINUTES=1
CONCURRENT_SESSIONS=1
DURATION_MINUTES=0
`, tokens.Timestamp, tokens.Authorization, tokens.XAPIKey)

	dir := filepath.Dir(envPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if err := os.WriteFile(envPath, []byte(envContent), 0600); err != nil {
		return fmt.Errorf("failed to write .env.local: %w", err)
	}

	fmt.Printf("Tokens saved to: %s\n", envPath)
	return nil
}

func (e *Extractor) GetEnvPath() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", err
	}

	scriptDir := filepath.Dir(execPath)
	envPath := filepath.Join(scriptDir, ".env.local")

	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		envPath = filepath.Join(scriptDir, "..", ".env.local")
	}

	return envPath, nil
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

type ExtractOptions struct {
	Headless   bool
	MaxWait    time.Duration
	BrowserURL string
}

func (e *Extractor) ExtractWithOptions(opts ExtractOptions) (*ExtractedTokens, error) {
	l := launcher.New().Headless(opts.Headless)

	url, err := l.Launch()
	if err != nil {
		return nil, fmt.Errorf("failed to launch browser: %w", err)
	}
	defer l.Cleanup()

	browser := rod.New().ControlURL(url).MustConnect()
	defer browser.Close()

	page, err := browser.Page(proto.TargetCreateTarget{})
	if err != nil {
		return nil, fmt.Errorf("failed to create page: %w", err)
	}

	var (
		mu              sync.Mutex
		extractedTokens *ExtractedTokens
		tokenFound      = make(chan struct{}, 1)
		maxWait         = opts.MaxWait
	)

	if maxWait == 0 {
		maxWait = 5 * time.Minute
	}

	browserURL := opts.BrowserURL
	if browserURL == "" {
		browserURL = "https://ncsgpt.ncs.com.sg/"
	}

	router := page.HijackRequests()
	router.MustAdd("*/*", func(h *rod.Hijack) {
		req := h.Request
		u := req.URL().String()

		if strings.Contains(u, "/orchestrator/sk-chat/stream") && req.Method() == "POST" {
			authHeader := req.Header("authorization")
			apiKeyHeader := req.Header("x-api-key")

			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				mu.Lock()
				extractedTokens = &ExtractedTokens{
					Authorization: strings.TrimPrefix(authHeader, "Bearer "),
					XAPIKey:       "",
					APIEndpoint:   "",
					Timestamp:     time.Now().UTC().Format(time.RFC3339),
				}

				if apiKeyHeader != "" && strings.HasPrefix(apiKeyHeader, "Bearer ") {
					extractedTokens.XAPIKey = strings.TrimPrefix(apiKeyHeader, "Bearer ")
				}
				mu.Unlock()

				fmt.Println("Found chat API request!")
				fmt.Println("   ✓ Authorization token captured")
				select {
				case tokenFound <- struct{}{}:
				default:
				}
			}
		}

		h.ContinueRequest(&proto.FetchContinueRequest{})
	})

	go router.Run()
	defer router.Stop()

	fmt.Println("Opening NCSGPT...")
	page = page.Timeout(maxWait)
	if err := page.Navigate(browserURL); err != nil {
		return nil, fmt.Errorf("failed to navigate: %w", err)
	}

	fmt.Println("\nNext Steps:")
	fmt.Println("   1. If not already logged in, login to SomeGPT")
	fmt.Println("   2. Navigate to any conversation")
	fmt.Println("   3. Send a message (e.g., \"test\")")
	fmt.Print("   4. I'll automatically capture the tokens...\n")

	select {
	case <-tokenFound:
		// Tokens captured
	case <-time.After(maxWait):
		return nil, fmt.Errorf("no tokens captured after %v", maxWait)
	}

	mu.Lock()
	tokens := extractedTokens
	mu.Unlock()

	if tokens == nil {
		return nil, fmt.Errorf("no tokens captured after %v", maxWait)
	}

	fmt.Print("\nTokens captured successfully!\n")
	fmt.Printf("   Authorization: %s...\n", truncate(tokens.Authorization, 50))
	fmt.Printf("   X-API-Key: %s...\n", truncate(tokens.XAPIKey, 50))
	fmt.Printf("   Timestamp: %s\n\n", tokens.Timestamp)

	return tokens, nil
}
