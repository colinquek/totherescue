package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/totherescue/internal/api"
	"github.com/totherescue/internal/config"
	"github.com/totherescue/internal/questions"
)

type TestMetrics struct {
	SessionID          string   `json:"sessionId"`
	StartTime          int64    `json:"startTime"`
	EndTime            int64    `json:"endTime"`
	TotalRequests      int      `json:"totalRequests"`
	SuccessfulRequests int      `json:"successfulRequests"`
	FailedRequests     int      `json:"failedRequests"`
	AvgResponseTime    float64  `json:"avgResponseTime"`
	TotalTokens        int      `json:"totalTokens"`
	Errors             []string `json:"errors"`
	Responses          []string `json:"responses"`
}

type LoadTestResults struct {
	StartTime     string        `json:"startTime"`
	EndTime       string        `json:"endTime"`
	TotalSessions int           `json:"totalSessions"`
	Metrics       []TestMetrics `json:"metrics"`
	Summary       struct {
		TotalRequests   int     `json:"totalRequests"`
		SuccessRate     float64 `json:"successRate"`
		AvgResponseTime float64 `json:"avgResponseTime"`
		TotalTokens     int     `json:"totalTokens"`
	} `json:"summary"`
}

const systemPrompt = `IMPORTANT INSTRUCTIONS:

1. Carefully analyze and consider this question before responding
2. Work through the problem step-by-step in your reasoning
3. Internally verify your answer for accuracy
4. DO NOT verbalize your thought process or reasoning steps
5. Respond ONLY with your final answer, clearly formatted
6. Show essential calculations but keep the response concise
7. Ensure your answer is complete and directly addresses the question

Remember: Think deeply, verify thoroughly, but present only your final answer.`

func main() {
	fmt.Println("MailSage Email Query")
	fmt.Print("===================\n")

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading config: %v\n", err)
		os.Exit(1)
	}

	if err := cfg.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "Validation error: %v\n", err)
		os.Exit(1)
	}

	if cfg.ConversationID == "" {
		cfg.ConversationID = generateUUID()
		fmt.Printf("Generated new Conversation ID: %s\n\n", cfg.ConversationID)
	}

	fmt.Println("Configuration:")
	fmt.Printf("   API Endpoint: %s\n", cfg.APIEndpoint)
	fmt.Printf("   Conversation ID: %s\n", cfg.ConversationID)
	fmt.Printf("   Pause between questions: %d minute(s)\n", cfg.PauseMinutes)
	fmt.Printf("   Execution mode: Sequential (one question at a time)\n")
	fmt.Printf("   Duration: %s\n\n", formatDuration(cfg.DurationMinutes))

	resultsDir := "results"
	if err := os.MkdirAll(resultsDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating results directory: %v\n", err)
		os.Exit(1)
	}

	startTime := time.Now()
	fmt.Printf("Start time: %s\n\n", startTime.Format(time.RFC3339))

	// Get the directory where the binary is located
	execPath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting executable path: %v\n", err)
		os.Exit(1)
	}
	baseDir := filepath.Dir(execPath)
	// If running from bin/, go up one level
	if filepath.Base(baseDir) == "bin" {
		baseDir = filepath.Dir(baseDir)
	}

	loader := questions.NewLoader(baseDir)
	questions, err := loader.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading questions: %v\n", err)
		os.Exit(1)
	}

	stopSignal := false
	sessionID := "sequential-session"

	fmt.Print("Running questions sequentially...\n")

	metrics := runSession(cfg, questions, sessionID, &stopSignal)

	endTime := time.Now()
	fmt.Printf("End time: %s\n\n", endTime.Format(time.RFC3339))

	results := LoadTestResults{
		StartTime:     startTime.Format(time.RFC3339),
		EndTime:       endTime.Format(time.RFC3339),
		TotalSessions: 1,
		Metrics:       []TestMetrics{metrics},
	}
	results.Summary.TotalRequests = metrics.TotalRequests
	results.Summary.SuccessRate = float64(metrics.SuccessfulRequests) / float64(metrics.TotalRequests) * 100
	results.Summary.AvgResponseTime = metrics.AvgResponseTime
	results.Summary.TotalTokens = metrics.TotalTokens

	timestamp := startTime.Format("2006-01-02T15-04-05-000Z")
	resultsFile := filepath.Join(resultsDir, fmt.Sprintf("run-queries-%s.json", timestamp))

	resultsJSON, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling results: %v\n", err)
		os.Exit(1)
	}

	if err := os.WriteFile(resultsFile, resultsJSON, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "Error saving results: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\nSequential Test Summary")
	fmt.Println("=========================")
	fmt.Printf("Questions Completed: %d/%d\n", metrics.TotalRequests, len(questions))
	fmt.Printf("Successful: %d (%.2f%%)\n", metrics.SuccessfulRequests, results.Summary.SuccessRate)
	fmt.Printf("Failed: %d\n", metrics.FailedRequests)
	fmt.Printf("Avg Response Time: %.2fms\n", metrics.AvgResponseTime)
	fmt.Printf("Total Tokens Generated: %d\n", metrics.TotalTokens)
	fmt.Printf("Total Duration: %.2f minutes\n", endTime.Sub(startTime).Minutes())
	if metrics.TotalRequests > 0 {
		fmt.Printf("Avg Time per Question: %.2f seconds\n", endTime.Sub(startTime).Seconds()/float64(metrics.TotalRequests))
	}
	fmt.Printf("\nResults saved to: %s\n\n", resultsFile)

	if len(metrics.Errors) > 0 {
		fmt.Println("Errors encountered:")
		for i, err := range metrics.Errors {
			fmt.Printf("   %d. %s\n", i+1, err)
		}
		fmt.Println()
	}

	fmt.Print("Load test complete!\n")
	fmt.Println("To run again with fresh tokens:")
	fmt.Println("   go run cmd/extract-tokens/main.go  # Get fresh tokens")
	fmt.Print("   go run cmd/run-queries/main.go       # Run load test\n")
}

func runSession(cfg *config.Config, questions []string, sessionID string, stopSignal *bool) TestMetrics {
	metrics := TestMetrics{
		SessionID: sessionID,
		StartTime: time.Now().UnixMilli(),
		Errors:    make([]string, 0),
		Responses: make([]string, 0),
	}

	responseTimes := make([]float64, 0)

	client := api.NewClient(api.ClientConfig{
		Endpoint:       cfg.APIEndpoint,
		AuthToken:      cfg.AuthToken,
		APIKey:         cfg.APIKey,
		GraphToken:     cfg.GraphToken,
		ConversationID: cfg.ConversationID,
	})

	fmt.Printf("\nSequential Test Session Started\n")
	fmt.Printf("   Total questions: %d\n", len(questions))
	fmt.Printf("   Pause between questions: %d minutes\n", cfg.PauseMinutes)
	fmt.Printf("   Duration: %s\n\n", formatDuration(cfg.DurationMinutes))

	for i, question := range questions {
		if *stopSignal {
			break
		}

		fmt.Printf("\nRequest %d:\n", i+1)
		fmt.Printf("   %s\n", truncate(question, 100))
		fmt.Printf("\n   Sending request...\n")

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		result, err := client.SendRequest(ctx, question, sessionID)
		cancel()

		if err != nil {
			metrics.TotalRequests++
			metrics.FailedRequests++
			metrics.Errors = append(metrics.Errors, err.Error())
			fmt.Printf("   [FAIL] Error: %v\n", err)
			continue
		}

		metrics.TotalRequests++

		if result.Success {
			metrics.SuccessfulRequests++
			metrics.TotalTokens += result.Tokens
			metrics.Responses = append(metrics.Responses, result.Body)
		} else {
			metrics.FailedRequests++
			metrics.Errors = append(metrics.Errors, result.Error)

			if result.TokenExpired {
				fmt.Print("\n[!] Token expired! Re-extracting tokens...\n")

				if err := reextractTokens(); err != nil {
					fmt.Println("Failed to re-extract tokens:", err)
					fmt.Print("\nExiting due to token expiry and failed re-extraction.\n")
					os.Exit(1)
				}

				cfg2, err := config.Load()
				if err != nil {
					fmt.Println("Failed to reload config:", err)
					os.Exit(1)
				}

				client = api.NewClient(api.ClientConfig{
					Endpoint:       cfg2.APIEndpoint,
					AuthToken:      cfg2.AuthToken,
					APIKey:         cfg2.APIKey,
					GraphToken:     cfg2.GraphToken,
					ConversationID: cfg2.ConversationID,
				})

				fmt.Print("\nTokens refreshed. Retrying request...\n")

				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
				retryResult, err := client.SendRequest(ctx, question, sessionID)
				cancel()

				if err != nil {
					metrics.Errors = append(metrics.Errors, err.Error())
					fmt.Printf("   [FAIL] Retry error: %v\n", err)
					continue
				}

				if retryResult.Success {
					metrics.SuccessfulRequests++
					metrics.TotalTokens += retryResult.Tokens
					metrics.Responses = append(metrics.Responses, retryResult.Body)
					result = retryResult
				} else {
					metrics.Errors = append(metrics.Errors, retryResult.Error)
					fmt.Printf("   [FAIL] Retry failed: %s\n", retryResult.Error)
					continue
				}
			} else {
				fmt.Printf("\n[!] Unhandled failure: %s\n", result.Error)
				fmt.Print("\nExiting due to request failure.\n")
				os.Exit(1)
			}
		}

		responseTimes = append(responseTimes, float64(result.ResponseTimeMs))
		sum := 0.0
		for _, rt := range responseTimes {
			sum += rt
		}
		metrics.AvgResponseTime = sum / float64(len(responseTimes))

		status := "[OK]"
		if !result.Success {
			status = "[FAIL]"
		}
		fmt.Printf("   %s %dms", status, result.ResponseTimeMs)
		if result.Tokens > 0 {
			fmt.Printf(" | %d tokens", result.Tokens)
		}
		fmt.Println()

		if result.Error != "" && !result.TokenExpired {
			fmt.Printf("   Error: %s\n", result.Error)
		}

		if result.Body != "" && !strings.Contains(result.Body, "-=COMPLETED=-") {
			fmt.Printf("\n   Response:\n")
			lines := strings.Split(result.Body, "\n")
			for j := 0; j < len(lines) && j < 50; j++ {
				fmt.Printf("      %s\n", lines[j])
			}
			if len(lines) > 50 {
				fmt.Println("      ... (response truncated)")
			}
			fmt.Println()
		} else if strings.Contains(result.Body, "-=COMPLETED=-") {
			fmt.Print("   -=COMPLETED=- detected\n")
		}

		if i < len(questions)-1 && !*stopSignal {
			pauseMs := time.Duration(cfg.PauseMinutes) * time.Minute
			fmt.Printf("\nPausing for %d minutes...\n", cfg.PauseMinutes)
			fmt.Printf("   Next request at: %s\n\n", time.Now().Add(pauseMs).Format(time.Kitchen))

			time.Sleep(pauseMs)
		}
	}

	metrics.EndTime = time.Now().UnixMilli()
	durationMinutes := float64(metrics.EndTime-metrics.StartTime) / 60000.0
	fmt.Printf("\nSequential test completed: %d/%d successful\n", metrics.SuccessfulRequests, metrics.TotalRequests)
	fmt.Printf("   Total duration: %.2f minutes\n\n", durationMinutes)

	return metrics
}

func reextractTokens() error {
	cmd := exec.Command("go", "run", "cmd/extract-tokens/main.go")
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%s-%s-%s-%s-%s",
		hex.EncodeToString(b[0:4]),
		hex.EncodeToString(b[4:6]),
		hex.EncodeToString(b[6:8]),
		hex.EncodeToString(b[8:10]),
		hex.EncodeToString(b[10:]))
}

func formatDuration(minutes int) string {
	if minutes == 0 {
		return "All questions"
	}
	return fmt.Sprintf("%d minutes", minutes)
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
