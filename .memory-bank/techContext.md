# Technical Context

## Technologies Used (Current - Node.js/TypeScript)

### Runtime
- **Node.js**: v18+ (ES modules)
- **TypeScript**: Type-safe development
- **ts-node**: Runtime TypeScript execution

### Dependencies
```json
{
  "playwright": "^1.x.x",      // Browser automation
  "node-fetch": "^3.x.x",      // HTTP client
  "typescript": "^5.x.x",      // Type checking
  "ts-node": "^10.x.x",        // TS runtime
  "dotenv": "^16.x.x"          // Env var loading
}
```

### Development Tools
- **Playwright**: Chromium browser automation
- **npm**: Package management
- **Git**: Version control
- **Semgrep**: Security scanning (SAST, secrets detection)

## Planned Technologies (Go Refactor)

### Runtime
- **Go**: 1.21+ (modules)
- **colly** or **rod**: Browser automation (alternative to Playwright)
- **net/http**: HTTP client (standard library)

### Benefits
- Single binary deployment
- No runtime dependencies
- Better concurrency model (goroutines)
- Smaller memory footprint

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

### Planned Project Structure (Go)
```
totherescue/
├── cmd/
│   ├── extract-tokens/       # Token extraction CLI
│   └── load-test/            # Load test CLI
├── internal/
│   ├── tokens/               # Token extraction logic
│   ├── api/                  # API client
│   └── questions/            # Question loader
├── questions/                # Same question files
├── results/                  # Test output
├── .env.local                # Tokens
├── go.mod
└── go.sum
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

### Token Extraction
```bash
npm run extract-tokens
# Opens browser → User logs in → Saves .env.local
```

### Load Testing
```bash
npm run load-test
# Uses .env.local → Runs parallel sessions → Saves results
```

### Orchestration
```bash
./scripts/run-tests.sh
# Validates tokens → Extracts if needed → Runs test → Shows results
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
