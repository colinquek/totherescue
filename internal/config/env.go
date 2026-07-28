package config

import (
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AuthToken          string
	APIKey             string
	GraphToken         string
	ConversationID     string
	PauseMinutes       int
	ConcurrentSessions int
	DurationMinutes    int
	APIEndpoint        string
}

const defaultAPIEndpoint = "https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/msagents/api/v1/email-intelligence"

func Load() (*Config, error) {
	scriptDir, err := os.Executable()
	if err != nil {
		return nil, err
	}
	scriptDir = filepath.Dir(scriptDir)

	envPath := filepath.Join(scriptDir, ".env.local")
	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		envPath = filepath.Join(scriptDir, "..", ".env.local")
	}

	if _, err := os.Stat(envPath); err == nil {
		if err := godotenv.Load(envPath); err != nil {
			return nil, err
		}
	}

	authToken := os.Getenv("AUTH_TOKEN")
	apiKey := os.Getenv("API_KEY")
	graphToken := os.Getenv("GRAPH_TOKEN")
	conversationID := os.Getenv("CONVERSATION_ID")

	pauseMinutes := 1
	if pm := os.Getenv("PAUSE_MINUTES"); pm != "" {
		if val, err := strconv.Atoi(pm); err == nil {
			pauseMinutes = val
		}
	}

	concurrentSessions := 1
	if cs := os.Getenv("CONCURRENT_SESSIONS"); cs != "" {
		if val, err := strconv.Atoi(cs); err == nil {
			concurrentSessions = val
		}
	}

	durationMinutes := 0
	if dm := os.Getenv("DURATION_MINUTES"); dm != "" {
		if val, err := strconv.Atoi(dm); err == nil {
			durationMinutes = val
		}
	}

	apiEndpoint := os.Getenv("API_ENDPOINT")
	if apiEndpoint == "" {
		apiEndpoint = defaultAPIEndpoint
	}

	return &Config{
		AuthToken:          authToken,
		APIKey:             apiKey,
		GraphToken:         graphToken,
		ConversationID:     conversationID,
		PauseMinutes:       pauseMinutes,
		ConcurrentSessions: concurrentSessions,
		DurationMinutes:    durationMinutes,
		APIEndpoint:        apiEndpoint,
	}, nil
}

func (c *Config) Validate() error {
	if c.AuthToken == "" {
		return &ValidationError{Field: "AUTH_TOKEN", Message: "not found. Please run: extract-tokens"}
	}
	if c.APIKey == "" {
		return &ValidationError{Field: "API_KEY", Message: "not found. Please run: extract-tokens"}
	}
	return nil
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + " " + e.Message
}
