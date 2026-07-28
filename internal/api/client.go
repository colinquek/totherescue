package api

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type TextItem struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type MessageItem struct {
	AIModelID    *string        `json:"ai_model_id,omitempty"`
	Metadata     map[string]any `json:"metadata,omitempty"`
	ContentType  string         `json:"content_type"`
	Role         *string        `json:"role,omitempty"`
	Name         *string        `json:"name,omitempty"`
	Items        []TextItem     `json:"items,omitempty"`
	Text         *string        `json:"text,omitempty"`
	Encoding     *string        `json:"encoding,omitempty"`
	FinishReason *string        `json:"finish_reason,omitempty"`
	Status       *string        `json:"status,omitempty"`
}

type ExpertRouting struct {
	ExpertNames []string `json:"expertNames"`
	ForceRoute  bool     `json:"forceRoute"`
	FileProcess bool     `json:"fileProcess"`
}

type ExpertsWithRBAC struct {
	Names    []string `json:"names"`
	HashTime string   `json:"hashTime"`
	Hash     string   `json:"hash"`
}

type Memory struct {
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
}

type ChatConfig struct {
	ExpertRouting   ExpertRouting   `json:"expert_routing"`
	ExpertsWithRBAC ExpertsWithRBAC `json:"experts_with_rbac"`
	Memory          Memory          `json:"memory"`
	GraphToken      string          `json:"graph_token"`
}

type ChatRequest struct {
	Message    [][]TextItem  `json:"message"`
	History    []MessageItem `json:"history"`
	Config     ChatConfig    `json:"config"`
	GraphToken string        `json:"graph_token"`
	Query      string        `json:"query"`
}

type ChatResponse struct {
	Success        bool
	StatusCode     int
	Body           string
	ResponseTimeMs int64
	Tokens         int
	Error          string
	TokenExpired   bool
}

type Client struct {
	httpClient     *http.Client
	endpoint       string
	authToken      string
	apiKey         string
	graphToken     string
	conversationID string
	userAgent      string
	referer        string
}

type ClientConfig struct {
	Endpoint       string
	AuthToken      string
	APIKey         string
	GraphToken     string
	ConversationID string
	UserAgent      string
	Referer        string
}

func NewClient(cfg ClientConfig) *Client {
	if cfg.UserAgent == "" {
		cfg.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
	}
	if cfg.Referer == "" {
		cfg.Referer = "https://ncsgpt.ncs.com.sg/"
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: 5 * time.Minute,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		},
		endpoint:       cfg.Endpoint,
		authToken:      cfg.AuthToken,
		apiKey:         cfg.APIKey,
		graphToken:     cfg.GraphToken,
		conversationID: cfg.ConversationID,
		userAgent:      cfg.UserAgent,
		referer:        cfg.Referer,
	}
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

func (c *Client) SendRequest(ctx context.Context, message string, sessionID string) (*ChatResponse, error) {
	startTime := time.Now()

	graphToken := c.graphToken
	if graphToken == "" {
		graphToken = "default-graph-token"
	}

	sessionID_full := fmt.Sprintf("%s-%s", c.conversationID, sessionID)

	reqBody := ChatRequest{
		Message: [][]TextItem{
			{
				{Type: "text", Text: systemPrompt},
				{Type: "text", Text: message},
			},
		},
		History: []MessageItem{},
		Config: ChatConfig{
			ExpertRouting: ExpertRouting{
				ExpertNames: []string{"GPT 5.4"},
				ForceRoute:  true,
				FileProcess: true,
			},
			ExpertsWithRBAC: ExpertsWithRBAC{
				Names:    []string{},
				HashTime: time.Now().UTC().Format(time.RFC3339),
				Hash:     "load-test",
			},
			Memory: Memory{
				UserID:    "5db3ed13-73b5-4f93-8ce1-2fa7701888e7",
				SessionID: sessionID_full,
			},
			GraphToken: graphToken,
		},
		GraphToken: graphToken,
		Query:      message,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("accept", "*/*")
	req.Header.Set("accept-language", "en-US,en;q=0.9")
	req.Header.Set("authorization", "Bearer "+c.authToken)
	req.Header.Set("x-api-key", "Bearer "+c.apiKey)
	req.Header.Set("content-type", "application/json")
	req.Header.Set("origin", "https://ncsgpt.ncs.com.sg")
	req.Header.Set("referer", fmt.Sprintf("%s?conversation_id=%s", c.referer, c.conversationID))
	req.Header.Set("user-agent", c.userAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	responseTime := time.Since(startTime).Milliseconds()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	bodyStr := string(bodyBytes)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		isTokenExpired := resp.StatusCode == 401 || strings.Contains(bodyStr, "Invalid token")
		return &ChatResponse{
			Success:        false,
			StatusCode:     resp.StatusCode,
			Body:           bodyStr,
			ResponseTimeMs: responseTime,
			Error:          fmt.Sprintf("HTTP %d: %s", resp.StatusCode, truncate(bodyStr, 200)),
			TokenExpired:   isTokenExpired,
		}, nil
	}

	if strings.Contains(bodyStr, "[error]") {
		return &ChatResponse{
			Success:        false,
			StatusCode:     resp.StatusCode,
			Body:           bodyStr,
			ResponseTimeMs: responseTime,
			Error:          truncate(bodyStr, 200),
		}, nil
	}

	tokens := len(bodyStr) / 4

	return &ChatResponse{
		Success:        true,
		StatusCode:     resp.StatusCode,
		Body:           bodyStr,
		ResponseTimeMs: responseTime,
		Tokens:         tokens,
	}, nil
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}
