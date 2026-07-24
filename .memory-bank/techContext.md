# Technical Context

## Technologies Used

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
- **GitHub Actions**: CI/CD pipeline automation

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

### Project Structure
```
totherescue/
├── src/
│   ├── extract-tokens.ts     # Token extraction
│   ├── load-test.ts          # Load test runner
│   ├── test-chat-api.ts      # API validation
│   └── simple-test.ts        # Quick API test
├── scripts/
│   ├── setup.sh / setup.ps1  # Setup automation
│   └── run-tests.sh / run-tests.ps1  # Test orchestration
├── questions/                # Test questions directory
│   ├── index.json            # Question index (metadata)
│   ├── 01-complexity-1.txt   # Question files
│   └── 02-complexity-5.txt   # Question files
├── results/                  # Test output (gitignored)
├── .env.local                # Tokens (gitignored)
├── package.json
├── tsconfig.json
└── .gitignore
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
CONVERSATION_ID=<UUID>
PAUSE_MINUTES=1
CONCURRENT_SESSIONS=1
DURATION_MINUTES=0
```

### npm Scripts
```json
{
  "extract-tokens": "ts-node src/extract-tokens.ts",
  "test-chat": "ts-node src/test-chat-api.ts",
  "load-test": "ts-node src/load-test.ts",
  "simple-test": "ts-node src/simple-test.ts"
}
```
