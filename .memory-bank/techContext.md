# Technical Context

## Technologies Used

### Go Implementation (Primary - Phase 1 Complete)

**Runtime:**
- **Go**: 1.21+ (modules)
- **rod**: v0.116.0 (browser automation)
- **godotenv**: v1.5.0 (.env parsing)
- **net/http**: HTTP client (standard library)

**Dependencies:**
```go
require (
    github.com/go-rod/rod v0.116.0    // Browser automation
    github.com/joho/godotenv v1.5.0   // .env parsing
)
```

**Development Tools:**
- `go build` - Compilation
- `go test` - Testing
- `go vet` - Static analysis
- `gofmt` - Formatting
- `make` - Build automation

**Binary Sizes:**
- extract-tokens: ~14MB
- load-test: ~7.7MB
- test-chat: ~7.4MB

### Node.js/TypeScript (Legacy - Still Functional)

**Runtime:**
- **Node.js**: v18+ (ES modules)
- **TypeScript**: Type-safe development
- **ts-node**: Runtime TypeScript execution

**Dependencies:**
```json
{
  "playwright": "^1.40.0",
  "node-fetch": "^3.3.2",
  "dotenv": "^16.3.1",
  "typescript": "^5.3.0",
  "ts-node": "^10.9.2"
}
```

## Development Setup

### Prerequisites
- Node.js v18 or higher
- npm (comes with Node.js)
- Git

### Installation
```bash
# Clone repo
git clone <repo-url>
cd totherescue

# One-time setup
./scripts/setup.sh        # Linux/Mac/WSL
.\scripts\setup.ps1       # Windows
```

### Project Structure (Current - Node.js)
```
totherescue/
├── src/
│   ├── extract-tokens.ts     # Token extraction (Playwright)
│   ├── load-test.ts          # Load test runner (sequential)
│   ├── test-chat-api.ts      # API validation
│   └── simple-test.ts        # Quick API test
├── scripts/
│   ├── setup.sh / setup.ps1  # Setup automation
│   └── run-tests.sh / run-tests.ps1  # Test orchestration
├── questions/                # Test questions directory
│   ├── index.json            # Question index (10 questions)
│   ├── 01-email_summary.txt
│   ├── 02-unread_mails.txt
│   ├── 03-high_priority_mails.txt
│   ├── 04-sys_alert_mails.txt
│   ├── 05-sys_alert_mails_chart.txt
│   ├── 06-external_emails.txt
│   ├── 07-emails_with_attachments.txt
│   ├── 08-sender_search.txt
│   ├── 09-keyword_search.txt
│   └── 10-unread_high_priority.txt
├── results/                  # Test output (gitignored)
├── .env.local                # Tokens (gitignored)
├── package.json
├── tsconfig.json
└── .gitignore
```

### Implemented Project Structure (Go) - Phase 1 ✅
```
totherescue/
├── cmd/
│   ├── extract-tokens/       # Token extraction CLI (rod-based)
│   ├── load-test/            # Load test CLI (sequential)
│   └── test-chat/            # API validation CLI
├── internal/
│   ├── tokens/               # Token extraction logic (extractor.go)
│   ├── api/                  # HTTP client (client.go + tests)
│   ├── config/               # .env.local parsing (env.go)
│   └── questions/            # Question loader (loader.go + tests)
├── questions/                # Same 10 question files + index.json
├── results/                  # Test output (gitignored)
├── .env.local                # Tokens (gitignored)
├── go.mod                    # Go module definition
├── go.sum                    # Dependency checksums
├── Makefile                  # Build/test/clean targets
└── bin/                      # Compiled binaries (gitignored)
```

## Technical Constraints

### Token Expiration
- JWT tokens valid for ~1 hour
- Scripts auto-detect 401 and re-extract
- Manual login required (Azure AD MFA)

### Browser Automation
- Playwright needs ~150MB for Chromium
- Linux requires system dependencies (~200MB)
- Windows/Mac: No additional deps

### API Format
- Nested message structure: `message: [[{type, text}]]`
- Dual authentication headers required
- SSE streaming response (parse `data: ` prefix)

## Tool Usage Patterns

### Go Commands (Implemented)

**Token Extraction:**
```bash
go run cmd/extract-tokens/main.go
# or
./bin/extract-tokens
# Opens browser → User logs in → Saves .env.local
```

**API Validation:**
```bash
go run cmd/test-chat/main.go
# or
./bin/test-chat
# Sends test message to verify tokens work
```

**Load Testing:**
```bash
go run cmd/load-test/main.go
# or
./bin/load-test
# Runs sequential questions with configured pauses
```

**Build:**
```bash
make build
# Builds all binaries to bin/ directory
```

**Test:**
```bash
make test
# Runs go test ./...
```

### Node.js Commands (Legacy)
```bash
npm run extract-tokens    # Token extraction (Playwright)
npm run test-chat         # API validation
npm run load-test         # Load testing
```

### Orchestration (To Update)
```bash
./scripts/run-tests.sh
# TODO: Update to use Go binaries instead of npm commands
```

### Security Scanning

**Semgrep Configuration:**
- Container: `semgrep/semgrep:latest`
- GitHub Action: Non-blocking scan with `semgrep ci || true`
- Triggers: push, pull_request, workflow_dispatch (manual)
- Output: SARIF format for GitHub Security tab
- Results: 0 findings (clean scan)
```bash
# Local scan with Docker
docker run --rm -v "$(pwd):/src" semgrep/semgrep:latest semgrep ci

# Scan with SARIF output
docker run --rm -v "$(pwd):/src" semgrep/semgrep:latest semgrep ci --sarif --output=semgrep.sarif

# Scan only for secrets
docker run --rm -v "$(pwd):/src" semgrep/semgrep:latest semgrep scan --config p/secrets
```

## Configuration

### Environment Variables (.env.local)
```bash
AUTH_TOKEN=<JWT token>
API_KEY=<JWT token>
GRAPH_TOKEN=<graph token or 'default-graph-token'>
CONVERSATION_ID=<UUID>
PAUSE_MINUTES=1
CONCURRENT_SESSIONS=1
DURATION_MINUTES=0
```

### npm Scripts (Current)
```json
{
  "extract-tokens": "ts-node src/extract-tokens.ts",
  "test-chat": "ts-node src/test-chat-api.ts",
  "load-test": "ts-node src/load-test.ts",
  "simple-test": "ts-node src/simple-test.ts"
}
```

### Go Commands (Planned)
```bash
go run cmd/extract-tokens/main.go   # Token extraction
go run cmd/load-test/main.go        # Load test
go build -o totherescue             # Build binary
```
