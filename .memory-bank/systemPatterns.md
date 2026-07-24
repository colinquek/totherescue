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
│  - AUTH_TOKEN, API_KEY, CONVERSATION_ID                 │
│  - Gitignored, never committed                          │
│  - Valid for ~1 hour                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Load Test Runner (load-test.ts)                        │
│  - Reads tokens from .env.local                         │
│  - Parallel session support                             │
│  - Makes direct API calls (no browser)                  │
│  - Collects metrics (response time, tokens, success)    │
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
- Creates parallel sessions (configurable concurrency)
- Sends requests with exact browser format:
  ```json
  {
    "message": [[{"type": "text", "text": "question"}]],
    "history": [],
    "config": {
      "expert_routing": true,
      "memory": true
    }
  }
  ```
- Enforces pause between requests (default: 1 minute)
- Saves metrics to JSON

### 3. Automation Scripts
- `scripts/setup.sh` / `setup.ps1`: Install dependencies
- `scripts/run-tests.sh` / `run-tests.ps1`: Orchestrate workflow
  - Check for `.env.local`
  - Validate tokens with test API call
  - Auto-extract if expired
  - Run load test
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
3. If 200 OK: Proceed with load test
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
- **URL**: Configured via `API_ENDPOINT` environment variable in `.env.local`
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <AUTH_TOKEN>`
  - `X-API-Key: Bearer <API_KEY>`
  - `Content-Type: application/json`
- **Response**: Server-Sent Events (SSE) stream

**Note:** The endpoint URL is extracted automatically by `npm run extract-tokens` or can be manually captured from browser DevTools Network tab. See README.md "How to Find the API Endpoint" section for details.
