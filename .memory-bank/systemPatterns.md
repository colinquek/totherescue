# System Patterns

## Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│  Token Extraction Layer (extract-tokens.ts)            │
│  - Playwright browser automation                        │
│  - Network traffic monitoring                           │
│  - Captures Authorization + X-API-Key headers           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Token Storage (.env.local)                             │
│  - AUTH_TOKEN, API_KEY, GRAPH_TOKEN                     │
│  - Gitignored, never committed                          │
│  - Valid for ~1 hour                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Load Test Runner (load-test.ts)                        │
│  - Reads tokens from .env.local                         │
│  - Sequential question execution                        │
│  - Auto token refresh on 401                            │
│  - Makes direct API calls (no browser)                  │
│  - Collects metrics (response time, tokens, success)    │
│  - Detects -=COMPLETED=- keyword                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Results Storage (results/*.json)                       │
│  - Timestamped JSON files                               │
│  - Per-session breakdown + summary metrics              │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Token Extraction (`src/extract-tokens.ts`)
- Launches Playwright browser (headless: false)
- Navigates to SomeGPT URL
- Monitors network for `/orchestrator/sk-chat/stream` requests
- Extracts `Authorization` and `X-API-Key` headers
- Saves to `.env.local` with timestamp

### 2. Load Test (`src/load-test.ts`)
- Reads configuration from `.env.local`
- Sequential question execution (runs all questions in order)
- Sends requests with Email Intelligence API format:
  ```json
  {
    "message": [[{"type": "text", "text": "question"}]],
    "history": [],
    "config": {
      "expert_routing": {...},
      "memory": {...},
      "graph_token": "default-graph-token"
    },
    "graph_token": "default-graph-token",
    "query": "question text"
  }
  ```
- Auto token refresh on HTTP 401 or "Invalid token"
- Detects `-=COMPLETED=-` keyword in response
- Enforces pause between requests (default: 1 minute)
- Saves metrics to JSON

### 3. Automation Scripts
- `scripts/setup.sh` / `setup.ps1`: Install dependencies
- `scripts/run-tests.sh` / `run-tests.ps1`: Orchestrate workflow
  - Check for `.env.local`
  - Validate tokens with test API call
  - Auto-extract if expired
  - Run email query
  - Display results

## Component Relationships
```
setup.sh → npm install → playwright install
    ↓
run-tests.sh → extract-tokens.ts → .env.local
    ↓
run-tests.sh → load-test.ts → results/*.json
```

## Critical Implementation Paths

### Token Validation Flow
```
1. Check if .env.local exists
2. If yes: Run test-chat (API call)
3. If 200 OK: Proceed with email query
4. If 401 Unauthorized: Re-run extract-tokens
5. Validate again, then proceed
```

### Parallel Session Execution
```typescript
const sessionPromises = [];
for (let i = 0; i < CONCURRENT_SESSIONS; i++) {
  sessionPromises.push(runSession(`session-${i + 1}`));
}
await Promise.all(sessionPromises);
```

### Metrics Aggregation
```typescript
const summary = {
  totalRequests: metrics.reduce((sum, m) => sum + m.totalRequests, 0),
  successRate: (totalSuccessful / totalRequests) * 100,
  avgResponseTime: metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length,
  totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0)
};
```

## API Endpoint

### Current: Email Intelligence API
- **URL**: `https://ncsgptapimiddlewareprod.victoriousglacier-6d23f7bf.southeastasia.azurecontainerapps.io/msagents/api/v1/email-intelligence`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <AUTH_TOKEN>`
  - `X-API-Key: Bearer <API_KEY>`
  - `Content-Type: application/json`
- **Request Body**: Includes `graph_token` field (required)
- **Response**: Server-Sent Events (SSE) stream with BotResponseChunk and JSONChunk

**Note:** The endpoint URL is hardcoded in source files. Token extraction via `npm run extract-tokens` captures auth tokens from browser session.
